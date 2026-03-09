import { generateText } from "ai";
import { PRIMARY_MODEL, FALLBACK_MODEL } from "./ai";
import { getSystemPrompt } from "./knowledge";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function handleChat(messages: Message[]): Promise<string> {
  const systemPrompt = getSystemPrompt();

  // Try primary model (Groq), fall back to OpenRouter
  try {
    const result = await generateText({
      model: PRIMARY_MODEL,
      system: systemPrompt,
      messages,
      maxOutputTokens: 512,
      temperature: 0.7,
    });
    return result.text;
  } catch (primaryErr) {
    console.warn("[chat] Primary model failed, trying fallback:", primaryErr);
    try {
      const result = await generateText({
        model: FALLBACK_MODEL,
        system: systemPrompt,
        messages,
        maxOutputTokens: 512,
        temperature: 0.7,
      });
      return result.text;
    } catch (fallbackErr) {
      console.error("[chat] Both models failed:", fallbackErr);
      throw new Error("AI service unavailable. Please try again later.");
    }
  }
}
