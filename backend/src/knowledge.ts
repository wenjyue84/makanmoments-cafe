import { readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";

const KNOWLEDGE_DIR = resolve(
  __dirname,
  "..",
  process.env.KNOWLEDGE_DIR || "../knowledge"
);

let cachedPrompt: string | null = null;

function loadFile(filename: string): string {
  try {
    return readFileSync(join(KNOWLEDGE_DIR, filename), "utf-8");
  } catch {
    return "";
  }
}

export function getSystemPrompt(): string {
  if (cachedPrompt) return cachedPrompt;

  const menuKnowledge = loadFile("menu-knowledge.md");
  const cafeFacts = loadFile("cafe-facts.md");
  const faq = loadFile("faq.md");

  cachedPrompt = `You are the AI Waiter for Makan Moments Cafe (食光记忆 / Kafe Kenangan Makan), a Thai-Malaysian fusion cafe in Skudai, Johor, Malaysia.

## Your Role
- Help customers with menu inquiries, recommendations, and cafe information
- Be friendly, warm, and helpful — like a real waiter
- Respond in the SAME LANGUAGE the customer uses (English, Malay, or Chinese)
- Keep responses concise (2-4 sentences for simple questions, more for detailed recommendations)
- Use prices in RM (Malaysian Ringgit)

## Important Rules
- NEVER make up menu items or prices — only reference items from the knowledge below
- If asked about something not on the menu, say so honestly
- For allergy or dietary questions, mention that the cafe is NO PORK, NO LARD, Halal-friendly
- If they ask about delivery, mention they can visit the cafe at Taman Impian Emas, Skudai

## Cafe Facts
${cafeFacts}

## Menu Knowledge
${menuKnowledge}

## FAQ
${faq}
`;

  return cachedPrompt;
}

/** Call this to bust the cache when knowledge files change */
export function invalidatePromptCache(): void {
  cachedPrompt = null;
}

export function watchKnowledge(): void {
  try {
    const files = readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const { watch } = require("fs");
      watch(join(KNOWLEDGE_DIR, file), () => {
        console.log(`[knowledge] ${file} changed — cache invalidated`);
        invalidatePromptCache();
      });
    }
    console.log(`[knowledge] Watching ${files.length} files in ${KNOWLEDGE_DIR}`);
  } catch (err) {
    console.warn("[knowledge] Could not watch knowledge dir:", err);
  }
}
