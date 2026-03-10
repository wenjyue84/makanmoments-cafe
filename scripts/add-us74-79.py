import json

with open('prd.json', encoding='utf-8') as f:
    data = json.load(f)

existing_ids = {s['id'] for s in data['userStories']}
if 'US-074' in existing_ids:
    print("US-074 already exists, skipping")
    exit(0)

new_stories = [
    {
        "id": "US-074",
        "title": "Menu Card: Replace '+Add' with Compact '+' Icon Aligned with Price",
        "priority": 74,
        "description": "On the menu page (/en/menu) and home highlights, the '+Add' button is too verbose and takes up space. Replace it with a compact '+' icon button (circle or square) positioned on the same row as the price — so price and add action are always side-by-side. This follows impeccable mobile design: one clean row showing price (left) and action (right). Apply to both MenuCard and ChefPickCard. Use the /impeccable skill principles: reduce noise, let food be the hero.",
        "acceptanceCriteria": [
            "The '+Add' button is replaced with a compact '+' icon button (no text label)",
            "The '+' icon and price are on the same horizontal row — price left-aligned, '+' right-aligned",
            "The '+' icon button is at least 44px touch target (padding compensates for small visual size)",
            "When item is already in tray, '+' changes to a quantity stepper (- N +) on the same row",
            "The card layout is cleaner — item name and description above, price + action row at bottom",
            "Applied consistently to MenuCard, ChefPickCard, and any highlight card on the homepage",
            "Verify at 390px: price and '+' are on the same line, not stacked"
        ],
        "technicalNotes": [
            "Read src/components/menu/menu-card.tsx — find the current button text '+Add' and replace with a Plus icon from Lucide",
            "Layout pattern: <div className='flex items-center justify-between mt-auto pt-2'><span className='font-bold text-orange-600'>RM{price}</span><button className='flex items-center justify-center w-9 h-9 rounded-full bg-orange-500 text-white hover:bg-orange-600'><Plus className='w-5 h-5' /></button></div>",
            "When item is in tray (quantity > 0): replace the single '+' with a <div className='flex items-center gap-1'><button>-</button><span>{qty}</span><button>+</button></div>",
            "Also update src/components/home/highlights.tsx and chef-pick-card.tsx if they have their own Add button",
            "Keep the button hit area large via padding even if the icon is small",
            "Use Lucide icons: Plus, Minus"
        ],
        "dependencies": [],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-075",
        "title": "Promo Set Item: Add to Tray + Lazy Description Reveal on Hover/Focus",
        "priority": 75,
        "description": "The top item 'Steamed Fish Promo Set (RM55.90)' shown on the menu page cannot be added to the tray — add support for this. Additionally, all menu items should hide their description by default. The description only reveals when: (a) the user clicks the item image, or (b) the user hovers/focuses on the image for at least 2 seconds (intent-based reveal). This keeps cards clean and uncluttered while still making info accessible. On mobile, tap the image to toggle description visibility.",
        "acceptanceCriteria": [
            "The Steamed Fish Promo Set (RM55.90) can be added to the tray like any other item",
            "Menu card descriptions are hidden by default (not visible on load)",
            "Clicking the card image reveals the description (toggle)",
            "Hovering over the image for 2+ seconds reveals the description (desktop)",
            "On mobile, tapping the image toggles description visibility",
            "The description reveal uses a smooth slide-down or fade-in animation",
            "Other cards are not affected when one card's description is revealed",
            "Verify: tap item image — description fades in. Tap again — description hides"
        ],
        "technicalNotes": [
            "In src/components/menu/menu-card.tsx: add state const [showDesc, setShowDesc] = useState(false)",
            "Image wrapper: add onClick={() => setShowDesc(v => !v)} and onMouseEnter/onMouseLeave with a 2s timeout ref",
            "2s hover intent: on mouseEnter, set a ref: hoverTimer.current = setTimeout(() => setShowDesc(true), 2000); on mouseLeave, clearTimeout(hoverTimer.current)",
            "Description element: className={cn('text-sm text-muted-foreground overflow-hidden transition-all duration-300', showDesc ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0')}",
            "For the Steamed Fish Promo Set specifically: verify the item exists in DB with an 'available' flag and the correct code — check if it has a category assigned. If it is missing from the menu_items table, it needs to be added via admin or SQL.",
            "Check DB: SELECT * FROM menu_items WHERE name_en ILIKE '%steamed fish%' OR name_en ILIKE '%promo%' to find the item"
        ],
        "dependencies": ["US-074"],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-076",
        "title": "Landing Page: Elegant Progressive Text Reveal (Minimal Above-Fold)",
        "priority": 76,
        "description": "The landing page has too much text visible at once — it feels cluttered and low-class. Redesign the information hierarchy: above the fold shows ONLY the hero image, cafe name, tagline, and one CTA button. All other text (about us, how it works, highlights heading) reveals progressively as the user scrolls, triggered by scroll-position using IntersectionObserver with fade-up animations. The pre-order banner (US-070) should also use this pattern — not a full banner, but a gentle 3-icon strip that fades in on scroll. Goal: first impression is purely visual and emotional, text enriches as user explores.",
        "acceptanceCriteria": [
            "Above the fold on mobile (390px): only hero image, cafe name, one-line tagline, and View Menu CTA",
            "All other text sections (highlights heading, pre-order steps, about blurb) are initially invisible",
            "As user scrolls, each section fades up into view (IntersectionObserver + Tailwind animation)",
            "Animation is subtle: 0.4s ease-out, translate-y from 16px to 0, opacity 0 to 1",
            "Respects prefers-reduced-motion — disables animation if OS setting is on",
            "The page still functions without JS (server-rendered, animation is progressive enhancement)",
            "Verify: open /en on mobile, scroll slowly — sections appear gracefully as they enter viewport"
        ],
        "technicalNotes": [
            "Create a CSS utility class or Tailwind plugin: .animate-fade-up { @apply opacity-0 translate-y-4 transition-all duration-400 ease-out } .animate-fade-up.in-view { @apply opacity-100 translate-y-0 }",
            "Create src/hooks/use-intersection-observer.ts hook that adds 'in-view' class when element enters viewport",
            "In src/app/[locale]/page.tsx: wrap each section (highlights, preorder-banner, about-teaser) in a <FadeUp> wrapper component",
            "Create src/components/ui/fade-up.tsx: client component that uses useIntersectionObserver to toggle visibility",
            "Hero section: strip down to bare minimum — remove any sub-text that repeats below the fold",
            "Use @media (prefers-reduced-motion: reduce) { .animate-fade-up { transition: none; opacity: 1; transform: none; } }",
            "Test: disable JS in DevTools — page should still render all content (just without animations)"
        ],
        "dependencies": ["US-072"],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-077",
        "title": "Menu Page: Progressive Item Reveal and Reduced Visual Noise",
        "priority": 77,
        "description": "The menu page (/en/menu) shows all items at once with full text, creating visual overload. Apply progressive disclosure: (1) item descriptions are hidden by default (from US-075), (2) items outside the viewport fade in as user scrolls (staggered entrance per row), (3) the category filter bar and search are always visible but section headers appear with a subtle fade, (4) price and name are the only always-visible text — dietary badges and category labels are smaller/muted. Goal: make the menu feel like a curated editorial, not a database dump.",
        "acceptanceCriteria": [
            "Menu items fade in as they enter the viewport (staggered: 50ms delay per item in the row)",
            "Item descriptions are hidden by default, revealed on image tap/hover (from US-075)",
            "Dietary badges are smaller and muted (text-xs, gray) — not competing with the item name",
            "Category section headers use a larger, elegant font treatment (tracking-wide, uppercase, muted)",
            "The overall page feels spacious and curated — fewer competing visual elements",
            "Stagger animation respects prefers-reduced-motion",
            "Verify: load /en/menu — items appear in a graceful wave as you scroll, not all at once"
        ],
        "technicalNotes": [
            "In src/components/menu/menu-grid.tsx: apply staggered animation to each item using index % itemsPerRow * 50ms delay",
            "Item wrapper: className='animate-fade-up' style={{ animationDelay: `${(index % 3) * 50}ms` }} — use IntersectionObserver to trigger",
            "In src/components/menu/dietary-badge.tsx: reduce size — text-xs px-1.5 py-0.5, muted colors (bg-gray-100 text-gray-500 for non-critical badges)",
            "Category section headers: className='text-xs font-semibold tracking-widest uppercase text-muted-foreground py-3 border-b border-dashed'",
            "Reuse the FadeUp component from US-076 for section headers",
            "Keep price and item name always prominent — do not mute these"
        ],
        "dependencies": ["US-075", "US-076"],
        "estimatedComplexity": "small",
        "passes": False
    },
    {
        "id": "US-078",
        "title": "Site-Wide: Micro-Interactions and Scroll-Triggered Polish",
        "priority": 78,
        "description": "Final polish pass to make the whole site feel premium and intentional. Add micro-interactions: (1) smooth page transitions between routes, (2) button press ripple or scale feedback, (3) image skeleton loaders that match the image aspect ratio, (4) tray item add animation (item flies toward the tray icon), (5) the tray icon bounces when an item is added. These small touches elevate perceived quality without adding clutter. All animations must respect prefers-reduced-motion.",
        "acceptanceCriteria": [
            "Buttons have a subtle scale-95 on press (active:scale-95 in Tailwind)",
            "Images show a skeleton placeholder (bg-gray-200 animate-pulse) before loading",
            "The tray icon badge does a brief scale bounce when an item is added",
            "The category filter chips have a smooth underline slide animation on active state",
            "All animations complete within 300ms (snappy, not sluggish)",
            "prefers-reduced-motion: all animations disabled when OS motion reduction is on",
            "Verify: tap Add on a menu item — tray badge bounces, button gives press feedback"
        ],
        "technicalNotes": [
            "Button press: add active:scale-95 transition-transform to all CTA buttons globally in globals.css or as a Tailwind component class",
            "Image skeleton: in menu-card.tsx, wrap <Image> in a div with bg-gray-200 animate-pulse, remove skeleton class on image onLoad",
            "Tray badge bounce: in tray-button.tsx, on item count change, add a 'bounce' CSS class that plays a keyframe animation (scale 1 -> 1.3 -> 1 in 300ms), then remove it",
            "Category chip active indicator: instead of border-b-2, use a ::after pseudo-element that slides from left (scaleX 0 to 1) — or use framer-motion if already installed",
            "Check if framer-motion is in package.json — if yes, use motion.div for transitions. If no, use pure CSS transitions.",
            "globals.css: @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }"
        ],
        "dependencies": ["US-076", "US-077"],
        "estimatedComplexity": "small",
        "passes": False
    }
]

data['userStories'].extend(new_stories)

with open('prd.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'Total stories now: {len(data["userStories"])}')
print(f'New stories added: US-074 to US-078')
print(f'Pending (passes=false): {sum(1 for s in data["userStories"] if not s["passes"])}')
