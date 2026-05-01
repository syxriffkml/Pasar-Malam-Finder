# Handoff: Pasar Malam Finder

## Overview
Pasar Malam Finder is a community-built directory for night markets ("pasar malam") across Malaysia. Users land on the site, pick a night of the week, browse markets that are open that night, see them on a map, drill into a market profile, and read community reviews. There is also a flow for submitting a new market.

This handoff covers the **single landing/browse page** that contains all seven sections in one scrolling view: hero + search, day filter, market cards grid, map, market detail, reviews, and submit-a-market CTA.

## About the Design Files
The files in this bundle are **design references created in HTML** — a prototype showing intended look and behavior, not production code to copy directly. The task is to **recreate this design in the target codebase's existing environment** (React, Vue, SwiftUI, native, etc.) using its established patterns, components, and design tokens.

If no codebase exists yet, pick a framework that fits the team (React + Tailwind or React + CSS Modules are both fine for this) and implement the design there. Don't ship the raw HTML.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, radii, and basic interactions are locked. Recreate pixel-perfectly using the codebase's libraries and patterns. The only exception is the map — it is a stylized SVG/CSS placeholder; in production this should be a real map (Mapbox, Google Maps, MapLibre).

## Screens / Views

There is one page with seven stacked sections, all max-width **1180px**, horizontally centered, with **32px** horizontal padding.

### 1. Top Nav
- Sticky-feeling top bar (not actually sticky in mock).
- Left: brand lockup. 28×28px red rounded square (`#e5311d`, radius 6px) with white "P" in Anton, rotated `-4deg`. Followed by wordmark `PASAR.FINDER` in Anton 22px, with the dot in red.
- Center: links — `Markets`, `Map`, `Reviews`, `Submit a market`. Sora 14px, 75% opacity, full opacity on hover, 28px gap.
- Right: dark CTA button "Sign in" — `#1a1209` background, white text, Sora 13px/500, 9px×16px padding, radius 8px.
- Bottom border: `1px solid #e0d8c8`.

### 2. Hero
Padding `68px 0 56px`.

- **Pill tag** (top): white background, 1px `#e0d8c8` border, radius 999px, padding 7px×14px, Sora 12px/500. Contains a blinking 8px red dot (`@keyframes blink`, 1.4s, opacity 1↔0.4 with expanding box-shadow ring) and copy `34 markets open tonight · Khamis`.
- **Display headline H1**: Anton, `clamp(72px, 11vw, 156px)`, line-height 0.92, letter-spacing -0.01em, uppercase. Three lines:
  1. `CARI`
  2. `pasar malam` — Instrument Serif italic, lowercase, `#e5311d`, weight 400, letter-spacing -0.02em, 6px horizontal padding.
  3. `NEAR YOU` inside a red rounded box — `#e5311d` background, white text, padding `6px 22px 12px`, radius 12px, rotated `-1.2deg`, with the inner text translated `4px` down via a nested `<span>`.
- **Subhead**: Sora 17px, color `#8a7d65`, max-width 560px, margin `26px 0 32px`. Bolded numbers (`248 night markets`) in `#1a1209` weight 600.
- **Search bar**: white, 1px border `#e0d8c8`, radius 14px, padding `8px 8px 8px 18px`, max-width 720px, double shadow `0 2px 0 rgba(26,18,9,0.04), 0 12px 32px -16px rgba(26,18,9,0.18)`. Contains:
  - 20px magnifier SVG icon, `#8a7d65`.
  - Input, transparent, Sora 15px, padding 12px 0, placeholder `Try 'Taman Tun', 'Shah Alam' or 'char kway teow'…` in muted color.
  - Submit button "Cari sekarang" — red `#e5311d`, white, Sora 14px/600, padding 12px×22px, radius 8px. Hover: bg `#c92715`, translateY -1px.
- **Stats strip**: 4-column grid, top + bottom border `1px #e0d8c8`, margin-top 56px. Each stat: 26px×24px padding, right-divider `1px #e0d8c8` (last cell no divider).
  - Number: Anton 56px, color `#e5311d`, line-height 1. Optional unit (e.g. `K`) in 22px.
  - Label: Sora 12px, uppercase, letter-spacing 0.12em, weight 500, color `#8a7d65`, margin-top 8px.
  - Values: `248 Markets listed`, `13 States covered`, `4.7K Verified reviews`, `34 Open tonight`.

