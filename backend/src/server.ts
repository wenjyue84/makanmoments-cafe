import express, { Request, Response } from "express";
import { handleChat, Message } from "./chat";

export function createServer(whatsappReady: () => boolean) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      whatsapp: whatsappReady(),
      uptime: Math.floor(process.uptime()),
    });
  });

  app.post("/api/chat", async (req: Request, res: Response) => {
    const { messages } = req.body as { messages?: Message[] };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }

    try {
      const reply = await handleChat(messages);
      res.json({ reply });
    } catch (err: any) {
      console.error("[server] /api/chat error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  return app;
}
