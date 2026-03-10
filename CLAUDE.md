# CLAUDE.md — Makan Moments Cafe Website

> **Project:** makanmoments.cafe — Thai-Malaysian fusion cafe website with multilingual support, Notion CMS, and AI waiter chatbot.

## Project Overview

Public-facing website for **Makan Moments Cafe** (食光记忆 / Kafe Kenangan Makan), located in Taman Impian Emas, Skudai, Johor, Malaysia.

**Live site:** https://makanmoments.cafe
**Deploy:** Vercel (`.vercel/` config present)

### Pre-Order System

Customers can pre-order food online before arriving at the cafe. **FeedMe POS has no API** — there is intentionally no direct integration. The workflow is:

1. **Customer** browses menu → adds items → submits pre-order with name, phone, arrival time, pax count, and notes
2. **System** saves order to Notion (`NOTION_ORDERS_DB_ID`) and sends WhatsApp notification to the waiter's phone
3. **Waiter** receives WhatsApp message with full order details → manually types the order into FeedMe POS before the customer arrives
4. **Customer** arrives to find their meal being prepared or ready

This human-in-the-loop design is deliberate: FeedMe handles payments and receipts; the website handles intake and routing.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| Language | TypeScript 5 |
| i18n | next-intl (EN / MS / ZH, always-prefixed) |
| CMS | Notion API (`@notionhq/client`) |
| AI Chat | Vercel AI SDK + Groq / OpenRouter |
| Icons | Lucide React |
| Sitemap | next-sitemap |

## Project Structure

```
makanmoments.cafe/
├── src/
│   ├── app/
│   │   ├── [locale]/           # All public pages (locale-prefixed)
│   │   │   ├── page.tsx        # Home
│   │   │   ├── menu/page.tsx   # Menu listing
│   │   │   ├── order/          # Pre-order flow
│   │   │   │   ├── page.tsx    # Order form (browse menu + cart + submit)
│   │   │   │   └── confirm/page.tsx  # Order confirmation page
│   │   │   ├── blog/           # Blog listing + slug pages
│   │   │   ├── about/page.tsx
│   │   │   └── contact/page.tsx
│   │   ├── api/
│   │   │   ├── chat/route.ts   # AI waiter chat endpoint
│   │   │   └── orders/
│   │   │       └── route.ts    # POST /api/orders — save to Notion + notify waiter via WhatsApp
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Global styles (Tailwind)
│   ├── components/
│   │   ├── blog/               # post-card, post-content
│   │   ├── chat/               # chat-bubble, chat-panel, chat-widget
│   │   ├── home/               # hero-section, highlights, info-strip
│   │   ├── layout/             # header, footer
│   │   ├── menu/               # menu-card, menu-filter, menu-grid, dietary-badge
│   │   ├── order/              # order-cart, order-form, order-item, order-summary
│   │   ├── seo/                # json-ld
│   │   └── ui/                 # shadcn/ui primitives (button, etc.)
│   ├── i18n/
│   │   ├── routing.ts          # Locales: ["en", "ms", "zh"], defaultLocale: "en"
│   │   ├── navigation.ts       # Typed Link/redirect helpers
│   │   └── request.ts          # next-intl config entrypoint
│   ├── lib/
│   │   ├── constants.ts        # CAFE info, MENU_CATEGORIES
│   │   ├── menu.ts             # Notion menu data fetching
│   │   ├── blog.ts             # Notion blog data fetching
│   │   ├── notion.ts           # Notion client singleton
│   │   ├── orders.ts           # Save pre-order to Notion orders DB
│   │   ├── whatsapp.ts         # Send WhatsApp notification via Periskope/Baileys
│   │   ├── utils.ts            # cn() and helpers
│   │   └── chat/
│   │       ├── provider.ts     # AI SDK model config (Groq/OpenRouter)
│   │       ├── rate-limit.ts   # Per-IP rate limiting
│   │       └── system-prompt.ts # Loads knowledge/ files into AI system prompt
│   └── types/
│       ├── menu.ts             # MenuItem, MenuCategory types
│       ├── blog.ts             # BlogPost types
│       └── order.ts            # PreOrder, OrderItem, OrderStatus types
├── knowledge/                  # AI waiter knowledge base (markdown)
│   ├── cafe-facts.md           # Hours, address, WiFi, ambiance
│   ├── menu-knowledge.md       # Full menu with prices for AI context
│   └── faq.md                  # Frequently asked questions
├── messages/                   # i18n translation files
│   ├── en.json
│   ├── ms.json
│   └── zh.json
├── public/                     # Static assets (images, icons)
├── scripts/                    # Utility scripts
├── middleware.ts               # next-intl locale detection
├── next.config.ts              # Turbopack + next-intl plugin
├── components.json             # shadcn/ui config
├── .env.local                  # Local env vars (not committed)
└── .env.example                # Env var template
```

