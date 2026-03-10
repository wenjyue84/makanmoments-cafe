import { generateText } from "ai";
import { groq, openrouter } from "@/lib/chat/provider";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT =
  "You are a food translator specializing in Southeast Asian cuisine. Translate the dish name accurately and naturally for a cafe menu. Return ONLY the translated name — no explanation, no punctuation, no quotes.";

export async function POST(req: NextRequest) {
  let nameEn: string;
  let targetLanguage: string;

  try {
    const body = await req.json();
    nameEn = body.nameEn ?? "";
    targetLanguage = body.targetLanguage ?? "";
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!nameEn.trim()) {
    return Response.json({ error: "nameEn is required" }, { status: 400 });
  }
  if (targetLanguage !== "ms" && targetLanguage !== "zh") {
    return Response.json(
      { error: "targetLanguage must be 'ms' or 'zh'" },
      { status: 400 }
    );
  }

  const langLabel =
    targetLanguage === "ms"
      ? "Malay (Bahasa Melayu)"
      : "Chinese Simplified (中文简体)";
  const userPrompt = `Translate this cafe dish name to ${langLabel}: "${nameEn}"`;

  let text: string;
  try {
    const result = await generateText({
      model: groq.chat("llama-3.3-70b-versatile"),
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.2,
      maxOutputTokens: 60,
    });
    text = result.text.trim();
  } catch {
    try {
      const result = await generateText({
        model: openrouter.chat("meta-llama/llama-3.3-70b-instruct"),
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.2,
        maxOutputTokens: 60,
      });
      text = result.text.trim();
    } catch (fallbackErr) {
      console.error("[menu/translate] Both models failed:", fallbackErr);
      return Response.json({ error: "AI service unavailable" }, { status: 503 });
    }
  }

  // Strip surrounding quotes if AI returned them
  const translation = text.replace(/^["'「」『』""]|["'「」『』""]$/g, "").trim();

  return Response.json({ "translation": translation });
}
