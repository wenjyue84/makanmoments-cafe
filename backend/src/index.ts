import "dotenv/config";
import { createServer } from "./server";
import { watchKnowledge } from "./knowledge";
import { startWhatsApp, isWhatsAppReady } from "./whatsapp/manager";

const PORT = parseInt(process.env.PORT || "3031", 10);

async function main() {
  // Watch knowledge files for changes (cache invalidation)
  watchKnowledge();

  // Start Express server
  const app = createServer(isWhatsAppReady);
  app.listen(PORT, () => {
    console.log(`[rainbow] RainbowAI backend running on http://localhost:${PORT}`);
    console.log(`[rainbow] Health: http://localhost:${PORT}/health`);
    console.log(`[rainbow] Chat:   POST http://localhost:${PORT}/api/chat`);
  });

  // Start WhatsApp (only if WHATSAPP_NUMBER is set)
  await startWhatsApp();
}

main().catch((err) => {
  console.error("[rainbow] Fatal error:", err);
  process.exit(1);
});
