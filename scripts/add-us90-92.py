import json

with open('prd.json', encoding='utf-8') as f:
    data = json.load(f)

existing_ids = {s['id'] for s in data['userStories']}
if 'US-090' in existing_ids:
    print("US-090 already exists, skipping")
    exit(0)

new_stories = [
    {
        "id": "US-090",
        "title": "AI Waiter: Inject Live DB Menu into System Prompt (Replace Static knowledge/menu-knowledge.md)",
        "priority": 90,
        "description": "The AI waiter reads from a manually-written static file `knowledge/menu-knowledge.md` which is incomplete and out of date — it is missing items like Gyudon, and any items added via admin never appear in AI responses. Fix this by making the system prompt builder query ALL available menu items from the Neon DB at startup and inject them as structured text into the AI context. Cache the result in memory for 5 minutes so it does not hit the DB on every chat message. When admin saves a menu item change, the cache is invalidated so the AI picks up new items immediately.",
        "acceptanceCriteria": [
            "The AI correctly answers questions about ALL menu items in the Neon DB, including Gyudon and any other items not previously in the static file",
            "When asked 'How much is Gyudon?', the AI gives the correct price from the DB",
            "Admin adding a new menu item — AI knows about it within 5 minutes (cache TTL)",
            "The static knowledge/menu-knowledge.md is no longer the source of truth for the AI (can be kept as fallback or deprecated)",
            "The DB query is cached in memory — not executed on every single chat message",
            "Verify: ask AI 'do you have gyudon?' — AI confirms yes with correct price"
        ],
        "technicalNotes": [
            "In src/lib/chat/system-prompt.ts: replace loadKnowledge('menu-knowledge.md') with a DB fetch",
            "Make buildKnowledgeBlock() async: export async function getSystemPrompt(): Promise<string>",
            "Add a new function: async function fetchMenuFromDB(): Promise<string> that queries: SELECT code, name_en, name_ms, name_zh, price, categories, dietary FROM menu_items WHERE available = true ORDER BY sort_order ASC",
            "Format each row as: '- {code} {name_en} ({name_ms} / {name_zh}) — RM {price} | Categories: {categories.join(', ')} | Dietary: {dietary.join(', ')}'",
            "Cache the result: let menuCache: { text: string; expiresAt: number } | null = null — refresh if Date.now() > expiresAt (5 min TTL)",
            "Update invalidateSystemPromptCache() to also clear menuCache",
            "In src/app/api/chat/route.ts: await getSystemPrompt() — update any place that calls getSystemPrompt() to await it",
            "Also call invalidateSystemPromptCache() in PATCH /api/admin/menu/[id]/route.ts after a successful item update",
            "Keep reading cafe-facts.md and faq.md from files as before — only menu is moved to DB"
        ],
        "dependencies": [],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-091",
        "title": "Admin: Manual 'Sync AI Knowledge' Button + Auto-Sync on Menu Save",
        "priority": 91,
        "description": "Add a manual sync button in the admin panel that regenerates knowledge/menu-knowledge.md from the current DB state. This acts as a backup sync in case the in-memory cache (US-090) needs to be force-refreshed, and keeps the markdown file as a human-readable reference. Also: automatically trigger cache invalidation whenever an admin saves a menu item change.",
        "acceptanceCriteria": [
            "A 'Sync AI Menu Knowledge' button exists in /admin > Settings (or Menu tab)",
            "Clicking it regenerates knowledge/menu-knowledge.md from all current DB menu items",
            "A success toast shows 'AI menu knowledge updated — X items synced'",
            "When admin saves a price or name change on a menu item, the AI system prompt cache is automatically invalidated",
            "The newly saved item is reflected in AI responses within the next conversation (no restart needed)",
            "Verify: add a new item in admin, click Sync, ask AI about it — AI knows"
        ],
        "technicalNotes": [
            "Create API route POST /api/admin/sync-ai-knowledge: queries all menu items from DB, formats as markdown, writes to knowledge/menu-knowledge.md using fs.writeFileSync, then calls invalidateSystemPromptCache()",
            "Format: group items by category, write '### {category}\\n- {code} {name_en} — RM {price}\\n' for each item",
            "In the admin UI (admin-settings-panel.tsx or admin-menu-table.tsx): add a button that calls POST /api/admin/sync-ai-knowledge",
            "In PATCH /api/admin/menu/[id]: after successful DB update, call invalidateSystemPromptCache() (import from src/lib/chat/system-prompt.ts)",
            "Show item count in success message: res.json({ success: true, count: items.length })"
        ],
        "dependencies": ["US-090"],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-092",
        "title": "AI Waiter: Distinguish 'Not on Menu' vs 'Not Available Today' in Responses",
        "priority": 92,
        "description": "When a customer asks about a menu item, the AI should give accurate availability responses: (1) if the item is in the DB with available=true, answer normally with price. (2) If the item is in the DB but available=false or filtered out by time/day rules, say 'That item is not available today' rather than 'we don't have it'. (3) If the item genuinely does not exist in the DB, say 'That's not on our menu'. Update the system prompt instructions to guide the AI on this distinction.",
        "acceptanceCriteria": [
            "When asked about an available item (e.g. Gyudon), AI gives correct price and description",
            "When asked about a temporarily unavailable item, AI says something like 'That's not available today, but we do have...' with an alternative suggestion",
            "When asked about something genuinely not on the menu (e.g. Pizza), AI says 'We don't serve pizza' and suggests what the cafe does offer",
            "The AI never confidently denies having an item that exists in the DB",
            "Verify: ask 'do you have gyudon?' — AI says yes with correct price, not 'we don't have it'"
        ],
        "technicalNotes": [
            "Update src/lib/chat/system-prompt.ts: add two separate menu sections to the injected context:",
            "Section 1 (available now): items with available=true filtered by current time/day — 'CURRENTLY AVAILABLE ITEMS:'",
            "Section 2 (temporarily unavailable): items with available=false — 'ITEMS NOT AVAILABLE TODAY (do not say we don't have these, say they are unavailable today):'",
            "Update the system prompt instruction text: add rule 'If a customer asks about an item in the unavailable list, say it is not available today and suggest an alternative. Never say the cafe does not have an item if it appears in either list.'",
            "This requires the DB query in US-090 to fetch ALL items (not just available=true), grouped into available vs unavailable"
        ],
        "dependencies": ["US-090"],
        "estimatedComplexity": "small",
        "passes": False
    }
]

data['userStories'].extend(new_stories)

with open('prd.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'Total stories now: {len(data["userStories"])}')
print(f'New stories added: US-090 to US-092')
print(f'Pending: {sum(1 for s in data["userStories"] if not s["passes"])}')
