import { handleChat, Message } from "../chat";

/** Maintain per-sender conversation history (trimmed to last 20 messages) */
const conversations = new Map<string, Message[]>();

export async function handleWhatsAppMessage(
  senderId: string,
  text: string,
  sendReply: (text: string) => Promise<void>
): Promise<void> {
  // Get or initialize conversation history
  if (!conversations.has(senderId)) {
    conversations.set(senderId, []);
  }
  const history = conversations.get(senderId)!;

  // Append user message
  history.push({ role: "user", content: text });

  try {
    const reply = await handleChat(history);

    // Append assistant reply to history
    history.push({ role: "assistant", content: reply });

    // Trim to last 20 messages to stay within token limits
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    await sendReply(reply);
  } catch (err) {
    console.error("[whatsapp/handler] Error generating reply:", err);
    await sendReply(
      "Sorry, I'm having trouble right now. Please try again or call us at the cafe!"
    );
  }
}
