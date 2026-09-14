# Design System Document

## 1. Overview & Creative North Star: "The Modern Concierge"
This design system is not a static utility; it is a digital sensory experience. Moving away from the rigid, grid-locked structures of traditional e-commerce, our North Star is **"The Modern Concierge."** It represents an atmosphere that is intimate, honest, and expertly curated. 

The system achieves a "high-end editorial" feel by prioritizing negative space as a functional element rather than a void. We break the "template" look through intentional asymmetry—placing elements in a rhythmic, staggered flow that mimics the relaxed pace of a premium coffee house. By leaning into lowercase typography and tonal layering, we remove the "stiffness" of corporate UI, replacing it with a warm, human-centric interface.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
The palette is rooted in the earth: deep forest greens, creamy off-whites, and rich espresso browns. To maintain a premium feel, we follow strict rules on how these are applied.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections or containers. Visual boundaries must be created through background color shifts.
*   Use `surface` (#fbf9f5) for the global canvas.
*   Use `surface-container-low` (#f5f3ef) to define secondary zones.
*   Use `surface-container-high` (#eae8e4) to call attention to specific interactive blocks.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. A "Nested Depth" approach replaces shadows.
*   **Base:** `surface` (#fbf9f5)
*   **Section Wrap:** `surface-container-lowest` (#ffffff)
*   **Active/Selected State:** `primary-container` (#1a3c34) with `on-primary` text.

### The Glass & Gradient Rule
For floating elements (like a "View Order" bar or a filtered "Mocktail" badge), use **Glassmorphism**.
*   **Formula:** `surface` at 80% opacity + 20px backdrop-blur. 
*   **Signature Textures:** Main headers should utilize a subtle linear gradient from `primary` (#01261f) to `primary-container` (#1a3c34) at a 135-degree angle to provide a velvet-like visual depth.

---

## 3. Typography: The Lowercase Editorial
The typography strategy balances the authority of **Plus Jakarta Sans** with the approachability of **Inter**. 

*   **Lowercase Expression:** All `display`, `headline`, and `title` styles should be set to lowercase. This softens the brand's voice, making it feel "intimate" and "honest" rather than demanding.
*   **Display & Headline (Plus Jakarta Sans):** Used for section titles (e.g., "coffee", "non-coffee"). These should have tight letter-spacing (-0.02em) to feel like a modern magazine header.
*   **Body & Labels (Inter):** Used for item descriptions and nutritional info. These maintain standard sentence case for maximum legibility, providing a grounded contrast to the lowercase headers.

**Key Scale Mapping:**
*   **Section Headers:** `headline-lg` | Plus Jakarta Sans | Bold | Lowercase
*   **Menu Item Names:** `title-md` | Inter | Semi-bold | Lowercase
*   **Price Tags:** `label-md` | Inter | Medium | `secondary` (#79573f)

---

## 4. Elevation & Depth: Tonal Layering
We reject the standard "drop shadow" in favor of **Ambient Light** and **Tonal Stacking**.

*   **The Layering Principle:** To lift a card, place a `surface-container-lowest` card on top of a `surface-container-low` background. The slight shift in "creaminess" creates a sophisticated, tactile lift.
*   **Ambient Shadows:** If a floating action button (FAB) or modal is required, use an ultra-diffused shadow:
    *   `Y: 8px, Blur: 24px, Spread: 0, Color: #1b1c1a at 4% opacity`.
*   **The Ghost Border Fallback:** For accessibility in input fields, use a "Ghost Border" using `outline-variant` (#c1c8c4) at 20% opacity. Never use 100% opaque lines.

---

## 5. Components

### Menu Cards & Lists
*   **Constraint:** No dividers. Use `spacing.xl` (1.5rem) to separate "Coffee" from "Food."
*   **Visual Style:** Use `rounded-lg` (1rem) for item containers. When an item is "Featured," use a `primary-container` (#1a3c34) background with `tertiary-fixed-dim` (#4de082) text for the "Signature" badge.

### Buttons
*   **Primary:** `rounded-full`, Background: `primary` (#01261f), Text: `on-primary`. Use lowercase labels.
*   **Secondary:** `rounded-full`, Background: `secondary-container` (#ffd1b3), Text: `on-secondary-container`.
*   **Tertiary (Signature):** Text-only, using `tertiary-fixed-dim` (#4de082) for high-impact labels like "New" or "Chef's Choice."

### Input Fields
*   **Style:** Minimalist. No bottom line. Use `surface-container-low` as the fill.
*   **Corners:** `rounded-md` (0.75rem).
*   **States:** On focus, transition the background to `surface-container-high`.

### Category Chips
*   **Filter Chips:** `rounded-full`. Unselected: `surface-container-high`. Selected: `primary` with `on-primary` text. This provides a clear, high-contrast toggle for "Mocktails" or "Snacks."

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical margins. For example, a 24px left margin and a 48px right margin for item descriptions to create an editorial "ragged" feel.
*   **Do** use `tertiary-fixed-dim` (#4de082) sparingly as a "highlighter" for the most important item in a category.
*   **Do** embrace lowercase for all navigational elements.

### Don't:
*   **Don't** use pure black (#000000). Always use `on-surface` (#1b1c1a) for text to keep the "warm" aesthetic.
*   **Don't** use standard 1px dividers between list items. Use whitespace or a subtle color shift to `surface-container-lowest`.
*   **Don't** use sharp corners. Every interactive element must use at least `rounded-sm` (0.25rem), with a preference for `lg` (1rem) for larger cards.