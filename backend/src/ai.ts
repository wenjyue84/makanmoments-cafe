import { createOpenAI } from "@ai-sdk/openai";

export const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY || "",
});

export const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

export const PRIMARY_MODEL = groq("llama-3.3-70b-versatile");
export const FALLBACK_MODEL = openrouter("meta-llama/llama-3.3-70b-instruct");
