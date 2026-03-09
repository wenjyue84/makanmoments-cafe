import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SETTINGS_PATH = join(process.cwd(), "data", "chat-settings.json");

export interface ChatSettings {
  systemPromptPrefix: string;
  model: "groq" | "openrouter";
  temperature: number;
}

export const DEFAULT_SETTINGS: ChatSettings = {
  systemPromptPrefix: "",
  model: "groq",
  temperature: 0.7,
};

export function readChatSettings(): ChatSettings {
  try {
    if (!existsSync(SETTINGS_PATH)) return { ...DEFAULT_SETTINGS };
    const raw = readFileSync(SETTINGS_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      systemPromptPrefix:
        typeof parsed.systemPromptPrefix === "string"
          ? parsed.systemPromptPrefix
          : DEFAULT_SETTINGS.systemPromptPrefix,
      model:
        parsed.model === "groq" || parsed.model === "openrouter"
          ? parsed.model
          : DEFAULT_SETTINGS.model,
      temperature:
        typeof parsed.temperature === "number" &&
        parsed.temperature >= 0 &&
        parsed.temperature <= 2
          ? parsed.temperature
          : DEFAULT_SETTINGS.temperature,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function writeChatSettings(settings: ChatSettings): void {
  const dir = join(process.cwd(), "data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
}
