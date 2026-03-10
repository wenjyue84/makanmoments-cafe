import { streamText, type UIMessage, tool } from "ai";
import { z } from "zod";
import { groq, openrouter } from "@/lib/chat/provider";
import { getSystemPrompt } from "@/lib/chat/system-prompt";
import { readChatSettings } from "@/lib/chat/settings";
import { checkRateLimit } from "@/lib/chat/rate-limit";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  // Rate limiting
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";

  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded" }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rateCheck.retryAfter || 60),
        },
      }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }
  const { messages } = body as { messages: UIMessage[] };
  if (!messages) {
    return new Response(JSON.stringify({ error: "No messages" }), { status: 400 });
  }

  // Load admin-configurable settings on each request so changes apply immediately
  const settings = readChatSettings();
  const primaryModel =
    settings.model === "openrouter"
      ? openrouter.chat("meta-llama/llama-3.3-70b-instruct")
      : groq.chat("llama-3.3-70b-versatile");
  const fallbackModel =
    settings.model === "openrouter"
      ? groq.chat("llama-3.3-70b-versatile")
      : openrouter.chat("meta-llama/llama-3.3-70b-instruct");

  // Truncate to last 20 messages to keep context manageable
  const truncated = messages.slice(-20);
  const systemPrompt = getSystemPrompt();

  // Manually extract text from UIMessage parts — convertToModelMessages
  // crashes on manually-constructed assistant messages (no step metadata).
  const modelMessages = truncated
    .map((msg) => {
      const text = (msg.parts as any[])
        ?.filter((p: any) => p.type === "text")
        .map((p: any) => p.text as string)
        .join("") ?? "";
      return { role: msg.role as "user" | "assistant" | "system", content: text };
    })
    .filter((m) => m.content.trim() !== "");

  console.log("[chat] modelMessages:", JSON.stringify(modelMessages));

  const addToTrayTool = tool({
    description:
      "Adds an item to the customer's tray/order builder. Call this whenever a customer says they want to order or add an item. You MUST provide the exact item ID, name, and price from the menu.",
    // @ts-expect-error - AI SDK type mismatch with zod
    parameters: z.object({
      id: z.string().describe("The item ID from the menu, e.g. BF01"),
      name: z.string().describe("The name of the item"),
      price: z.number().describe("The exact numeric price of the item in RM"),
    }),
  });

  try {
    // Try primary model
    const result = streamText({
      model: primaryModel,
      system: systemPrompt,
      messages: modelMessages,
      temperature: settings.temperature,
      tools: { addToTray: addToTrayTool },
    });

    return result.toUIMessageStreamResponse();
  } catch (primaryError) {
    console.error("Primary model failed:", primaryError);

    try {
      // Fallback to other provider
      const result = streamText({
        model: fallbackModel,
        system: systemPrompt,
        messages: modelMessages,
        temperature: settings.temperature,
        tools: { addToTray: addToTrayTool },
      });

      return result.toUIMessageStreamResponse();
    } catch (fallbackError) {
      console.error("Fallback model also failed:", fallbackError);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
  }
}
