# Pasar Malam Finder

A community-built directory of Malaysian night markets (pasar malam). Find operating hours, locations, and reviews for markets near you, tonight or any night.

Built with SvelteKit, Supabase, Leaflet, and GSAP.

This is a personal learning project. The primary goal was to get hands-on experience with Supabase as a full backend — not just as a database, but using its auth system, row-level security policies, and service role for server-side scripts. The pasar malam theme was chosen because it is a real local problem worth solving, which made it easier to stay motivated through the full build.

---

## What this project does

- Lists pasar malam markets across Malaysia with location, operating days, and hours
- Interactive Leaflet map with real coordinates for every market
- Filter by day of the week and state
- Search by name, area, or state
- Market detail pages with description, reviews, and star ratings
- User authentication (sign up, sign in) via Supabase Auth
- Authenticated users can write reviews and save favourite markets
- Admin panel for resolving user-submitted reports

---

## Why Supabase

Supabase was the main thing being practised here. It handles three things at once that would normally require separate services: a PostgreSQL database, user authentication, and file storage (though storage was not used in this project).

The specific Supabase concepts practised in this build:

- **Row Level Security (RLS)** — every table has policies so users can only read or write their own data. For example, a user can only delete their own review, not someone else's. The admin user bypasses these via a checked `is_admin` flag on their profile.
- **Auth triggers** — a PostgreSQL trigger automatically creates a row in the `profiles` table whenever a new user signs up, copying the username from their metadata. This keeps auth and app data in sync without any extra API call.
- **Service role key** — used in the seed scripts to bypass RLS and insert data directly as a trusted server process, the same way a backend would.
- **Realtime and `invalidateAll`** — after form actions (resolving a report, submitting a review), SvelteKit's `invalidateAll` re-runs the server load function to reflect the latest database state without a full page reload.
- **`@supabase/supabase-js` with SvelteKit** — wiring the Supabase client into SvelteKit's server hooks (`handle`) so every route has access to the current session without redundant auth checks.

Could this have been built with a different backend? Yes. But Supabase made it practical to go from zero to a working auth system, relational data model, and access control in a single project without managing a separate server.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | SvelteKit 2 (Svelte 5 runes) |
| Database + Auth | Supabase (PostgreSQL, Row Level Security) |
| Maps | Leaflet.js with CartoDB Voyager tiles |
| Animations | GSAP with ScrollTrigger |
| Styling | Tailwind CSS with custom design tokens |
| Fonts | Anton, Instrument Serif, Sora (Google Fonts) |

---

## What I learned

**Supabase and PostgreSQL**

Working with RLS for the first time made it clear how much security logic can live at the database level rather than in application code. Writing policies forces you to think about who owns what data and under what conditions reads and writes should be allowed. The auth trigger pattern (auto-creating a profile on signup) was something new — understanding that Supabase Auth and the public schema are separate systems that need to be bridged manually.

**SvelteKit server-side patterns**

Using `load` functions on the server to fetch data before the page renders, passing it to components through `PageData`, and using form actions for mutations (instead of client-side fetch calls) was a different mental model compared to React. It took time to understand when to use `+page.server.ts` vs `+page.ts` and why the distinction matters for auth-gated pages.

**Svelte 5 runes**

Svelte 5 replaced the familiar `$:` reactive statements and `writable` stores with an explicit runes system (`$state`, `$derived`, `$effect`, `$props`). The adjustment was noticeable — especially understanding that `$effect` should not be used for derived values and that `$derived` is not just syntactic sugar but has different evaluation semantics.

**Leaflet with a bundler**

Leaflet was harder to integrate than expected. It assumes a browser environment and must be imported dynamically inside `onMount`. There was also a Vite config issue (`optimizeDeps.exclude`) that silently broke both maps on the site before it was identified and removed.

**GSAP animations**

GSAP's `from`, `fromTo`, and ScrollTrigger gave fine-grained control over entrance animations that CSS transitions alone cannot achieve cleanly. The stagger pattern for animating card lists and the `back.out` easing for interactive elements (like filter pills) made the UI feel more polished without a lot of extra code.

**Working with open data**

OSM data is real but inconsistent. Many entries had no area, no opening hours, and generic names that are street names rather than market names. Building the import pipeline meant learning how to query the Overpass API, normalise Malay state name variants, parse the `opening_hours` tag format, and filter out low-quality records before they reach the database.

**What cannot be done cheaply**

Google Places API costs money at any real scale. Foursquare's free tier has no coverage of Malaysian night markets. Web scraping violates Terms of Service and is actively blocked. These are real constraints that shaped the data approach — OSM for locations, generated descriptions, and seeded reviews — rather than constraints that can be engineered around.

---

## Data sources

Market data is imported from OpenStreetMap (OSM) via the Overpass API. OSM is free, openly licensed, and already has coordinates for most Malaysian pasar malams — which is why it was chosen over alternatives.

Descriptions are generated from market metadata (name, area, state, operating days, hours) since OSM entries rarely carry description tags.

Reviews are seeded using a pool of fictional user profiles with realistic Malay and English comments, since no free public review API covers Malaysian night markets at meaningful scale.

---

## Constraints and known limitations

**Why not Google Places / Google Maps data?**

Google Places API is the obvious source for real business data and reviews, but it requires a billing account and charges per request (roughly $17 per 1000 Place Details calls and $5 per 1000 Nearby Search calls). For a project at this scale, that cost adds up quickly with no guarantee of complete coverage for smaller local markets.

**Why not scrape Google or other websites?**

Scraping Google Maps, TripAdvisor, or similar platforms violates their Terms of Service. Google actively blocks scrapers, and repeated attempts risk IP bans. It is also legally grey territory in Malaysia under the Computer Crimes Act. This project stays clear of that.

**Why not Foursquare?**

Foursquare has a free tier (1000 API calls per day) but its coverage of Malaysian pasar malams is essentially zero. Every single market returned a miss during testing.

**OSM data quality**

OSM entries for Malaysian night markets are inconsistent. Many lack area, address, or opening hours tags. The import script filters out entries with purely generic names (e.g. "Jalan Pasar Malam", "Tapak Pasar Malam") and extracts area information from market names when OSM tags are absent.

**Reviews are seeded, not real**

The review content on this project is generated seed data. The review system itself is fully functional — authenticated users can submit real reviews — but the existing entries were inserted by script to give the site a populated appearance before real users arrive.

---

## Local setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Create a Supabase project and run `supabase/schema.sql` against it.

3. Copy `.env.example` to `.env` and fill in your keys:

```
PUBLIC_SUPABASE_URL=your_project_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
```

4. Seed the database:

```bash
node scripts/import-osm.js
node scripts/generate-descriptions.js
node scripts/generate-reviews.js
```

5. Start the dev server:

```bash
npm run dev
```

---

## Scripts

| Script | Purpose |
|---|---|
| `scripts/import-osm.js` | Fetches pasar malam data from OpenStreetMap via Overpass API and inserts into Supabase |
| `scripts/generate-descriptions.js` | Generates template-based descriptions for markets that have none |
| `scripts/generate-reviews.js` | Seeds review data using fictional user profiles |
| `scripts/cleanup-markets.js` | Removes low-quality OSM entries with generic names or missing area data |
