# trendza — AI Wardrobe & Outfit Planner

This is the same app I ship to the App Store, set up so you can run the whole
thing in a browser in under a minute — no accounts, no API keys, no backend.

```bash
npm install
npm run dev
```

Pick a wardrobe when it asks (Female / Male), and you're in. Clothes come
seeded, outfits save to your browser's `localStorage`, and the AI features are
the real production ones — wired to a live server the moment you add keys.

---

## Run it like a phone (read this first)

The app is designed mobile-first, so if you're on a desktop browser it will
render in a centered phone frame — nice, but it feels better full-screen:

1. **Right-click** anywhere on the page and hit **Inspect** (or press
   `Ctrl+Shift+I`).
2. Click the **toggle device toolbar** icon (looks like a small phone in front
   of a tablet), or press **`Ctrl+Shift+M`**.
3. Pick any phone model from the dropdown at the top (iPhone 14 / Pixel 7,
   whatever) and tap **Fit to window**.

Now every screen, gesture, and snap animates exactly like it does in the
native app. This is how it was built, so this is how it's meant to be seen.

---

## What it does, feature by feature

The whole product lives in one React SPA. The route bar is the bottom nav; the
first segment of the URL picks the screen (`/dress-me`, `/wardrobe`,
`/canvas`, `/clip`, `/planner`, `/fits`, `/scan`, `/closet`, `/profile`).
Everything funnels through one hub component that switches on that segment, so
tabs are deep-linkable (`/fits` loads straight into your saved looks).

### Dress Me (`/dress-me`) — the core of the app
A vertical **scroll-snap shuffler** that stacks a top, bottom, and shoes into a
single look. Instead of a grid, you flick through garments and it tucks them
together — pegs same-category items, overlaps top-over-bottom and shoes at the
ankle so it reads like an outfit, not a slideshow. Tap a slot to re-pick that
piece. When you like the look, hit **Save Look**, name it, and it lands in
**Saved** (`/fits`). A haptic "tick" fires on every snap.

### The "+" button (bottom-center of every main tab)
The floating action button opens an **"Add to Wardrobe"** bottom sheet with
four quick actions:

| Action | What it does | Where it takes you |
|---|---|---|
| **Upload Item** | Take / pick a photo and add a piece | `/wardrobe` |
| **Clip** | Crop a piece out of any shopping page, remove the background | `/clip` |
| **Create Outfit** | Drag pieces around a freeform styling board | `/canvas` |
| **Plan a Day** | Schedule an outfit on the calendar | `/planner` |

That sheet is the product's muscle memory — "I just saw something I want in my
closet" is one tap from anywhere.

### Wardrobe (`/wardrobe`)
Your closet as a filterable grid. It reads raw rows from the data layer and
normalizes them so every view shares the same items. Each tile renders an
instant blurhash placeholder while the real image loads (so it never flashes
blank), then swaps in the garment photo. Category chips filter (Tops /
Bottoms / Shoes / All). A small detail most users won't notice: brand-new
items arrive with `category: 'pending'` and only appear under **All** until the
AI classifier finalizes their real category — so they never pop in weirdly
mid-filter.

### Canvas (`/canvas`)
A freeform styling board — grab pieces, drag, rotate, and scale them into a
composed look, then save it to **Saved** (`/fits`) or keep editing. It has a
built-in fit builder; editing from a saved look deep-links in (`/canvas?edit=<id>`).

### Clip (`/clip`)
The web clipper. Paste a store URL, pick a crop, and it runs background
removal (a dedicated `process-bg` edge function) so the single garment PNG is
cut out and added to your closet with transparent edges. New items insert as
`pending` and slot into the grid once classified.

### Planner (`/planner`)
An outfit **calendar** — a month you navigate with a week strip. Each day
gets an outfit and an **AI try-on preview**: the `plannerService` kicks off the
edge function, caches by a content-hash of person + garments so the same look
never regenerates, invalidates when the base photo changes, generates in the
background, and polls until it's ready. The UI never blocks while it cooks.

### Saved (`/fits`)
Every look you've created — shuffler results, canvas boards, planner picks —
in one place with previews. Delete or edit straight from here.

### Scan / Closet / Profile (`/scan`, `/closet`, `/profile`)
The scanning flow (`analyze-style`) grades an outfit photo with a style score,
breakdown, and tips; the closet view manages every piece; profile shows your
stats, photos, and upgrade state. `react-router` guards all of these behind a
completed onboarding, which the demo seeds for you so you skip the wall.

---

## The AI, honestly

These are the real edge functions from production — nothing faked:

- **Try-on (`generate-tryon`)** — powered by **Qwen Image 2.0** through
  Alibaba's **DashScope** API. It takes your person photo + up to two garment
  images, builds a strict prompt that tells the model exactly *which* regions
  to change and which to preserve (fit, fabric, pose, background), returns the
  composite PNG, and re-encodes it to a much smaller JPEG for fast delivery.
- **Style analysis (`analyze-style`)** — a **Qwen2.5-VL-72B** vision model that
  reads an outfit photo and returns a grade, breakdown, and tips.
- **Background removal (`process-bg`)** — cleanly cuts a clipped garment out of
  its product page.

In demo mode (no keys) these show a clear **"needs a real backend"** message
instead of failing silently. To turn them on, add your Supabase + DashScope
keys in a `.env.local`, restart the dev server, and the same code hits your
live functions.

---

## Why it just works — the one-import seam

Forty-plus components talk to the data layer through **one** import,
`src/integrations/supabase/client.ts`. It picks the backend:

- **No keys set** → a `localStorage`-backed client (`src/lib/demo/`) mirrors the
  query surface the app already uses (`from().select().eq().order().single()`,
  auth, storage, `functions.invoke`).
- **Keys set** → the genuine `@supabase/supabase-js` client, JSON-driven, with
  the real AI behind it.

So the exact same components run unchanged against either backend — no fake
branches through the UI, no duplicated logic. The only demo-specific screen is
a gender gate (`src/components/demo/DemoGenderGate.tsx`) that seeds the
matching wardrobe from your real `demo-wardrobe.ts`.

---

## The engineering I'd love to talk about

- **A backend swapped behind a single import** — real components, two data
  layers, zero duplicated UI.
- **The dress-me interaction** — a scroll-snap, haptic-ticked carousel that
  tucks garments together and has to feel like flipping through clothes, not a
  grid.
- **An async pipeline that hides latency** — content-hash cache, rebuild
  invalidation, background generation, and polling in `plannerService.ts` so a
  try-on never blocks the day view.
- **Race-safe wardrobe state** — `useClosetData` is the single source of truth;
  it owns duplicate-load resolution, stale-request handling, and a deferred
  re-seed path that only exists because real users break real backends.
- **Client-side smarts** — images downscaled before upload, magic-byte MIME
  checks in the edge functions, and deliberate cost/latency reasoning about
  where the work runs.

---

## Quick orientation

```
src/
  integrations/supabase/client.ts   # the one seam — real vs. demo backend
  lib/demo/                         # localStorage client + query builder
  lib/demo-wardrobe.ts              # gender-specific seed wardrobes
  services/plannerService.ts        # async try-on pipeline w/ content-hash cache
  hooks/useClosetData.ts            # race-safe wardrobe source-of-truth
  components/                       # every screen (Dress Me, Canvas, Planner…)
public/clothes/                     # seed garment images
```

Native mobile plugin calls sit behind `Capacitor.isNativePlatform()` guards, so
they flatten to no-ops in the browser.