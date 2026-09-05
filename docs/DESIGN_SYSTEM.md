# Chiti Bazaar Design System Specification

## 1. Palette: Obsidian Black & Fresh Leaf Green

Chiti Bazaar blends luxury obsidian dark mode with fresh, appetizing leaf green accents to convey both speed and fresh grocery quality:

| Role | Color Hex | Utility Class | Usage |
|---|---|---|---|
| **Background Surface** | `#070A07` | `bg-surface` | Main background |
| **Surface Container Lowest** | `#0B100B` | `bg-surface-container-lowest` | Product image plates, input wells |
| **Surface Container Low** | `#121812` | `bg-surface-container-low` | Cards, panels, modals |
| **Primary Brand** | `#10B981` | `text-primary` / `bg-primary` | CTAs, discount pills, radar indicators |
| **Fresh Leaf Vibrant** | `#22C55E` | `leaf-gradient` | Hero buttons, quantity steppers, cart bar |
| **Deep Forest Emerald** | `#059669` | `bg-emerald-600` | Active states, hover overlays |
| **Text Primary** | `#F8FAFC` | `text-on-surface` | Main titles, product names, prices |
| **Text Muted** | `#94A3B8` | `text-on-surface-variant` | Pack units, subtitles, descriptions |

---

## 2. Typography Hierarchy

- **Display & Headings**: `Outfit`, sans-serif
  - Headline Black (`font-headline font-black` / 900) for hero hooks, price tags, and shelf titles.
  - Headline Bold (`font-headline font-bold` / 700) for product titles and card headers.
- **Body & Captions**: `Inter`, sans-serif
  - Regular & Medium (`font-body font-medium` / 400-500) for grocery descriptions, pack sizes, address chips.
- **Monospace / Financial**: `Outfit / JetBrains Mono`
  - Bold tabular numbers for Rupee symbols (`₹`), prices, and ledger balances.

---

## 3. Blinkit-Grade Component Guidelines

### A. `ProductCard.tsx`
- **Image Plate**: Aspect-square container (`rounded-2xl bg-surface-container-lowest`), subtle border (`border border-white/5`), high-resolution product photography.
- **Top Badges**:
  - Discount badge top-left: `15% OFF` or `20% OFF` (`bg-primary text-white text-[10px] font-black rounded-full`).
  - Delivery speed badge top-right: `⚡ 10m` (`bg-black/70 backdrop-blur-md text-emerald-400`).
- **Typography & Pack Size**:
  - Category pill uppercase (`text-[11px] font-semibold text-primary`).
  - Title in 2 lines with ellipsis (`font-bold text-sm leading-snug line-clamp-2`).
  - Pack size pill (`500 ml pouch`, `1 kg bag`).
- **Pricing & Action**:
  - Selling price `₹28` in large bold text + MRP `₹35` strikethrough.
  - `ADD +` button: emerald pill with subtle border and scale micro-interaction.
  - Quantity Stepper: animated `− {qty} +` with emerald gradient background and haptic feedback.

### B. Floating Cart Dock
- Positioned fixed above the bottom navigation bar when `cartCount > 0`.
- Gradient: `leaf-gradient` with emerald border glow.
- Left side: Shopping cart icon + `{count} items · ₹{total}` + `Delivery in 10 mins`.
- Right side: White pill button `View Cart ➔`.

### C. Digital Khata Ledger (`vendor/udhaar`)
- Replaces flat neon rectangles with luxury obsidian cards (`bg-surface-container-low border border-primary/30 p-7 rounded-3xl`).
- Glowing emerald accent orbs in corners.
- Detailed metrics with mini progress meters (Collection Rate, DSO, Credit Utilization).
- WhatsApp reminder trigger button on every active balance card.
