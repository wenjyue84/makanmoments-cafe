import json

with open('prd.json', encoding='utf-8') as f:
    data = json.load(f)

existing_ids = {s['id'] for s in data['userStories']}
if 'US-079' in existing_ids:
    print("US-079 already exists, skipping")
    exit(0)

new_stories = [
    {
        "id": "US-079",
        "title": "Admin: Replace Horizontal Tab Bar with Left Sidebar Navigation",
        "priority": 79,
        "description": "The /admin page currently uses a horizontal scrollable tab bar at the top (Menu | Categories | Rules | Blog | Tests | Time Settings | Operating Hours | Orders | Settings). Replace this with a fixed left sidebar navigation — a vertical list of nav items with icons. This is a standard admin dashboard pattern that scales better as more tabs are added, works better on desktop, and is easier to navigate. The main content area takes the remaining width.",
        "acceptanceCriteria": [
            "The horizontal tab bar is removed and replaced with a left sidebar",
            "The sidebar shows all tabs as vertical nav items with icons + labels",
            "Active tab is highlighted (orange left border or background fill)",
            "Sidebar is fixed on desktop (not scrollable with content)",
            "On mobile, the sidebar collapses to a hamburger menu or icon-only strip",
            "Clicking a nav item switches the content area to that section",
            "The sidebar is approximately 200-220px wide on desktop",
            "Verify: /admin on desktop shows left sidebar + content area side by side"
        ],
        "technicalNotes": [
            "Rewrite src/components/admin/admin-tabs.tsx to use a sidebar layout instead of flex tab bar",
            "Layout: <div className='flex min-h-screen'><aside className='w-52 shrink-0 border-r bg-white'>{nav items}</aside><main className='flex-1 p-6'>{content}</main></div>",
            "Nav item: <button className={cn('flex items-center gap-2 w-full px-4 py-2.5 text-sm', active ? 'bg-orange-50 text-orange-600 border-l-2 border-orange-500' : 'text-gray-600 hover:bg-gray-50')}>",
            "Use Lucide icons for each nav item: UtensilsCrossed (Menu), Tag (Categories), Shield (Rules), BookOpen (Blog), FlaskConical (Tests), Clock (Time Settings), Clock3 (Operating Hours), ShoppingBag (Orders), Settings (Settings)",
            "Mobile: on screens < lg, sidebar becomes a top icon strip or a collapsible drawer",
            "Keep the same TABS array and content rendering logic — only change the nav UI"
        ],
        "dependencies": [],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-080",
        "title": "Admin Settings: Consolidate Time Settings + Operating Hours as Sub-Sections",
        "priority": 80,
        "description": "After the left sidebar refactor (US-079), consolidate the admin nav: move 'Time Settings' and 'Operating Hours' as sub-sections or accordion panels inside the main 'Settings' tab. This reduces nav clutter. Also: enable Push Notifications by default — the push settings panel should have 'enabled: true' as the default state so new installs don't require admin to manually toggle it on.",
        "acceptanceCriteria": [
            "'Time Settings' and 'Operating Hours' are no longer separate top-level sidebar items",
            "The 'Settings' tab contains sections: General, Operating Hours, Time Settings, T&G Payment, Push Notifications, Pre-Order System",
            "Each section is an accordion or visually separated card within the Settings panel",
            "Push Notifications default state is enabled=true (update the default in data/site-settings.json or the component's initial state)",
            "Existing Settings content (T&G, pre-order toggle) is preserved",
            "Verify: click Settings in sidebar — see all sub-sections including Operating Hours and Time Settings"
        ],
        "technicalNotes": [
            "In src/components/admin/admin-tabs.tsx: remove 'Time Settings' and 'Operating Hours' from TABS array",
            "In src/components/admin/admin-settings-panel.tsx: add two new sections that render <AdminTimeSettings> and <AdminOperatingHours> as sub-components",
            "Use a simple accordion pattern: each section has a header button that toggles show/hide of its content",
            "Or use a tabbed sub-panel inside Settings with sub-tabs: General | Hours | Time Slots | Payments | Notifications",
            "Push Notifications default: in src/components/admin/admin-push-settings.tsx or wherever the enabled state is initialized, set defaultEnabled = true",
            "Update data/site-settings.json: add pushNotificationsEnabled: true as default"
        ],
        "dependencies": ["US-079"],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-081",
        "title": "Admin Tests: Auto-Load Tests on Tab Open (Remove 'Load Tests' Button)",
        "priority": 81,
        "description": "In /admin > Tests, the user currently has to click a 'Load Tests' button before tests are displayed. This is an unnecessary extra step. Tests should load automatically when the Tests tab is opened — just like every other tab renders its content immediately. Remove the load button and trigger the test fetch/render on component mount.",
        "acceptanceCriteria": [
            "Opening the Tests tab immediately shows the test list (no 'Load Tests' button)",
            "Tests begin loading on mount — show a spinner/skeleton while loading",
            "If tests fail to load, show an error message with a 'Retry' button",
            "The overall test run button ('Run All Tests') is still present",
            "Verify: click Tests in admin sidebar — test list appears immediately without any extra click"
        ],
        "technicalNotes": [
            "Read src/components/admin/admin-tests-panel.tsx",
            "Find the state variable or handler that gates test loading on button click",
            "Change from onClick-triggered load to useEffect(() => { fetchTests() }, []) to auto-load on mount",
            "Keep a manual 'Run All' button for actually executing the tests",
            "Remove or repurpose the 'Load Tests' button — if it was the run button, rename it 'Run All Tests'"
        ],
        "dependencies": ["US-079"],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-082",
        "title": "Admin Blog: Click Title to Enter Edit Mode",
        "priority": 82,
        "description": "In /admin > Blog, clicking a blog post title should immediately put that field into edit mode (inline edit). Currently the user likely needs to click an Edit button or open a modal. Make the title directly clickable/editable — like a WYSIWYG inline editor. Click the title → it becomes an input field. Click away or press Enter → saves.",
        "acceptanceCriteria": [
            "Clicking a blog post title in the admin blog list puts it into inline edit mode",
            "The title becomes an <input> or <contenteditable> field with the current text pre-filled",
            "Pressing Enter or clicking away saves the change via PATCH /api/admin/blog/[id]",
            "Pressing Escape cancels the edit and restores the original title",
            "A subtle visual cue (pencil icon on hover, cursor: text) signals the title is editable",
            "Verify: click a post title — it becomes an editable input, type new title, press Enter — saved"
        ],
        "technicalNotes": [
            "Read src/components/admin/admin-blog-table.tsx",
            "Add local state: const [editingId, setEditingId] = useState<string | null>(null) and const [editTitle, setEditTitle] = useState('')",
            "Title cell: if editingId === post.id, render <input value={editTitle} onBlur={save} onKeyDown={e => e.key === 'Enter' && save()} autoFocus />",
            "Otherwise render: <span className='cursor-text hover:underline' onClick={() => { setEditingId(post.id); setEditTitle(post.title) }}>{post.title}</span>",
            "Save handler: PATCH /api/admin/blog/[id] with { title: editTitle }, then update local state",
            "Add pencil icon: <Pencil className='w-3 h-3 opacity-0 group-hover:opacity-50 ml-1' /> next to the title"
        ],
        "dependencies": ["US-079"],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-083",
        "title": "Admin: Deep-Linkable Sub-URLs for Each Tab",
        "priority": 83,
        "description": "Each admin tab should have its own URL so it can be bookmarked and directly navigated to. Examples: /admin/menu, /admin/blog, /admin/tests, /admin/orders, /admin/settings. Currently everything is at /admin and the active tab is client-side state only. Implement URL-based routing so the correct tab is pre-selected when navigating directly to a sub-URL.",
        "acceptanceCriteria": [
            "Navigating to /admin/menu opens admin with Menu tab active",
            "Navigating to /admin/blog opens admin with Blog tab active",
            "Navigating to /admin/tests opens admin with Tests tab active",
            "Navigating to /admin/orders opens admin with Orders tab active",
            "Navigating to /admin/settings opens admin with Settings tab active",
            "Clicking a sidebar nav item updates the URL without a full page reload",
            "Refreshing the page at /admin/blog keeps the Blog tab active",
            "Verify: navigate to /admin/orders directly — Orders tab is active"
        ],
        "technicalNotes": [
            "Create sub-route page files: src/app/admin/[tab]/page.tsx — a single dynamic route that reads params.tab",
            "Or use Next.js parallel routes / layout — simpler: just create individual page.tsx files for each tab: src/app/admin/menu/page.tsx, src/app/admin/blog/page.tsx, etc., each rendering <AdminPage initialTab='Menu' />",
            "In AdminTabs: accept an initialTab prop and use it to set the initial activeTab state",
            "Sidebar nav items use <Link href='/admin/menu'> instead of onClick setState",
            "Each sub-page is auth-gated the same way as /admin/page.tsx (verify token, redirect to login if invalid)",
            "The simplest implementation: one dynamic catch-all route src/app/admin/[[...tab]]/page.tsx that maps the slug to the correct tab name"
        ],
        "dependencies": ["US-079"],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-084",
        "title": "Admin Rules: AI Helper Template Prompts for New Users",
        "priority": 84,
        "description": "The AI Rule Helper in /admin > Rules has an empty text input that intimidates new users who don't know what to type. Add a set of commonly-used template prompts as clickable chips or a dropdown. Clicking a template pre-fills the input with a useful starting prompt. Examples: 'Hide all rice dishes after 3PM', 'Make breakfast items available only 7AM-11AM', 'Disable all noodle dishes on Mondays', 'Show Chef's Picks only on weekends'.",
        "acceptanceCriteria": [
            "A row of template prompt chips appears above or below the AI rule helper input",
            "At least 6 template prompts are provided covering time, day, category, and featured rules",
            "Clicking a template chip pre-fills the AI input with that prompt text",
            "The user can then edit the pre-filled text before submitting",
            "Templates are clearly labeled as examples (e.g., 'Try:' heading before the chips)",
            "Verify: click a template chip — the AI input is filled with the template text"
        ],
        "technicalNotes": [
            "Read src/components/admin/admin-rules-ai-helper.tsx",
            "Add a TEMPLATE_PROMPTS array: [{ label: 'Hide after 3PM', prompt: 'Hide all rice dishes after 3:00 PM every day' }, { label: 'Breakfast hours', prompt: 'Make all breakfast items available only between 7:00 AM and 11:00 AM' }, { label: 'Weekday lunch', prompt: 'Show lunch set items only on weekdays from 11 AM to 2:30 PM' }, { label: 'Weekend specials', prompt: 'Enable Chef\\'s Picks items only on Saturday and Sunday' }, { label: 'Monday closed', prompt: 'Disable all menu items every Monday (cafe is closed)' }, { label: 'Drink promo', prompt: 'Apply a discount label to all drinks on Friday evenings after 5 PM' }]",
            "Render chips: <div className='flex flex-wrap gap-2 mb-3'>{TEMPLATE_PROMPTS.map(t => <button onClick={() => setPrompt(t.prompt)} className='text-xs px-2 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100'>{t.label}</button>)}</div>",
            "Add a 'Try:' label before the chips: <p className='text-xs text-muted-foreground mb-2'>Try a template:</p>"
        ],
        "dependencies": ["US-079"],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-085",
        "title": "Admin Menu: Search Items by Code or Name",
        "priority": 85,
        "description": "In /admin > Menu, the item list can be long and hard to navigate. Add a search bar at the top of the menu table that filters items by item code (e.g., 'MT04') or by name (English, Malay, or Chinese). The search is instant (client-side filtering, no API call). This makes it fast to find and edit a specific item.",
        "acceptanceCriteria": [
            "A search input appears at the top of the admin menu table (above the category filter)",
            "Typing a code (e.g., 'MT04') instantly filters to show only that item",
            "Typing a name (partial match, case-insensitive) filters matching items",
            "Search works across nameEn, nameMs, nameZh, and code fields",
            "Clearing the search restores the full list",
            "The search input shows a placeholder: 'Search by name or code...'",
            "Verify: type 'MT04' — only that item row is shown"
        ],
        "technicalNotes": [
            "Read src/components/admin/admin-menu-table.tsx",
            "Add state: const [search, setSearch] = useState('')",
            "Add search input: <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search by name or code...' className='...' />",
            "Filter logic: const displayItems = items.filter(item => search === '' || [item.code, item.nameEn, item.nameMs, item.nameZh].some(v => v?.toLowerCase().includes(search.toLowerCase())))",
            "Apply this filter before the existing category filter",
            "Show a '0 results' message if filtered list is empty"
        ],
        "dependencies": ["US-079"],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-086",
        "title": "Admin Menu Table: Column Header Tooltips",
        "priority": 86,
        "description": "The admin menu table has abbreviated column headers (IMAGE, CODE, NAME EN/MS/ZH, PRICE, ON, ★, CATEGORIES, DIETARY, DAYS, TIME, DATES — as shown in the current UI). Some of these are not immediately obvious to new admins. Add tooltip hints on hover for each column header explaining what it means and how to edit that field. This is specifically for the redesigned left-nav admin, not the old horizontal tabs.",
        "acceptanceCriteria": [
            "Hovering any column header shows a tooltip with a plain-language explanation",
            "Tooltip for IMAGE: 'Item photo — click the image in a row to upload a new one'",
            "Tooltip for CODE: 'POS item code (read-only) — used to match photos and rules'",
            "Tooltip for ON: 'Toggle item visibility on the public menu (on/off switch)'",
            "Tooltip for ★: 'Featured — marks item for the homepage highlights section'",
            "Tooltip for DAYS: 'Days of week this item is available (e.g., Mon-Fri only)'",
            "Tooltip for TIME: 'Time window this item is served (e.g., 11:00-15:00)'",
            "Tooltip for DATES: 'Special dates this item is available or unavailable'",
            "Tooltips are accessible (title attribute or aria-label) and visible on hover/focus",
            "Verify: hover 'ON' column header — tooltip appears explaining the toggle"
        ],
        "technicalNotes": [
            "Read src/components/admin/admin-menu-table.tsx — find the table <thead> section",
            "Create a COLUMN_TOOLTIPS object: { IMAGE: 'Item photo...', CODE: 'POS item code...', ON: 'Toggle item visibility...', STAR: 'Featured item...', DAYS: '...', TIME: '...', DATES: '...' }",
            "Wrap each <th> content in: <span title={COLUMN_TOOLTIPS[col]} className='cursor-help border-b border-dashed border-gray-400'>{colLabel}</span>",
            "Or use a Tooltip component from shadcn/ui: <TooltipProvider><Tooltip><TooltipTrigger>{colLabel}</TooltipTrigger><TooltipContent>{description}</TooltipContent></Tooltip></TooltipProvider>",
            "This story depends on US-079 (left nav) being done first — implement tooltips in the new admin layout context"
        ],
        "dependencies": ["US-079", "US-085"],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-087",
        "title": "KDS: Kitchen Display System — Login + Order Queue View",
        "priority": 87,
        "description": "Create a Kitchen Display System at /kds. Kitchen staff log in with username 'kitchen' / password 'kitchen123'. After login, they see all orders that are approved AND have payment confirmed (status: 'preparing'). Each order shows: order ID, items list, customer ETA, time elapsed since order started. The KDS is designed for a kitchen tablet — large text, high contrast, no admin features.",
        "acceptanceCriteria": [
            "Navigating to /kds shows a login screen (separate from /admin/login)",
            "Login with username 'kitchen' + password 'kitchen123' succeeds",
            "Wrong credentials show an error — no lockout after retries needed",
            "After login, KDS shows all orders with status='preparing' as cards",
            "Each order card shows: order ID, list of items with quantities, customer ETA, elapsed time since order was placed",
            "Orders are sorted by ETA ascending (most urgent first)",
            "KDS auto-refreshes every 30 seconds to pick up new orders",
            "Kitchen credentials stored securely (env var or hashed in DB, NOT hardcoded in source code beyond the env default)",
            "Verify: log in as kitchen/kitchen123 — see orders with status preparing"
        ],
        "technicalNotes": [
            "Create src/app/kds/page.tsx — KDS login page (if not authenticated) or order queue (if authenticated)",
            "Create src/app/kds/login/page.tsx or handle in the same page with conditional render",
            "KDS auth: separate JWT or session cookie from admin auth. Use KITCHEN_USERNAME and KITCHEN_PASSWORD env vars (default: kitchen / kitchen123). Create src/app/api/kds/login/route.ts",
            "Order query: SELECT * FROM orders WHERE status = 'preparing' ORDER BY estimated_arrival ASC",
            "Create src/app/api/kds/orders/route.ts — GET, requires KDS auth cookie",
            "KDS UI: large cards (min 200px), dark background or high-contrast light, font-size lg+",
            "Auto-refresh: useEffect with setInterval(fetchOrders, 30000), cleanup on unmount",
            "Add KITCHEN_USERNAME=kitchen and KITCHEN_PASSWORD=kitchen123 to .env.example"
        ],
        "dependencies": [],
        "estimatedComplexity": "medium",
        "passes": False
    },
    {
        "id": "US-088",
        "title": "KDS: Mark Individual Food Items as Complete",
        "priority": 88,
        "description": "On the KDS (/kds), kitchen staff can mark each individual food item within an order as complete by tapping it. This helps track preparation progress per dish. When ALL items in an order are marked complete, the order card changes to a 'Ready' state and the admin can be notified. Tapping a completed item reverts it (in case of mistake).",
        "acceptanceCriteria": [
            "Each item line within an order card has a checkbox or tap-to-complete button",
            "Tapping an item marks it as done — it gets a strikethrough + green check, visually distinct",
            "Tapping a done item reverts it to incomplete",
            "When all items in an order are checked, the order card shows a 'Mark as Ready' prominent button",
            "Pressing 'Mark as Ready' calls PATCH /api/admin/orders/[id] with status='ready'",
            "Completed item state is stored locally (in-memory or localStorage) — does not need to persist to DB per-item",
            "The order card border turns green when all items are done",
            "Verify: tap all items in an order — 'Mark as Ready' button appears, press it — order disappears from KDS queue"
        ],
        "technicalNotes": [
            "In the KDS order card component: add local state Map<orderId, Set<itemIndex>> for completed items",
            "Item row: <button onClick={() => toggleItem(orderId, itemIdx)} className={cn('flex items-center gap-2 text-left w-full py-1', done ? 'line-through text-gray-400' : 'text-white')}>{done ? <CheckCircle className='text-green-400' /> : <Circle />} {item.nameEn} x{item.quantity}</button>",
            "allDone = items.every((_, i) => completedItems.has(i))",
            "Mark as Ready: <button onClick={() => markReady(orderId)} className='w-full mt-3 bg-green-500 text-white py-3 rounded-xl font-bold text-lg'>Mark as Ready</button>",
            "markReady: PATCH /api/admin/orders/[id] { status: 'ready' } — reuse the existing admin orders endpoint or create a KDS-specific one",
            "On success: remove the order card from the local list (optimistic update)"
        ],
        "dependencies": ["US-087"],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-089",
        "title": "KDS: Real-Time Order Updates and New Order Alert",
        "priority": 89,
        "description": "The KDS should alert kitchen staff when a new order arrives. Instead of waiting 30 seconds for the auto-refresh, add a visual + audio alert for new orders: the screen flashes or shows a banner, and optionally plays a short notification sound. New orders are highlighted distinctly until acknowledged. Existing orders that become 'ready' disappear from the queue automatically.",
        "acceptanceCriteria": [
            "When a new order enters 'preparing' status, KDS shows a new order banner or highlights the new card",
            "New order cards have a distinct visual treatment (pulsing border or 'NEW' badge) for the first 60 seconds",
            "A subtle notification sound plays when a new order arrives (can be disabled by kitchen staff)",
            "Orders that the kitchen marks as 'ready' are removed from the queue immediately",
            "The KDS polling interval is 15 seconds (faster than the 30s default from US-087) for better responsiveness",
            "Verify: approve an order in admin — within 15s it appears on the KDS with a NEW indicator"
        ],
        "technicalNotes": [
            "In the KDS orders hook: compare incoming orders with previous fetch — any new order ID not in previous set is 'new'",
            "Mark new orders: store a Set of 'acknowledged' order IDs in useState. New orders not in this set get the pulsing border + NEW badge",
            "After 60s or on first tap: add orderId to acknowledged set, remove NEW indicator",
            "Audio alert: const audio = new Audio('/sounds/new-order.mp3'); audio.play() — add a short chime MP3 to public/sounds/",
            "Mute button: toggle a muted state, skip audio.play() if muted",
            "Change polling interval from 30s to 15s in the useEffect interval",
            "Consider using Server-Sent Events or polling — SSE would be more responsive but polling is simpler and sufficient"
        ],
        "dependencies": ["US-088"],
        "estimatedComplexity": "small",
        "passes": False
    }
]

data['userStories'].extend(new_stories)

with open('prd.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'Total stories now: {len(data["userStories"])}')
print(f'New stories added: US-079 to US-089')
print(f'Pending (passes=false): {sum(1 for s in data["userStories"] if not s["passes"])}')
