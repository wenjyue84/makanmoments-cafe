import { readFileSync } from "fs";
import { join } from "path";
import { readChatSettings } from "./settings";
import sql from "@/lib/db";

// Static file cache — cleared on invalidation only
let staticKnowledgeCache: { cafeFacts: string; faq: string } | null = null;
// Menu DB cache — auto-expires after 5 minutes
let menuCache: { text: string; expiresAt: number } | null = null;

const MENU_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function loadKnowledge(filename: string): string {
  try {
    return readFileSync(
      join(process.cwd(), "knowledge", filename),
      "utf-8"
    );
  } catch {
    return "";
  }
}

async function fetchMenuFromDB(): Promise<string> {
  if (menuCache && Date.now() < menuCache.expiresAt) {
    return menuCache.text;
  }

  try {
    const rows = await sql`
      SELECT code, name_en, name_ms, name_zh, price, categories, dietary
      FROM menu_items
      WHERE available = true
      ORDER BY sort_order ASC
    `;

    if (!rows || rows.length === 0) {
      return loadKnowledge("menu-knowledge.md");
    }

    const lines = rows.map((row: {
      code: string;
      name_en: string;
      name_ms: string;
      name_zh: string;
      price: string | number;
      categories: string[];
      dietary: string[];
    }) => {
      const categories = Array.isArray(row.categories) ? row.categories.join(", ") : row.categories;
      const dietary = Array.isArray(row.dietary) ? row.dietary.join(", ") : row.dietary;
      return `- ${row.code} ${row.name_en} (${row.name_ms} / ${row.name_zh}) — RM ${row.price} | Categories: ${categories} | Dietary: ${dietary}`;
    });

    const text = lines.join("\n");
    menuCache = { text, expiresAt: Date.now() + MENU_CACHE_TTL_MS };
    return text;
  } catch (err) {
    console.error("[system-prompt] Failed to fetch menu from DB, falling back to static file:", err);
    return loadKnowledge("menu-knowledge.md");
  }
}

async function buildKnowledgeBlock(): Promise<string> {
  // Static files cached until manually invalidated
  if (!staticKnowledgeCache) {
    staticKnowledgeCache = {
      cafeFacts: loadKnowledge("cafe-facts.md"),
      faq: loadKnowledge("faq.md"),
    };
  }

  // Menu fetched from DB with 5-min TTL
  const menuKnowledge = await fetchMenuFromDB();

  return `## Cafe Facts
${staticKnowledgeCache.cafeFacts}

## Menu Knowledge (Live from Database)
${menuKnowledge}

## FAQ
${staticKnowledgeCache.faq}`;
}

export function invalidateSystemPromptCache(): void {
  staticKnowledgeCache = null;
  menuCache = null;
}

export async function getSystemPrompt(): Promise<string> {
  const settings = readChatSettings();
  const knowledge = await buildKnowledgeBlock();

  const base = `You are the AI Waiter for Makan Moments Cafe (食光记忆 / Kafe Kenangan Makan), a Thai-Malaysian fusion cafe in Skudai, Johor, Malaysia.

## Your Role
- Help customers with menu inquiries, recommendations, and cafe information
- Be friendly, warm, and helpful — like a real waiter
- Respond in the SAME LANGUAGE the customer uses (English, Malay, or Chinese)
- If unsure about the language, default to the language of the most recent message
- Keep responses concise (2-4 sentences for simple questions, more for detailed recommendations)
- Use prices in RM (Malaysian Ringgit)

## Important Rules
- NEVER make up menu items or prices — only reference items from the knowledge below
- If asked about something not on the menu, say so honestly
- For allergy or dietary questions, mention that the cafe is NO PORK, NO LARD, Halal-friendly
- When a customer says they want to order or add something, ALWAYS call the \`addToTray\` tool to add it for them
- Do not ask for payment details or process checkout — tell them to show their tray to the human waiter when they are ready
- If they order a main dish, ask if they want any drinks or add-ons (like an egg)
- Be an active seller! If they say "give me 1 nasi lemak", you add it via tool and reply "Added Nasi Lemak to your tray! Would you like to try our famous Thai Milk Tea with that?"
- If asked about delivery, mention they can visit the cafe at Taman Impian Emas, Skudai

${knowledge}`;

  if (settings.systemPromptPrefix && settings.systemPromptPrefix.trim()) {
    return `${settings.systemPromptPrefix.trim()}\n\n${base}`;
  }

  return base;
}
