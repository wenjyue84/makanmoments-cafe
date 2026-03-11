import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Rule overrides
  {
    rules: {
      // Experimental rule with false positives on valid patterns like
      // reading localStorage/sessionStorage and calling DOM APIs in effects.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Non-Next.js directories co-located in the repo root:
    "backend/**",
    "rainbow-ai/**",
    "scripts/**",
    "tmp/**",
    "website/**",
    "content/**",
    "screenshots/**",
  ]),
]);

export default eslintConfig;
