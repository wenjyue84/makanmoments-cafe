import { createOpenAI } from "@ai-sdk/openai";

// Use .chat() to force /v1/chat/completions — Groq and OpenRouter do not
// support the new OpenAI Responses API that @ai-sdk/openai v3 defaults to.
export const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY || "",
});

export const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

export const PRIMARY_MODEL = groq.chat("llama-3.3-70b-versatile");
export const FALLBACK_MODEL = openrouter.chat("meta-llama/llama-3.3-70b-instruct");
