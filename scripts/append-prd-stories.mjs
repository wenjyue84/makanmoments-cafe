import { readFileSync, writeFileSync } from "fs";

const prd = JSON.parse(readFileSync("prd.json", "utf8"));

const newStories = [
  {
    id: "US-146",
    title: "Home Page — Signature Dish Hero Card Hover UX & Lightbox",
    priority: 1,
    description:
      "The signature dish image on the home page should behave like a MenuCard: no star/crown badge visible. Hovering reveals a slide-down panel with item name and price. Clicking the image opens a full-size lightbox showing the dish image, secondary images (code-2.jpg, code-3.jpg if they exist), and recipe info from getRecipeInfo() if available. Works for both admin (HomeInlineEditor) and customer (HeroSection) views.",
    acceptanceCriteria: [
      "No star or crown badge visible on the home page signature dish image",
      "Hovering the image reveals a slide-down info panel with item name and price (matching MenuCard style)",
      "Clicking the image opens a lightbox modal with the full-size dish image",
      "Lightbox shows secondary images as clickable thumbnails if they exist",
      "Lightbox shows recipe info if getRecipeInfo() returns data for the item",
      "Lightbox closes via X button or Escape key",
      "On mobile: tap reveals the slide-down panel; second tap or dedicated button opens lightbox",
      "Both HomeInlineEditor and HeroSection use the same HeroDishCard component"
    ],
    technicalNotes: [
      "Create src/components/home/hero-dish-card.tsx as a 'use client' component",
      "Props: item: MenuItem | null (the signature dish)",
      "When item is null: render static fallback image (hero-mobile.webp) with no hover/click behavior",
      "When item is set: render interactive card with hover slide-down and click lightbox",
      "Slide-down panel: overflow-hidden + max-h-0 -> max-h-48 transition on hover, same as MenuCard",
      "Panel content: item.nameEn + formatted price (RM XX.XX)",
      "Lightbox: absolute/fixed overlay, show item.code.jpg as main image",
      "Secondary images: try /images/menu/{code}-2.jpg and {code}-3.jpg via onError fallback",
      "Recipe info: import { getRecipeInfo } from '@/data/recipe-info' — render accordion/list if present",
      "Replace the static Image+label blocks in hero-section.tsx and home-inline-editor.tsx with <HeroDishCard item={signatureDish}>",
      "Keep the same aspect ratios: mobile aspect-[2/1], desktop aspect-[4/3]"
    ],
    dependencies: [],
    estimatedComplexity: "medium",
    passes: false
  },
  {
    id: "US-147",
    title: "Admin-Only Gear Icon on Mobile Home Page",
    priority: 2,
    description:
      "When an admin is logged in and views the home page on a mobile device, show a floating gear/settings icon at the bottom-right corner (above the chat button). Tapping it navigates to /admin. Non-admin users never see this icon. Desktop admins already have the edit banner so the icon is mobile-only (hidden at lg+).",
    acceptanceCriteria: [
      "Floating gear icon appears at bottom-right on mobile when admin is logged in",
      "Icon is hidden on desktop (lg+)",
      "Tapping the icon navigates to /admin",
      "Non-admin users never see the gear icon",
      "Icon does not overlap with the chatbot button",
      "Icon has aria-label='Go to Admin Panel'"
    ],
    technicalNotes: [
      "In HomeInlineEditor (admin-only component), add a fixed gear button below the admin banner",
      "Use Settings icon from lucide-react",
      "className: 'fixed bottom-20 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg lg:hidden'",
      "Wrap in Next.js <Link href='/admin'>",
      "Since HomeInlineEditor is 'use client', use next/navigation useRouter or just <a href='/admin'>"
    ],
    dependencies: [],
    estimatedComplexity: "small",
    passes: false
  },
  {
    id: "US-148",
    title: "Cart Icon — Conditional Visibility + Bounce Animation",
    priority: 3,
    description:
      "The floating cart/tray button should only be visible when the customer has at least 1 item in their tray. When the button first appears (or when item count increases), it plays a short bounce animation to catch user attention. When the tray is empty, the button is hidden entirely.",
    acceptanceCriteria: [
      "Tray button is NOT rendered when items.length === 0",
      "Button appears with a bounce/scale-pop animation when the first item is added",
      "Animation re-plays each time item count increases",
      "Animation respects prefers-reduced-motion (no animation if motion is reduced)",
      "Badge showing item count remains correct",
      "Button positioned at bottom-left on mobile"
    ],
    technicalNotes: [
      "In src/components/menu/tray-button.tsx (or equivalent), add: if (items.length === 0) return null",
      "Add a CSS animation in globals.css: @keyframes tray-pop { 0%,100%{transform:scale(1)} 40%{transform:scale(1.2)} 70%{transform:scale(0.92)} }",
      ".animate-tray-pop { animation: tray-pop 0.45s ease; }",
      "@media (prefers-reduced-motion: reduce) { .animate-tray-pop { animation: none; } }",
      "Use useEffect to watch items.length: when it increases, add the class, remove after 500ms",
      "Use a ref on the button element and classList.add / classList.remove"
    ],
    dependencies: ["US-001"],
    estimatedComplexity: "small",
    passes: false
  },
  {
    id: "US-149",
    title: "Menu Page Scroll-Aware UI Fade",
    priority: 4,
    description:
      "On /en/menu, during active scrolling the sticky category chip bar, floating tray button, and floating chatbot button should fade to low opacity. After scrolling stops (200ms debounce), they fade back to full opacity. This reduces visual noise so users can focus on food photos while scrolling.",
    acceptanceCriteria: [
      "During active scroll: category chip bar fades to opacity ~30%, tray button fades to ~20%, chatbot button fades to ~20%",
      "After scroll stops (200ms debounce): all elements return to opacity 100%",
      "Fade transition is smooth (transition-opacity duration-150)",
      "Elements remain functional while faded (pointer-events not disabled)",
      "Applies on mobile; optional on desktop",
      "Respects prefers-reduced-motion: skip fade if motion is reduced"
    ],
    technicalNotes: [
      "Create src/hooks/use-scroll-fade.ts: returns isScrolling boolean. Adds scroll listener on window/container, sets true on scroll, clears after 200ms via setTimeout.",
      "In MenuGrid, import useScrollFade. Apply 'opacity-30 transition-opacity' to the chip bar when isScrolling.",
      "For tray button and chatbot: create a ScrollingContext (src/lib/scrolling-context.tsx) that provides isScrolling boolean.",
      "Wrap the menu page content in <ScrollingProvider>. TrayButton and ChatWidget consume the context.",
      "In TrayButton: apply cn('transition-opacity', isScrolling && 'opacity-20') to the outer div.",
      "In ChatWidget: same opacity fade.",
      "Add @media (prefers-reduced-motion: reduce) override to keep opacity-100 always."
    ],
    dependencies: [],
    estimatedComplexity: "medium",
    passes: false
  },
  {
    id: "US-150",
    title: "Menu Card Favorite Icon — Scroll-Aware Visibility",
    priority: 5,
    description:
      "The heart/love favorite icon on menu cards should be hidden while the user is actively scrolling. It reappears after scrolling stops (200ms), or when the user explicitly taps/hovers a card for 2+ seconds without scrolling. This reduces visual noise during fast browsing.",
    acceptanceCriteria: [
      "Heart icon is hidden (opacity-0) when user is actively scrolling",
      "Heart icon reappears 200ms after scroll stops",
      "Heart icon also appears if user hovers/touches a card for 2 seconds (without scrolling)",
      "Clicking/tapping the heart icon works regardless of visibility state",
      "Applies to both MenuCard and any other card with a favorite button",
      "No layout shift — use opacity not display:none"
    ],
    technicalNotes: [
      "Reuse the ScrollingContext from US-149",
      "In MenuCard, import useScrolling() from ScrollingContext",
      "Apply cn('transition-opacity duration-150', isScrolling ? 'opacity-0' : 'opacity-100') to the favorite button",
      "For 2s tap reveal: in the card component add a 2000ms timeout on onMouseEnter/onTouchStart that sets localShowFav=true, reset on leave/end",
      "Combine: show fav if !isScrolling || localShowFav",
      "Pass isScrolling down as prop from MenuGrid OR use context from US-149"
    ],
    dependencies: ["US-149"],
    estimatedComplexity: "small",
    passes: false
  },
  {
    id: "US-151",
    title: "Compact Search Bar Adjacent to Cart Icon on Menu Page",
    priority: 6,
    description:
      "Add a compact pill-shaped search input to the left of the floating cart/tray icon at the bottom of the menu page on mobile. It controls the same search state as the MenuFilter. Typing filters menu items in real time. A clear (X) button appears when text is present. On desktop, the existing MenuFilter search is sufficient.",
    acceptanceCriteria: [
      "A compact search pill appears at bottom-left on mobile, to the left of the cart icon",
      "Typing in it filters menu items — same result as typing in the top MenuFilter search",
      "Both inputs are in sync (same controlled state)",
      "Clear button (X) appears inside the pill when text is present, clears on click",
      "Search icon prefix inside the pill",
      "Placeholder: Search menu...",
      "On desktop (lg+), bottom search is hidden — top search only",
      "Fades with other elements during scroll (follows US-149 behavior)"
    ],
    technicalNotes: [
      "Create src/components/menu/bottom-search-bar.tsx: controlled input with search and onSearchChange props",
      "Position: fixed bottom-6 left-4 z-50 on mobile, hidden on lg+",
      "Style: rounded-full bg-background border border-input shadow-md px-3 py-2 flex items-center gap-2 text-sm",
      "Search icon from lucide-react as prefix",
      "X button: onClick={() => onSearchChange('')} when search !== ''",
      "In MenuGrid, pass search and setSearch (or debouncedSearch setter) to BottomSearchBar",
      "Add BottomSearchBar rendering in MenuGrid below the filter and grid content",
      "Apply isScrolling fade from US-149 context to BottomSearchBar"
    ],
    dependencies: ["US-148", "US-149"],
    estimatedComplexity: "small",
    passes: false
  },
  {
    id: "US-152",
    title: "Scroll-Based Category Chip Auto-Highlight",
    priority: 7,
    description:
      "When browsing the default all-items view (no filter), the sticky category chip bar should automatically highlight whichever category section is currently visible on screen as the user scrolls. The active chip auto-scrolls into view in the horizontal chip bar.",
    acceptanceCriteria: [
      "In the default all-items view, scrolling to 'Nanyang Favourites' highlights that chip",
      "Active chip updates smoothly as the user scrolls between sections",
      "Active chip is automatically scrolled into view in the horizontal chip bar",
      "Clicking a chip scrolls to that section and highlights it",
      "Works on mobile and desktop",
      "The chip bar is always shown in the default all-items view (not just when a category is selected)"
    ],
    technicalNotes: [
      "In MenuGrid, the IntersectionObserver is already set up for activeSection state",
      "The chip bar renders only when !isFlatView && categorySections.length > 1",
      "In the default state (no filter, no search), isFlatView should be false and categorySections should be populated",
      "Verify that useMenuFiltering returns isFlatView=false when category=null and search=''",
      "The auto-scroll: chip.scrollIntoView({ behavior: 'smooth', inline: 'nearest' }) already exists",
      "Fix: ensure the chip bar renders correctly when category=null (no specific category selected)",
      "The chip bar should be the horizontal scroll bar with category name chips"
    ],
    dependencies: [],
    estimatedComplexity: "small",
    passes: false
  },
  {
    id: "US-153",
    title: "Category Section Dividers with Labels in All-Items View",
    priority: 8,
    description:
      "In the all-items view on /menu, enhance the category section headers to be prominent visual dividers. Each divider shows the category emoji and name in a styled banner that clearly separates sections. Users should be able to glance at the dividers to understand which food type they are looking at.",
    acceptanceCriteria: [
      "Each category section has a prominent divider showing the category emoji and name",
      "Divider is full-width with a visually distinct style (e.g., colored left border, muted background, uppercase category name)",
      "Divider does not overlap with the sticky chip bar when at the top",
      "Category emoji is shown next to the category name (reuse getCategoryEmoji logic)",
      "Divider style is consistent across all categories"
    ],
    technicalNotes: [
      "In MenuGrid categorySections.map(), find the <h2> element with the category name",
      "Current style: 'sticky top-[108px] md:top-[68px] z-10 bg-background/95 ... text-xs font-semibold tracking-widest uppercase'",
      "Enhance to: larger text (text-sm), add left border accent (border-l-4 border-primary pl-3), add emoji prefix using getCategoryEmoji",
      "Move getCategoryEmoji from chef-pick-card.tsx to src/lib/utils.ts or src/lib/constants.ts so it can be shared",
      "Add padding-top to section for breathing room: pt-2",
      "Make it less sticky and more of a section header: remove sticky if it conflicts with chip bar, or adjust top offset"
    ],
    dependencies: [],
    estimatedComplexity: "small",
    passes: false
  },
  {
    id: "US-154",
    title: "Default to Chef's Pick on Menu Load + Background Image Prefetch",
    priority: 9,
    description:
      "When a user first navigates to /en/menu, automatically select the Chef's Pick display category. Chef's Pick has fewer items so the initial page load is faster. While the user browses Chef's Pick items, silently prefetch images for all other menu items in the background using requestIdleCallback so switching categories feels instant.",
    acceptanceCriteria: [
      "On first load of /menu, the Chef's Pick category is pre-selected and its chip appears highlighted",
      "Images for non-Chef's-Pick items begin loading in the background after the page is interactive",
      "Switching to another category after the background prefetch feels visually faster",
      "If no Chef's Pick display category exists, fall back to the time-based default behavior",
      "Background prefetch does not block or slow down the initial render"
    ],
    technicalNotes: [
      "In MenuPage server component (src/app/[locale]/menu/page.tsx), find the Chef's Pick display category",
      "Compute initialCategory as DC_PREFIX + chefsCat.name (e.g., 'dc:Chef\\'s Pick') and pass to MenuGrid",
      "DC_PREFIX is defined in src/hooks/useMenuFiltering.ts",
      "Override the existing getDefaultCategoryForTime() logic with this Chef's Pick default",
      "In MenuGrid, add a useEffect(() => { ... }, []) that runs after mount:",
      "  - Get all items not in the current Chef's Pick list",
      "  - Use requestIdleCallback (or setTimeout(fn, 0)) to create Image() objects for each",
      "  - new Image().src = '/images/menu/${code}.jpg' for each non-chef-pick item",
      "Keep prefetch non-blocking — wrap each new Image() in a requestIdleCallback callback"
    ],
    dependencies: [],
    estimatedComplexity: "small",
    passes: false
  },
  {
    id: "US-155",
    title: "Admin Tests for US-146 to US-154 Features",
    priority: 10,
    description:
      "Add automated test cases in the /admin/tests panel to verify that features from US-146 through US-154 are working correctly. Run all tests programmatically. For any failing tests, capture the error and write a new user story to prd.json describing the bug to fix.",
    acceptanceCriteria: [
      "Test for US-146: Signature dish card renders without badge, has hover state and lightbox",
      "Test for US-147: Admin gear icon present in DOM when admin, absent for non-admin",
      "Test for US-148: Tray button hidden when cart empty, visible when item added",
      "Test for US-149: isScrolling context provided on menu page",
      "Test for US-150: Favorite icon has opacity-0 class when isScrolling",
      "Test for US-151: Bottom search bar renders and syncs with filter",
      "Test for US-152: Category chip bar renders in default all-items view",
      "Test for US-153: Category section headers contain emoji and styled border",
      "Test for US-154: Initial category is Chef's Pick on menu load",
      "All tests pass or failures are documented as new prd.json stories"
    ],
    technicalNotes: [
      "Add test cases to src/components/admin/admin-tests-panel.tsx",
      "Use fetch() to call API routes and verify responses",
      "Use document.querySelector() checks where DOM inspection is needed",
      "For visual tests, use the agent-browser skill to take screenshots and verify",
      "Report pass/fail with clear error messages"
    ],
    dependencies: [
      "US-146", "US-147", "US-148", "US-149", "US-150",
      "US-151", "US-152", "US-153", "US-154"
    ],
    estimatedComplexity: "medium",
    passes: false
  }
];

// Append new stories
prd.userStories = [...prd.userStories, ...newStories];
writeFileSync("prd.json", JSON.stringify(prd, null, 2));
console.log(`Added ${newStories.length} stories. Total: ${prd.userStories.length}`);
console.log("New IDs:", newStories.map(s => s.id).join(", "));
