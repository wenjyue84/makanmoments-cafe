import { generateText } from "ai";
import { groq, openrouter } from "@/lib/chat/provider";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const RULE_SYSTEM_PROMPT = `You are a rule configuration assistant for a cafe management system.
The admin describes a menu rule in natural language. Return ONLY a valid JSON object — no markdown, no explanation.

Rule schema:
{
  "name": string,            // Short descriptive name for this rule
  "ruleType": "disable" | "discount" | "featured",
  "targetType": "category" | "items",
  "targetCategories": string[],  // Only from the provided category list; empty for "items" targetType
  "value": number,           // Discount percentage 1-100; use 0 for disable/featured
  "timeFrom": string,        // "HH:MM" 24h format, or "" if no daily window
  "timeUntil": string,       // "HH:MM" 24h format, or "" if no daily window
  "active": true
}

RuleType meanings:
- "disable": hide items from menu
- "discount": apply a percentage discount (set value = the percentage)
- "featured": promote/highlight items

Time window hints: "lunch" = 11:00–15:00, "dinner" = 18:00–22:00, "morning/breakfast" = 07:00–11:00, "after 7PM" → timeFrom = "19:00" timeUntil = "23:59"

Rules:
- If admin says "except lemon tea" or mentions a specific item, still pick "category" targetType (item exclusions are handled separately)
- ONLY use category names from the provided list
- Return pure JSON only`;

interface SuggestedRule {
  name: string;
  ruleType: "disable" | "discount" | "featured";
  targetType: "category" | "items";
  targetCategories: string[];
  value: number;
  timeFrom: string;
  timeUntil: string;
  active: boolean;
}

export async function POST(req: NextRequest) {
  let description: string;
  let categories: string[];

  try {
    const body = await req.json();
    description = body.description ?? "";
    categories = Array.isArray(body.categories) ? body.categories : [];
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!description.trim()) {
    return Response.json({ error: "description is required" }, { status: 400 });
  }

  const userPrompt = `Available categories: ${categories.join(", ") || "(none)"}\n\nAdmin rule request: "${description}"`;

  let text: string;
  try {
    const result = await generateText({
      model: groq.chat("llama-3.3-70b-versatile"),
      system: RULE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.1,
      maxOutputTokens: 400,
    });
    text = result.text;
  } catch {
    try {
      const result = await generateText({
        model: openrouter.chat("meta-llama/llama-3.3-70b-instruct"),
        system: RULE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.1,
        maxOutputTokens: 400,
      });
      text = result.text;
    } catch (fallbackErr) {
      console.error("[ai-suggest] Both models failed:", fallbackErr);
      return Response.json({ error: "AI service unavailable" }, { status: 503 });
    }
  }

  // Extract JSON from response (AI sometimes wraps in markdown)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return Response.json({ error: "AI returned invalid response" }, { status: 422 });
  }

  let raw: Partial<SuggestedRule>;
  try {
    raw = JSON.parse(jsonMatch[0]);
  } catch {
    return Response.json({ error: "AI returned malformed JSON" }, { status: 422 });
  }

  if (!raw.name || !raw.ruleType || !raw.targetType) {
    return Response.json({ error: "AI returned incomplete suggestion" }, { status: 422 });
  }

  // Sanitize — only allow valid enum values
  const ruleType = (["disable", "discount", "featured"] as const).includes(raw.ruleType as any)
    ? (raw.ruleType as SuggestedRule["ruleType"])
    : "disable";
  const targetType = (["category", "items"] as const).includes(raw.targetType as any)
    ? (raw.targetType as SuggestedRule["targetType"])
    : "category";

  // Only keep categories that actually exist
  const targetCategories = Array.isArray(raw.targetCategories)
    ? raw.targetCategories.filter((c) => categories.includes(c))
    : [];

  const suggestion: SuggestedRule = {
    name: String(raw.name).slice(0, 120),
    ruleType,
    targetType,
    targetCategories,
    value: ruleType === "discount" ? Math.min(100, Math.max(0, Number(raw.value) || 0)) : 0,
    timeFrom: typeof raw.timeFrom === "string" ? raw.timeFrom : "",
    timeUntil: typeof raw.timeUntil === "string" ? raw.timeUntil : "",
    active: true,
  };

  return Response.json({ suggestion });
}
