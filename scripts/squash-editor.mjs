/**
 * GIT_SEQUENCE_EDITOR for atomic commit squash.
 * Groups retried commits by US story ID → first = pick, rest = fixup.
 * Chore/progress commits are fixup'd into the nearest preceding story.
 *
 * Usage:
 *   GIT_SEQUENCE_EDITOR='node scripts/squash-editor.mjs' git rebase -i bcde607
 */
import { readFileSync, writeFileSync } from "fs";

const file = process.argv[2];
const lines = readFileSync(file, "utf8").split("\n");

// Extract the US-NNN id from a commit message
function storyId(msg) {
  const m = msg.match(/US-(\d+)/i);
  return m ? `US-${m[1]}` : null;
}

// Group key — same-story retries should be grouped
function groupKey(msg) {
  const id = storyId(msg);
  if (id) return id;
  // Non-story commits get their own unique key so they're kept
  return null;
}

const seen = new Set();
const result = [];

for (const line of lines) {
  // Keep comments and blank lines as-is
  if (line.startsWith("#") || line.trim() === "") {
    result.push(line);
    continue;
  }

  const parts = line.split(" ");
  const action = parts[0]; // pick/squash/etc (original)
  const hash = parts[1];
  const msg = parts.slice(2).join(" ");

  // Skip "exec" lines if any
  if (action === "exec" || action === "label" || action === "reset") {
    result.push(line);
    continue;
  }

  const key = groupKey(msg);

  if (!key) {
    // Non-story commit (mobile polish, redesign, AI hub, etc.) — always pick
    result.push(`pick ${hash} ${msg}`);
  } else if (!seen.has(key)) {
    // First commit for this story → pick
    seen.add(key);
    result.push(`pick ${hash} ${msg}`);
  } else {
    // Retry → fixup (discard commit message, keep changes)
    result.push(`fixup ${hash} ${msg}`);
  }
}

writeFileSync(file, result.join("\n"));
console.log("Squash plan written.");