### 3. Day Filter — "What day are you free?"
- **Section header** (used for all sections below):
  - Eyebrow: Sora 11px, uppercase, letter-spacing 0.18em, color `#e5311d`, weight 600, margin-bottom 8px. e.g. `Step 01 — pick a night`.
  - Title: Anton 44px, uppercase, letter-spacing 0.01em, line-height 1. The accent word (e.g. `day`) is in Instrument Serif italic, lowercase, `#e5311d`, weight 400.
  - Right-aligned meta: Sora 13px, `#8a7d65`, with bolded `#1a1209` value.
- **Day pills**: horizontal flex, 10px gap, wrapping. Each pill — white, 1px `#e0d8c8` border, radius 999px, padding 10px×22px, Sora 14px/500, with a small count chip (Sora 11px, opacity 0.7).
- States: hover → border `#1a1209`. Active → red bg `#e5311d`, white text, red border. (JS: clicking a pill toggles `.active` and clears it from the others — see script tag at bottom of HTML.)
- Days: `Ahad, Isnin, Selasa, Rabu, Khamis, Jumaat, Sabtu`. Default active = `Khamis`.

### 4. Markets Tonight — Cards Grid
- 2-column grid, 20px gap, margin-top 18px.
- **Card** (`.card`): white, 1px `#e0d8c8` border, radius 14px, overflow hidden. 3px top "band" (default red `#e5311d`; variants: yellow `#f5c518`, neutral `#e0d8c8`).
- Hover: translateY -3px, shadow `0 18px 40px -22px rgba(26,18,9,0.25)`. 0.2s ease.
- Body padding `22px 22px 20px`. Layout:
  - **Top row**: badge (left) + market number (right, Anton 14px, `#8a7d65`, letter-spacing 0.05em, e.g. `№ 014`).
  - **Badges** — Sora 11px/600, uppercase, letter-spacing 0.08em, padding 5px×10px, radius 6px, with a 6px round dot in `currentColor`:
    - `.badge.open` — bg `#fdf0ee`, text `#e5311d`, border `1px #f5c4bc`.
    - `.badge.verified` — bg `#f0e9d6`, text `#1a1209`, border `1px #e0d8c8`.
    - `.badge.unverified` — bg white, text `#8a7d65`, border `1px dashed #e0d8c8`.
  - **Name**: Anton 32px, uppercase, line-height 1, letter-spacing 0.01em. Two lines via `<br/>` (e.g. `Pasar Malam` / `Taman Tun`).
  - **Area**: 📍 emoji + `Kuala Lumpur · 2.4 km away`. Sora 13px, `#8a7d65`, margin-top 8px.
  - **Bottom row**: top border 1px `#e0d8c8`, padding-top 14px, margin-top 18px. Day + hours on left (Sora 13px/500; hours italic-styled via `<em>` but actually `font-style: normal, color #8a7d65, weight 400`). Rating right (red, weight 600, e.g. `★ 4.8`).
- 4 cards in mock. Tweak the band color + badge variant to express market status.

### 5. Map — "Nearby tonight"
- 380px tall, 1px border `#e0d8c8`, radius 14px, overflow hidden, margin-top 16px.
- Background = layered CSS gradients producing a stylized map: a 40px×40px grid of 1px `rgba(224,216,200,0.6)` lines + a radial cream wash (`#f5ecd8 → #f0e9d6 → #ebe2ca`).
- A `::before` pseudo overlays one vertical "highway" (red tint, 0.6% wide at 50%) and two horizontal "roads" (taupe tint, at 30% and 65%).
- **Pins** (`.map-pin`): 18×18px red circles, 3px white border, drop shadow `0 4px 10px rgba(229,49,29,0.4)`. Each has two pulsing concentric `::before` and `::after` rings — `@keyframes pulse` 2.2s, scale 0.8→3, opacity 0.9→0, second ring delayed 1.1s.
- 3 pins positioned via top/left percentages: 30%/28%, 56%/52%, 38%/74%.
- **Zoom control** (top-right, 18px inset): white, 1px border, radius 10px, two stacked 34×34px buttons `+` and `−` separated by a 1px divider, hover bg `#faf5eb`.
- **Legend** (bottom-left, 18px inset): white card, 1px border, radius 10px, padding 12px×14px, Sora 12px, with the same blinking red dot from the hero pill. Copy: `3 markets · live within 8 km`.
- **In production this should be a real map**. Keep the legend, zoom control, and red pin styling.

