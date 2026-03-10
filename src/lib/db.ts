import { neon, neonConfig } from "@neondatabase/serverless";
import { env } from "./env";

// Reuse the underlying HTTP fetch connection across multiple queries
// in the same serverless invocation — reduces round-trip overhead.
neonConfig.fetchConnectionCache = true;

// Lazy init — connection is established on first query, but DATABASE_URL is
// validated at startup by env.ts and will throw a clear error if missing.
let _db: ReturnType<typeof neon> | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sql = (strings: TemplateStringsArray, ...values: any[]): any => {
  if (!_db) {
    _db = neon(env.DATABASE_URL);
  }
  return _db(strings, ...values);
};

export default sql;
