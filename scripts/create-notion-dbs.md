# Create Notion Databases — Instructions

## Step 1: Create a Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Name: "Makan Moments Website"
4. Select the workspace
5. Copy the "Internal Integration Secret" → put in `.env.local` as `NOTION_API_KEY`

## Step 2: Create Menu Items Database

Create a full-page database in Notion with these properties:

| Property | Type | Notes |
|----------|------|-------|
| Name (EN) | Title | English name (auto-populated from CSV) |
| Code | Rich Text | Item code (e.g., AC01, BF01) |
| Name (MS) | Rich Text | Malay name (fill manually later) |
| Name (ZH) | Rich Text | Chinese name (fill manually later) |
| Category | Select | Auto-created from CSV categories |
| Price | Number | In RM |
| Description | Rich Text | Short description |
| Dietary | Multi-select | e.g., Spicy, Vegetarian |
| Available | Checkbox | Default: checked |
| Featured | Checkbox | Default: unchecked |
| Sort Order | Number | Display order |

After creating:
1. Click "..." menu → "Connections" → Add your integration
2. Copy the database ID from the URL: `https://notion.so/[workspace]/[DATABASE_ID]?v=...`
3. Put in `.env.local` as `NOTION_MENU_DB_ID`

## Step 3: Create Blog Posts Database

| Property | Type | Notes |
|----------|------|-------|
| Title | Title | Post title |
| Slug | Rich Text | URL-friendly slug |
| Excerpt | Rich Text | Short summary |
| Cover | URL | Cover image URL |
| Date | Date | Publication date |
| Tags | Multi-select | e.g., recipe, story, announcement |
| Language | Select | en, ms, or zh |
| Published | Checkbox | Only published posts show on site |

After creating:
1. Connect your integration
2. Copy database ID → `NOTION_BLOG_DB_ID`

## Step 4: Seed Menu Data

```bash
cd website
npx tsx scripts/seed-notion-menu.ts
```

This imports all 384 items from the POS CSV. Takes ~2.5 minutes (API rate limit: 3 req/sec).

## Step 5: Enrich Menu Data in Notion

After seeding, manually add in Notion:
- Chinese names (Name ZH) for popular items
- Malay names (Name MS) for popular items
- Descriptions for featured items
- Mark 6-8 items as "Featured"
- Add dietary tags (Spicy, etc.) where applicable