### 6. Market Detail
A featured profile card (margin-top 18px).

- Container: bg `#fdf0ee`, 1px border `#f5c4bc`, radius 16px, padding `44px 44px 36px`, position relative, overflow hidden.
- **Watermark**: absolutely positioned bottom-right (-30px right, -40px bottom), Anton 240px, line-height 0.85, color `rgba(229,49,29,0.07)`, uppercase, letter-spacing 0.02em, no pointer events, no select. Content: `PM·014`.
- **Eyebrow**: same Sora 11px / red / uppercase / 0.18em as section eyebrows, but inline-flex with a 7px blinking red dot. Copy: `Live · Khamis · open until 11pm`.
- **Name (H3)**: Anton, `clamp(48px, 7vw, 88px)`, line-height 1, uppercase, margin `14px 0 14px`. Two lines: `Pasar Malam` / `Taman Tun Dr Ismail`. The accent words (e.g. `Taman Tun`) use Instrument Serif italic, lowercase, `#e5311d`, weight 400.
- **Address**: Sora 15px, `#8a7d65`.
- **Chips row** (margin-top 22px, flex wrap, 10px gap): white bg, 1px `#f5c4bc` border, `#e5311d` text, Sora 13px/500, padding 8px×14px, radius 999px. Some include a 14px stroked SVG icon (clock for hours, location pin for distance). Mock chips:
  - `🕐 6.00pm – 11.00pm`
  - `📍 2.4 km from you`
  - `★ 4.8 · 312 reviews`
  - `~120 stalls`
  - `Halal-friendly`
  - `Cash & QR`
  - `Parking nearby`
- **Action buttons** (margin-top 30px, 12px gap):
  - Primary "Save market" — red bg `#e5311d`, white text, with a 16px filled-bookmark SVG. Sora 14px/600, padding 14px×22px, radius 10px. Hover bg `#c92715`, translateY -1px.
  - Secondary "Report issue" — white bg, 1px `#e0d8c8` border, dark text, with a 16px stroked alert-circle SVG. Hover border → `#1a1209`.

### 7. Reviews
- 2-column grid, 20px gap, margin-top 16px.
- **Review card** (`.review`): white, 1px `#e0d8c8` border, radius 14px, padding 24px.
- **Head**: 14px gap, center-aligned. Avatar = 46×46px circle, bg `#fdf0ee`, color `#e5311d`, border `1px #f5c4bc`, Anton 18px initials.
- **Name**: Sora 15px/600.
- **Meta**: Sora 12px, `#8a7d65`. Inline list separated by `·`: stars line (red, 13px, letter-spacing 1px, e.g. `★★★★★`) · timestamp · `Verified visit`.
- **Body**: Sora 14px, line-height 1.6, `#8a7d65`, margin-top 14px. Bolded food terms (`apam balik`, `satay`, `char kway teow`) in `#1a1209`/600.
- 2 reviews in mock — see the HTML file for exact copy.

### 8. Submit-a-market Row
- Section header: eyebrow `Help us grow`, title `Add a market`, meta `Takes 90 seconds · we verify within 48h`.
- Button row (margin-top 18px, padding `28px 0 80px`, 14px gap):
  - Primary "Submit a market" — uses `.btn-anton` modifier: Anton, letter-spacing 0.06em, uppercase, 18px, padding 16px×28px, on top of red bg.
  - Secondary "How verification works →" — white, dark text, 1px border.

### 9. Footer
- Top border `1px #e0d8c8`, padding `36px 0 56px`, Sora 13px, `#8a7d65`, flex space-between.
- Left: `PASAR.FINDER` wordmark in Anton 16px, dark.
- Right: `Built by & for the rakyat · © 2026`.

## Interactions & Behavior

- **Day pills**: clicking a pill sets `.active` on it and removes from siblings. Real impl: filter the cards list and update meta text + map pins to that night.
- **Search submit**: navigate to `/search?q=…`. Real impl: query backend by free-text + location.
- **Cards**: clickable → market detail page. Hover lift `-3px` + drop shadow.
- **Map**: in production swap to a real map. Pins clickable → open the same detail. Zoom buttons should actually zoom.
- **Save market**: toggles a saved state; require auth.
- **Report issue**: opens a modal with a short form (reason + optional note).
- **Animations**:
  - `@keyframes blink` — 1.4s ease-in-out infinite, opacity 1↔0.4, expanding red box-shadow ring 0→6px.
  - `@keyframes pulse` — 2.2s ease-out infinite, scale 0.8→3, opacity 0.9→0. Used on map pins (two rings, second delayed 1.1s).
  - Card hover: 0.2s transform + shadow.
  - Buttons: 0.15s transform + bg.

