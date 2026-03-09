# Gemini Context & Guidelines — Makan Moments Cafe

> **Core Objective:** The system must emphasize a **mobile-native feel** and a **lightning-fast landing page**.

## 📱 Mobile-Native Experience Guidelines

To ensure the web app feels like a true native mobile application on phones:

1. **Optimized Touch Targets**
   - Ensure all buttons, links, and interactive elements have a minimum size of `44x44px`.
   - Add adequate padding to prevent misclicks.

2. **Bottom-Centric Ergonomics**
   - Prioritize bottom navigation, floating action buttons (FAB), and sliding bottom sheets (drawers) instead of top-heavy dropdowns, which are hard to reach one-handed.

3. **Fluid Gestures & Animations**
   - Implement swipe actions (e.g., for carousels, tabs, or dismissing modals).
   - Use smooth, physics-based springs (via Framer Motion) instead of linear CSS transitions for a premium, heavy native feel.

4. **App-Like Interactions & Feedback**
   - Provide instant visual feedback on tap (active states, ripples, or slight scale-down effects).
   - Disable sticky hover states on mobile by wrapping hover styles in `@media (hover: hover) and (pointer: fine)`.
   - Prevent accidental text selection or zooming on interactive UI elements (`user-select: none`, `touch-action: manipulation`).

5. **Edge-to-Edge Design & Safe Areas**
   - Respect notch and home indicator safe zones using `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
   - Extend background colors into the safe areas for an immersive, edge-to-edge look.

## ⚡ Lightning-Fast Landing Page Strategies

To achieve near-instantaneous load times and stellar Core Web Vitals on the landing page:

1. **Strict Server-Component First Approach**
   - The landing page layout and static content must be React Server Components (RSC).
   - Constrain `'use client'` strictly to isolated, interactive "islands" (e.g., the Chat Widget or an interactive Tray) to ship zero unnecessary JavaScript for the rest of the page.

2. **Hero Section (LCP) Optimization**
   - Use `next/image` with the `priority` flag for the main above-the-fold hero image.
   - Preload the LCP (Largest Contentful Paint) image and fetch it in modern formats (`AVIF`/`WebP`).
   - Hardcode aspect ratios to eliminate any Cumulative Layout Shift (CLS).

3. **Aggressive Code Splitting & Lazy Loading**
   - Use `next/dynamic` to load heavy, below-the-fold components (like the footer, map embeds, or complex secondary sections) only when they scroll into view.
   - Delay the initialization of the AI Chat Widget until after hydration or when the user begins scrolling.

4. **Font & Aesthetic Asset Delivery**
   - Rely strictly on `next/font` (e.g., `next/font/google` or local fonts) to self-host and preload fonts natively, avoiding render-blocking requests and preventing FOUT (Flash of Unstyled Text).

5. **CSS-First Animations for Load**
   - For initial page load animations (fade-ins, reveals), strongly prefer Tailwind CSS keyframe animations over JS-based variants to ensure they render before JavaScript is fully parsed and executed.
