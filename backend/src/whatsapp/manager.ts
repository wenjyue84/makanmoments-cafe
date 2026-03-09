import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { handleWhatsAppMessage } from "./handler";

let isReady = false;

export function isWhatsAppReady(): boolean {
  return isReady;
}

export async function startWhatsApp(): Promise<void> {
  const waNumber = process.env.WHATSAPP_NUMBER;
  if (!waNumber) {
    console.log("[whatsapp] WHATSAPP_NUMBER not set — running in website-only mode");
    return;
  }

  const authDir = resolve(
    process.env.WHATSAPP_AUTH_DIR || "./whatsapp-auth"
  );
  if (!existsSync(authDir)) {
    mkdirSync(authDir, { recursive: true });
  }

  // Dynamic import so Baileys doesn't load when WhatsApp is disabled
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
  } = await import("@whiskeysockets/baileys");

  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      isReady = false;
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(
        `[whatsapp] Connection closed (code=${statusCode}), reconnect=${shouldReconnect}`
      );
      if (shouldReconnect) {
        setTimeout(() => startWhatsApp(), 5000);
      }
    } else if (connection === "open") {
      isReady = true;
      console.log(`[whatsapp] Connected as ${waNumber}`);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages: msgs, type }) => {
    if (type !== "notify") return;

    for (const msg of msgs) {
      // Skip outgoing messages and non-text messages
      if (msg.key.fromMe) continue;

      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        "";

      if (!text.trim()) continue;

      const senderId = msg.key.remoteJid!;
      console.log(`[whatsapp] Message from ${senderId}: ${text}`);

      await handleWhatsAppMessage(senderId, text, async (reply) => {
        await sock.sendMessage(senderId, { text: reply });
      });
    }
  });
}