## State Management
For a production implementation:
- `selectedDay` (default = today's day-of-week in Malay).
- `userLocation` (lat/lng or null; if null, default to KL center).
- `markets` (paginated query by day + sorted by distance from `userLocation`).
- `selectedMarket` (for the detail panel — could be route param `/market/:id`).
- `savedMarketIds` (per-user, requires auth).
- `searchQuery` (free text).
- Reviews come from a separate query keyed on `selectedMarket`.

## Design Tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#faf5eb` | Page background (warm cream) |
| `--surface` | `#ffffff` | Cards, search bar, nav buttons |
| `--soft` | `#f0e9d6` | Verified badge bg, stat strip accents |
| `--red` | `#e5311d` | Primary brand red — accent type, CTAs, pins |
| `--red-tint` | `#fdf0ee` | Detail card bg, "open" badge bg, avatar bg |
| `--red-border` | `#f5c4bc` | Detail card border, chip borders |
| `--yellow` | `#f5c518` | Card band variant |
| `--ink` | `#1a1209` | Primary text, dark CTA bg |
| `--muted` | `#8a7d65` | Secondary text, addresses, meta |
| `--border` | `#e0d8c8` | All neutral borders + dividers |

### Typography
- **Display**: `Anton`, sans-serif (Google Fonts).
- **Accent / italic**: `Instrument Serif`, italic 400 (Google Fonts). Used for the "lowercase serif italic" word inside otherwise-Anton headlines.
- **Body / UI**: `Sora`, weights 300/400/500/600/700 (Google Fonts).
- Type scale (rounded):
  - Hero H1 — Anton, `clamp(72px, 11vw, 156px)`, line-height 0.92.
  - Detail H3 — Anton, `clamp(48px, 7vw, 88px)`, line-height 1.
  - Section title — Anton 44px, line-height 1.
  - Card name — Anton 32px, line-height 1.
  - Stat number — Anton 56px, line-height 1.
  - Body — Sora 15px, line-height 1.5.
  - Subhead — Sora 17px, line-height 1.55.
  - Eyebrow — Sora 11px, uppercase, letter-spacing 0.18em, weight 600.
  - Meta / micro — Sora 12–13px.

### Spacing
- Page padding: 32px horizontal.
- Max-width: 1180px.
- Section vertical rhythm: `padding: 64px 0 8px;` between sections.
- Card grid gap: 20px.
- Reviews grid gap: 20px.
- Day pills gap: 10px.
- Detail chips gap: 10px.

### Radii
- 6px — small badges, brand mark.
- 8px — small buttons, search submit.
- 10px — secondary buttons, map zoom, legend.
- 12px — red box around "NEAR YOU".
- 14px — search bar, cards, map, review cards.
- 16px — detail card.
- 999px — pills, chips, avatars.

### Shadows
- Search bar: `0 2px 0 rgba(26,18,9,0.04), 0 12px 32px -16px rgba(26,18,9,0.18)`.
- Card hover: `0 18px 40px -22px rgba(26,18,9,0.25)`.
- Map pin: `0 4px 10px rgba(229,49,29,0.4)`.
- Map legend: `0 6px 20px -10px rgba(0,0,0,0.2)`.

### Borders
- Default neutral: `1px solid #e0d8c8`.
- Red accent: `1px solid #f5c4bc`.
- Dashed (unverified badge): `1px dashed #e0d8c8`.

## Assets
- All icons are inline SVG (search, clock, pin, alert, bookmark) — no external icon library.
- One brand mark drawn in CSS (rotated red square + Anton "P").
- Two emoji used as icons (📍 in card area, 🕐 chip variant uses an SVG instead). Replace emoji with proper icon-set glyphs in production.
- No images used. The map is fully CSS — replace with a real map component.
- Fonts loaded from Google Fonts.

## Files
- `Pasar Malam Finder.html` — the full single-page prototype with all seven sections inlined (CSS in `<style>`, day-pill JS at bottom).