## Dev Commands

```bash
npm run dev       # Start dev server on http://localhost:3030 — PORT LOCKED: always use 3030, do NOT change
npm run build     # Production build + generates sitemap (postbuild)
npm run start     # Serve production build
npm run lint      # ESLint check
```

> **PORT 3030 — LOCKED.** Dev server runs on http://localhost:3030 (confirmed working).
> Navigate to http://localhost:3030/en (middleware redirects / → /en automatically).
> Do NOT change this port unless explicitly instructed.

## Environment Variables

See `.env.example` for all required vars:

| Variable | Purpose |
|----------|---------|
| `NOTION_API_KEY` | Notion integration token |
| `NOTION_MENU_DB_ID` | Notion database ID for menu items |
| `NOTION_BLOG_DB_ID` | Notion database ID for blog posts |
| `GROQ_API_KEY` | Groq API key for AI waiter |
| `OPENROUTER_API_KEY` | OpenRouter fallback for AI waiter |
| `NEXT_PUBLIC_SITE_URL` | Production URL (https://makanmoments.cafe) |
| `NOTION_ORDERS_DB_ID` | Notion database ID for pre-orders (separate from menu/blog) |
| `WAITER_WHATSAPP_NUMBER` | Waiter's WhatsApp number to receive order notifications (e.g. `601XXXXXXXX`) |
| `WHATSAPP_API_URL` | WhatsApp send endpoint (Periskope or Baileys) |
| `WHATSAPP_API_KEY` | API key / token for WhatsApp sender |

## Key Conventions

### Localization
- All page routes live under `src/app/[locale]/`
- Supported locales: `en`, `ms`, `zh` — always prefix in URL (e.g. `/en/menu`)
- Translations in `messages/{locale}.json`
- Use `useTranslations()` in client components, `getTranslations()` in server components

### Data Fetching
- Menu and blog data fetched from Notion via `src/lib/notion.ts`
- `src/lib/menu.ts` and `src/lib/blog.ts` wrap Notion queries with typed results
- All Notion fetches are server-side (RSC or route handlers)

### Pre-Order System

**Flow overview:**

```
Customer → /order page → selects items + fills form → POST /api/orders
  → Notion (stores order) + WhatsApp (notifies waiter)
  → Customer sees /order/confirm page with order summary
  → Waiter reads WhatsApp → manually enters into FeedMe POS
  → Customer arrives → food is ready / being prepared
```

**Order form fields (customer-facing):**
- Name (required)
- Phone number (required — for waiter to call if needed)
- Arrival date + time (required)
- Number of pax (required)
- Items with quantity (required — from menu)
- Special requests / notes (optional — e.g. "no spicy", "extra rice")

**Notion Orders database schema:**
| Field | Type | Notes |
|-------|------|-------|
| Name | Title | Customer name |
| Phone | Phone | Customer phone |
| Arrival Time | Date | When they plan to arrive |
| Pax | Number | Party size |
| Items | Rich Text | JSON string of [{name, qty, price}] |
| Total (RM) | Number | Calculated total |
| Notes | Rich Text | Special requests |
| Status | Select | Pending / Confirmed / Cancelled |
| Submitted At | Date | Timestamp of submission |

**WhatsApp notification format (sent to waiter):**
```
🍽 New Pre-Order!
👤 Name: [name] | 📞 [phone]
🕐 Arriving: [date] [time] | 👥 [pax] pax

Order:
• [Item] x[qty] — RM[price]
• [Item] x[qty] — RM[price]

Total: RM[total]
📝 Notes: [notes]

Please enter into FeedMe POS before arrival.
```

**FeedMe POS — Manual Entry Protocol:**
- FeedMe has **no API** — never attempt programmatic integration
- Waiter enters order manually after receiving WhatsApp notification
- Lead time target: customer should arrive to food already in queue
- If customer calls to modify order: waiter updates FeedMe directly
- Notion order status is updated manually by staff (Pending → Confirmed / Cancelled)

**Cart state:** Held in `localStorage` (client-side only). No server session needed. Cart is cleared on successful order submission.

**Rate limiting:** Apply same per-IP limits as chat (`src/lib/chat/rate-limit.ts`) to `POST /api/orders` — max 3 orders per IP per hour.

### AI Waiter Chat
- Chat widget floats on every page (injected via `[locale]/layout.tsx`)
- API route: `POST /api/chat` — uses Vercel AI SDK streaming
- System prompt auto-loads all 3 `knowledge/*.md` files at startup (cached in memory)
- To update cafe info/menu for the AI: edit `knowledge/` markdown files directly
- Rate limiting applied per IP in `src/lib/chat/rate-limit.ts`

### Components
- shadcn/ui for UI primitives (`src/components/ui/`)
- Feature components co-located by domain: `blog/`, `chat/`, `home/`, `menu/`, `layout/`
- `cn()` utility in `src/lib/utils.ts` for conditional Tailwind classes

### Cafe Facts (Single Source of Truth)
- `src/lib/constants.ts` — `CAFE` object with name, address, hours, social links, etc.
- Use this for all on-page references; don't hardcode cafe info in components

### Mobile-First Design
- **Default to mobile viewport** — design at 390px, enhance at sm (640px) and lg (1024px)
- **Touch targets ≥ 44px** — all buttons, links, and interactive elements (use `min-h-[44px]`)
- **Hero section must show visuals on mobile** — no `hidden lg:block` on hero imagery
- **Test on low-end Android + slow 3G** before deploying any UI changes
- **Image priority order:** LCP image on mobile must have `priority` prop
- **No horizontal scroll** — verify at 390px and 414px widths
- **Animations:** Use `prefers-reduced-motion` media query for all animations
- **One CTA above the fold on mobile** — primary action only; secondary CTA hidden on mobile (`hidden sm:inline-flex`)
- **No hover-only interactions** — every hover effect needs a tap equivalent
- **Food images are the product** — show them immediately above the fold on mobile

### Performance (Lightning Fast Landing)
- **LCP target:** < 2.5s on mobile 3G (Lighthouse mobile score ≥ 85)
- **No render-blocking resources** in `<head>`
- **Hero image:** `priority={true}` on mobile LCP image; explicit `sizes` prop on all images
- **Fonts:** `display: "swap"` always; `preload: false` on Noto Sans SC (CJK only loaded for zh locale)
- **ISR on home page:** `revalidate = 3600`
- **No client-side data fetching on home page** — all data server-side (RSC)
- **Image cache:** `minimumCacheTTL: 86400` set in `next.config.ts`
- **Decorative elements:** hide on mobile (`hidden lg:block`) to reduce paint cost
- **Info-strip and similar static display components:** use RSC (`getTranslations`) not client hooks

## Design Context

### Users
Local Johor Bahru residents (families, young professionals, students), plus occasional tourists passing through Skudai. They're on mobile phones, browsing during lunch breaks or while deciding where to eat. The job to be done: quickly feel the vibe, find the menu and prices, and get directions. They want to feel like they've already discovered a gem before they walk in.

### Brand Personality
**Authentic · Cultural · Soulful** — Makan Moments is not just food; it's the story of Thai-Malaysian fusion told through a neighbourhood corner shop. The brand feels like a well-loved place, not a chain. Multilingual identity (English / Bahasa / Chinese) is a feature, not an afterthought. Warmth is the core emotion.

### Aesthetic Direction
**Organic / Earthy** — Warm linen backgrounds, terracotta and amber tones (already defined in OKLCH palette), botanical touches, handcrafted texture. Inspired by editorial food publications from Southeast Asia. References: natural materials, indoor plants (matches real café ambiance), hand-drawn wall art. Anti-references: generic tech startup aesthetics, cyan/purple gradients, glassmorphism, neon-on-dark. Cuisine should be the visual hero — food photography front and centre always.

### Theme
Light mode as default (warm cream background, not pure white — already defined). Dark mode toggle available. Both modes should feel earthy and warm, never cold or blue-tinted.

### Logo
User has a logo image file (PNG/SVG). Place at `public/images/logo.png` (or `.svg`) and update header + footer to use it. Until provided, use bold text wordmark.

### Design Principles
1. **Food first** — every page should make the viewer hungry within 3 seconds
2. **Handcrafted over polished** — slight imperfection, texture, and warmth beats clinical perfection
3. **Mobile = primary** — design at 390px first; desktop is enhancement
4. **Multilingual by default** — typography must work across Latin, Malay, and CJK scripts
5. **Moments, not transactions** — tone is storytelling, not sales; the word "Makan" (eat) and "Moments" imply memory and gathering, lean into that

---

## Critical Rules

1. **Read before editing** — always read a file before modifying it
2. **Notion is the CMS** — menu/blog content lives in Notion, not in code
3. **`knowledge/` drives the AI** — updating these files updates what the AI waiter knows
4. **No pork, no lard, Halal-friendly** — always preserve this dietary info accurately
5. **3 languages always** — any new user-facing text needs translations in all 3 `messages/` files
6. **Prices in RM** — all price references use Malaysian Ringgit (RM)
7. **FeedMe has NO API** — never attempt direct POS integration; all order routing goes through WhatsApp → manual waiter entry
8. **Pre-orders are intent, not payment** — no payment is collected online; customer pays at the cafe via FeedMe POS as normal
9. **Orders DB is separate** — use `NOTION_ORDERS_DB_ID`, not the menu or blog DB, for pre-order records
