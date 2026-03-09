import { neon, neonConfig } from "@neondatabase/serverless";

// Reuse the underlying HTTP fetch connection across multiple queries
// in the same serverless invocation — reduces round-trip overhead.
neonConfig.fetchConnectionCache = true;

// Lazy init — DATABASE_URL is read only when the first query runs,
// not at module load time. This lets the app boot without the env var set.
let _db: ReturnType<typeof neon> | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sql = (strings: TemplateStringsArray, ...values: any[]): any => {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      // Fallback: return empty array so pages render without crashing.
      // Set DATABASE_URL in .env.local to enable real data.
      console.warn(
        "[db] DATABASE_URL is not set — returning empty results. See .env.example."
      );
      return Promise.resolve([]);
    }
    _db = neon(process.env.DATABASE_URL);
  }
  return _db(strings, ...values);
};

export default sql;
