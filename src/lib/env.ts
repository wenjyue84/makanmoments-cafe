import "server-only";
import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ADMIN_JWT_SECRET: z.string().min(1),
  GROQ_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
  const missing = result.error.issues
    .map((issue) => issue.path[0])
    .filter(Boolean);
  const messages = missing.map((key) => `Missing required env var: ${String(key)}`);
  throw new Error(messages.join("\n"));
}

export const env = result.data;
