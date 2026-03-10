import json

with open('prd.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Check if already added
existing_ids = {s['id'] for s in data['userStories']}
if 'US-061' in existing_ids:
    print("US-061 already exists, skipping")
    exit(0)

new_stories = [
    {
        "id": "US-061",
        "title": "Fix: Chef's Picks Display Category Shows 0 Items",
        "priority": 61,
        "description": "On /en/menu, selecting Chef's Picks filter shows 0 items. Fix by: (1) populating Chef's Picks with featured=true items, (2) ensuring the display category filter query works end-to-end. The display_categories table has the category but item_display_categories junction table has no rows for it.",
        "acceptanceCriteria": [
            "Selecting 'Chef's Picks' on /en/menu shows at least 6 items (the featured items)",
            "If no items are manually assigned to Chef's Picks, fall back to items where featured=true",
            "The filter count badge shows the correct number",
            "Verify: navigate to /en/menu, click 'Chef's Picks' tab — items appear, not 'No items found'"
        ],
        "technicalNotes": [
            "Check DB: SELECT count(*) FROM item_display_categories idc JOIN display_categories dc ON dc.id = idc.display_category_id WHERE dc.name ILIKE '%chef%'",
            "Fix in src/components/menu/menu-grid.tsx: add special case: if activeCategory is Chef's Picks and filteredItems is empty, fall back to items.filter(i => i.featured)",
            "Alternative DB fix: INSERT INTO item_display_categories (item_id, display_category_id) SELECT mi.id, dc.id FROM menu_items mi, display_categories dc WHERE mi.featured = true AND dc.name ILIKE '%chef%' ON CONFLICT DO NOTHING",
            "Also verify getDisplayCategories() returns active=true for Chef's Picks",
            "Check MenuFilter: ensure display category names are passed correctly to the filter function in menu-grid.tsx"
        ],
        "dependencies": ["US-031"],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-062",
        "title": "Under RM15 Category: Auto-Computed from Price",
        "priority": 62,
        "description": "The 'Under RM15' display category should automatically show all menu items priced below RM15.00 without requiring admin to manually assign each item. This is a dynamic/computed category. When the filter is selected, filter by price < 15, not from the junction table.",
        "acceptanceCriteria": [
            "Selecting 'Under RM15' filter shows all currently available items priced < RM15",
            "When prices change in DB, the list automatically reflects the change without admin action",
            "Items priced exactly RM15 are NOT included (strictly less than)",
            "Verify: a new item priced RM12 appears under Under RM15 without admin assignment"
        ],
        "technicalNotes": [
            "In src/components/menu/menu-grid.tsx: add special filter branch for 'Under RM15': if (activeCategory === 'Under RM15') filteredItems = items.filter(i => i.price < 15)",
            "This overrides the display category junction table lookup for this specific category name",
            "Display category still exists in DB for ordering/visibility management but junction rows are ignored",
            "No DB migration needed — purely a client-side filtering logic change in menu-grid.tsx"
        ],
        "dependencies": ["US-031"],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-063",
        "title": "Vegetarian Category: Auto-Computed from Dietary Tag",
        "priority": 63,
        "description": "Add a 'Vegetarian' display category on the menu page that automatically shows all items tagged with 'vegetarian' in their dietary array. Admin marks items as vegetarian via the dietary badge, and the Vegetarian tab auto-populates. No manual junction table assignment needed.",
        "acceptanceCriteria": [
            "A 'Vegetarian' filter tab appears on /en/menu",
            "Selecting 'Vegetarian' shows all items with dietary array containing 'vegetarian' (case-insensitive)",
            "If no vegetarian items exist, show 'No vegetarian items currently available' message",
            "Verify: mark 2 items as vegetarian in admin — Vegetarian tab shows exactly those 2 items"
        ],
        "technicalNotes": [
            "Insert 'Vegetarian' into display_categories if not present: INSERT INTO display_categories (name, sort_order, active) VALUES ('Vegetarian', 6, true) ON CONFLICT (name) DO NOTHING",
            "In src/components/menu/menu-grid.tsx: add filter branch: if (activeCategory === 'Vegetarian') filteredItems = items.filter(i => i.dietary?.some(d => d.toLowerCase() === 'vegetarian'))",
            "In dietary-badge.tsx: ensure 'vegetarian' has a distinct green color and leaf or V icon",
            "Verify the admin item edit modal includes 'vegetarian' as an option in the dietary checkboxes"
        ],
        "dependencies": ["US-031", "US-062"],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-064",
        "title": "Mobile Menu: Category Quick-Jump Bar and Sticky Section Headers",
        "priority": 64,
        "description": "Improve mobile menu browsing with: (1) a sticky horizontal category quick-jump chip bar at top, (2) sticky category section headers as you scroll (like UberEats/Grab Food). Tapping a chip smoothly scrolls to that section. Active chip highlights based on scroll position via IntersectionObserver.",
        "acceptanceCriteria": [
            "A horizontal scrollable category chip bar is pinned below the page header on mobile",
            "Tapping a category chip smoothly scrolls to that section",
            "Each category section has a sticky sub-header that sticks to top as you scroll",
            "The active category chip highlights as you scroll (IntersectionObserver)",
            "Works at 390px — chips are horizontally scrollable, no wrapping",
            "Verify on mobile: scroll down — sticky header shows current section, active chip updates"
        ],
        "technicalNotes": [
            "In src/components/menu/menu-grid.tsx: group items by category and render sections with headings",
            "Section header: className='sticky top-[60px] z-10 bg-background py-2 font-semibold border-b'",
            "Use IntersectionObserver on each section heading to track viewport position and update active chip",
            "Chip bar: flex overflow-x-auto scrollbar-hidden gap-2, scroll-smooth",
            "On chip click: document.getElementById('section-'+category).scrollIntoView({ behavior: 'smooth' })",
            "Use scroll-mt-20 on section headings to offset for sticky header height"
        ],
        "dependencies": [],
        "estimatedComplexity": "medium",
        "passes": False
    },
    {
        "id": "US-065",
        "title": "Mobile Menu: Favorite Items (Heart) and Always-Visible Add Button",
        "priority": 65,
        "description": "Add fast item interactions for mobile: (1) heart/favorite icon on each card saved to localStorage, (2) a Favorites filter tab showing only saved items, (3) always-visible Add button on mobile (not hidden behind hover). Like ShopeeFood or Grab Food browsing experience.",
        "acceptanceCriteria": [
            "Each menu card has a heart icon in the top-right corner of the image",
            "Tapping heart toggles favorite state (filled red = favorited), saved to localStorage mm_favorites",
            "A 'Favorites' filter tab appears showing only hearted items",
            "The Add button is always visible on mobile (not hover-only)",
            "Tapping Add shows a brief scale bounce animation confirming the add",
            "Verify: heart 3 items, select Favorites — only those 3 shown"
        ],
        "technicalNotes": [
            "Create useFavorites() hook in src/hooks/use-favorites.ts: reads/writes mm_favorites (array of item IDs) in localStorage",
            "Heart icon: Lucide Heart, absolute top-2 right-2 z-10 on card image, fill-red-500 when favorited",
            "Add 'Favorites' as special filter in menu-grid.tsx: filteredItems = items.filter(i => favorites.includes(i.id))",
            "On mobile: ensure Add button uses opacity-100 (not opacity-0 group-hover:opacity-100) — check menu-card.tsx",
            "Add button animation: onClick briefly add scale-110 class then remove after 150ms"
        ],
        "dependencies": [],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-066",
        "title": "AI Waiter: Voice Input via Web Speech API",
        "priority": 66,
        "description": "Add a microphone button to the AI chat widget. Customers tap the mic, speak their question, and it transcribes to text and sends to the AI. Uses browser Web Speech API (no external API cost). Gracefully hides the button if the browser does not support it.",
        "acceptanceCriteria": [
            "A microphone icon button appears in the chat input area",
            "Tapping mic starts listening — button pulses red to show recording",
            "Speaking transcribes to text in the input field in real-time",
            "After 2s silence or second tap, recording stops and text is auto-submitted",
            "If Web Speech API is not supported, mic button is hidden (no error shown)",
            "Verify on Chrome mobile: tap mic, speak a question — AI responds correctly"
        ],
        "technicalNotes": [
            "In src/components/chat/chat-widget.tsx: check support: const supported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)",
            "Create recognition object: new (window.SpeechRecognition || window.webkitSpeechRecognition)()",
            "recognition.lang = 'en-US'; recognition.continuous = false; recognition.interimResults = true",
            "recognition.onresult: update input value with event.results[0][0].transcript",
            "recognition.onend: auto-submit if transcript is non-empty",
            "Button states: idle (gray Mic icon), listening (red Mic + animate-pulse ring)",
            "Wrap in try/catch — fail silently on permission denied"
        ],
        "dependencies": [],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-067",
        "title": "Menu Search: Fuzzy Matching with Fuse.js",
        "priority": 67,
        "description": "Improve the 'Search dishes' bar to use fuzzy matching via Fuse.js instead of exact substring search. 'tom yam' should find 'Tom Yum Seafood'. Search across all 3 languages simultaneously. Debounce input by 300ms. Rank results by relevance score.",
        "acceptanceCriteria": [
            "Searching 'tom yam' finds 'Tom Yum Seafood' (fuzzy match, typo tolerance)",
            "Searching in Chinese finds items by nameZh; Malay finds by nameMs",
            "Search is debounced 300ms to avoid firing on every keystroke",
            "Results ranked by relevance — best matches first",
            "Verify: type 'noodle' — shows pad thai, mee goreng, and similar even if word differs"
        ],
        "technicalNotes": [
            "Install: npm install fuse.js",
            "In src/components/menu/menu-grid.tsx: create Fuse instance with keys: ['nameEn', 'nameMs', 'nameZh', 'description', 'categories'], threshold: 0.4, minMatchCharLength: 2",
            "Add useDebounce(query, 300) custom hook in src/hooks/use-debounce.ts",
            "When query non-empty: replace filtered items with fuse.search(debouncedQuery).map(r => r.item)",
            "When query empty: show all items in active category as normal",
            "No server changes needed — Fuse works entirely client-side on the items array passed as props"
        ],
        "dependencies": [],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-068",
        "title": "Menu Search Bar: Voice-to-Text Input Button",
        "priority": 68,
        "description": "Add a microphone button inside the 'Search dishes' input bar on the menu page. Customers tap the mic, speak a dish name, and it populates the search field triggering the fuzzy search. Separate from the AI chat voice input (US-066).",
        "acceptanceCriteria": [
            "A mic icon appears at the right end of the 'Search dishes' input",
            "Tapping mic starts recognition — placeholder changes to 'Listening...'",
            "Spoken text populates the search field and triggers the Fuse.js search filter",
            "Recording stops after 2s silence or second tap",
            "If Web Speech API unsupported, mic icon is hidden",
            "Verify: tap mic, say 'fried rice' — search bar shows 'fried rice' and filters items"
        ],
        "technicalNotes": [
            "In src/components/menu/menu-filter.tsx: add mic button inside the search input wrapper div (position: relative)",
            "Mic button: absolute right-2 top-1/2 -translate-y-1/2, p-1.5 rounded-full",
            "Reuse Web Speech API pattern from US-066: on recognition result, call setSearchQuery(transcript)",
            "Listening state: mic icon becomes animate-pulse text-red-500",
            "This triggers the Fuse.js search from US-067 automatically via the shared search state in menu-grid.tsx"
        ],
        "dependencies": ["US-067"],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-069",
        "title": "Favicon: Cafe Logo as Browser Tab Icon",
        "priority": 69,
        "description": "Replace the generic Next.js favicon with the Makan Moments Cafe logo. Use public/images/logo.png (or public/logo.png) to generate favicon.ico and all required sizes (32x32, 180x180 apple touch, 192x192 PWA). Wire up in app/layout.tsx metadata.",
        "acceptanceCriteria": [
            "Browser tab shows the cafe logo icon (not generic icon or blank)",
            "Apple touch icon (180x180) set for iOS home screen bookmarks",
            "PWA manifest icons use the cafe logo",
            "Verify: open /en in Chrome — browser tab shows the cafe logo"
        ],
        "technicalNotes": [
            "Check if public/images/logo.png or public/logo.png exists — use whichever is present",
            "Simplest approach: copy logo to app/favicon.ico (Next.js auto-wires this without metadata config)",
            "For proper multi-size icons: create scripts/generate-favicon.ts using sharp to output 16x16, 32x32, 180x180, 192x192, 512x512 PNG files to /public",
            "In src/app/layout.tsx metadata: add icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' }",
            "Update public/manifest.json icons array to use cafe logo paths",
            "If logo not found at either path, create a simple orange square SVG with letter M at app/icon.svg"
        ],
        "dependencies": [],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-070",
        "title": "Landing Page: Prominent Pre-Order System Messaging",
        "priority": 70,
        "description": "The homepage does not explain that this is a pre-ordering system. Add a warm, branded section explaining: browse menu, pre-order online, arrive at your time, food is ready. Should feel inviting, not a disclaimer. Translated in all 3 languages.",
        "acceptanceCriteria": [
            "A visible section on the homepage explains the pre-order concept",
            "The message is near the top of the page — visible on mobile without much scrolling",
            "Translated in all 3 languages (en/ms/zh)",
            "Design matches cafe brand — amber/warm tones, not a cold alert box",
            "Includes a CTA button linking to /[locale]/menu",
            "Verify: open /en on 390px mobile — pre-order explanation is visible near top of page"
        ],
        "technicalNotes": [
            "Create src/components/home/preorder-banner.tsx",
            "Insert in src/app/[locale]/page.tsx between hero and highlights sections",
            "Style: rounded-xl bg-amber-50 border border-amber-200 px-6 py-5 with a clock or checkmark icon",
            "3-step visual: Browse Menu -> Pre-order -> Arrive & Enjoy (flex row on desktop, stacked on mobile)",
            "Add translation keys to messages/en.json: preorder.title, preorder.subtitle, preorder.step1, preorder.step2, preorder.step3, preorder.cta — match in ms.json and zh.json",
            "CTA: Link to /[locale]/menu styled as primary orange button"
        ],
        "dependencies": [],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-071",
        "title": "Admin: Multiple Images per Menu Item (Up to 3)",
        "priority": 71,
        "description": "Allow admin to upload up to 3 images per menu item. Primary image stays as {code}.jpg. Additional images are {code}-2.jpg and {code}-3.jpg. Menu card shows primary; a swipeable carousel in the expanded view shows all images. Admin can upload, preview, and delete secondary images in the edit modal.",
        "acceptanceCriteria": [
            "Admin can upload up to 3 images per menu item in the edit modal",
            "Images stored as {code}.jpg (primary), {code}-2.jpg, {code}-3.jpg in public/images/menu/",
            "Menu card shows only primary image by default",
            "Expanded/detail view shows swipeable carousel if multiple images exist",
            "Thumbnail dot indicators show how many images exist",
            "Admin can delete secondary images",
            "Verify: upload 2 extra images for an item — swipe carousel shows all 3"
        ],
        "technicalNotes": [
            "Update src/app/api/admin/images/route.ts: accept imageIndex param (1=primary, 2, 3), save as {code}-{index}.jpg for index > 1",
            "In src/types/menu.ts: add photos?: string[] to MenuItem type",
            "In src/lib/menu.ts rowToMenuItem: populate photos by checking fs.existsSync for {code}-2.jpg and {code}-3.jpg, or add a photos text[] column to menu_items table",
            "Create src/components/menu/image-carousel.tsx: horizontal scroll-snap carousel with dot indicators",
            "In menu-card.tsx: if item.photos?.length > 1, render ImageCarousel instead of single Image",
            "Admin edit modal: add secondary image upload slots with preview thumbnails and X delete button per slot"
        ],
        "dependencies": [],
        "estimatedComplexity": "medium",
        "passes": False
    },
    {
        "id": "US-072",
        "title": "Mobile Homepage: Prominent 'View Menu' CTA Above Fold",
        "priority": 72,
        "description": "On mobile (/en at 390px), the 'View Menu' CTA button is not prominent enough. Make it the unmissable primary action: large, high-contrast, visible above the fold on a 390px screen without scrolling.",
        "acceptanceCriteria": [
            "A large 'View Menu' button is visible above the fold on 390px without scrolling",
            "Button is at least 52px tall and spans most of screen width (w-full or near)",
            "Uses primary orange/amber brand color with strong contrast",
            "Hero section is max 70-80vh on mobile so CTA is above fold",
            "Verify with Chrome DevTools 390px emulation: CTA visible without scrolling"
        ],
        "technicalNotes": [
            "Read src/components/home/hero-section.tsx — find the current CTA button and its container",
            "Ensure button has: w-full sm:w-auto, min-h-[52px], text-lg font-bold, bg-orange-500 hover:bg-orange-600 text-white rounded-xl",
            "On mobile, hero section should be max-h-[75vh] so CTA stays above fold",
            "Position CTA below the headline (not floating on top of image) for guaranteed visibility",
            "Hide secondary decorative elements on mobile (hidden lg:block) to keep focus on the CTA"
        ],
        "dependencies": [],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-073",
        "title": "AI Waiter: Proactive Greetings and Item Promotion",
        "priority": 73,
        "description": "Make the AI waiter proactive: (1) Auto-greet when chat opens with a welcome mentioning 1-2 featured items by name. (2) When customer asks about a dish, AI suggests a complementary item. (3) After 3 minutes of inactivity, AI sends one gentle nudge. Update system prompt and add proactive trigger logic in the chat widget.",
        "acceptanceCriteria": [
            "Opening chat shows an auto-generated welcome message mentioning 1-2 real featured items",
            "When customer asks about a dish, AI response includes a complementary suggestion",
            "After 3 min of chat inactivity (chat is open), AI sends one nudge message",
            "Nudge fires only once per session (not repeatedly)",
            "Messages feel warm and natural, not spammy",
            "Verify: open chat — welcome message appears automatically mentioning real menu items"
        ],
        "technicalNotes": [
            "Update data/chat-settings.json system prompt: instruct AI to greet with 2 featured items, suggest pairings when asked about a dish, and be proactively enthusiastic like a friendly waiter",
            "Update knowledge/cafe-facts.md: add a 'Featured Today' section listing current featured items for AI context",
            "In src/components/chat/chat-widget.tsx: on isOpen becoming true and messages.length === 0, trigger initial greeting by calling the /api/chat with a greeting prompt or adding a pre-set assistant welcome message",
            "Proactive nudge: on chat open, set setTimeout(3 * 60 * 1000, nudgeCallback); nudgeCallback adds a friendly prompt if user has not sent a message in last 3 min",
            "Cancel nudge timeout on new user message (clearTimeout) and on chat close",
            "Featured items for greeting: GET /api/menu/featured or read from constants.ts CAFE featured items list"
        ],
        "dependencies": [],
        "estimatedComplexity": "medium",
        "passes": False
    }
]

data['userStories'].extend(new_stories)

with open('prd.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'Total stories now: {len(data["userStories"])}')
print(f'New stories added: US-061 to US-073')
print(f'Pending (passes=false): {sum(1 for s in data["userStories"] if not s["passes"])}')
