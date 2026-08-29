# trendza

An AI wardrobe app. Take photos of your clothes, build outfits, plan what to
wear each day, and get AI-generated try-on previews of how a look actually
pulls together on you.

This is the real app — the same React codebase that ships to the App Store —
set up so you can run the whole thing in a browser with no backend, no
accounts, and no API keys:

```bash
npm install
npm run dev
```

Pick a wardrobe when it asks, and you're in. Clothes are seeded, outfits save
to your browser, and the AI features are wired to the real thing the moment
you add keys.

---

## The honest why

I got tired of apps that make you upload fifty five pieces of clothing before
they'll show you anything. So I built the opposite: you land, you pick a
vibe, and you're immediately putting outfits together — shuffling your closet
into a look, dragging pieces around on a board, clipping clothes from the web
into your wardrobe, and planning a week of outfits that actually fit your
schedule.

It started as "dress me" — a genuinely hard UI problem: how do you take a
disorganized pile of clothing photos and make picking an outfit feel good?
That one question pulled in everything else: image processing, a localStorage
data layer, background removal, AI try-on, and an async pipeline that had to
feel fast even though the hard work happens on a server.

This repo is a curated slice of that production app so it's easy to have a
conversation about. It's TypeScript, it runs, and it's small enough to read
in an afternoon.

---

## What you'll actually use

| Tab | What it does |
|---|---|
| **Dress Me** | A scroll-snap shuffler that stacks top / bottom / shoes into an outfit |
| **Wardrobe** | The closet — filter by category, it's your real data |
| **Canvas** | A freeform board — drag, rotate, scale pieces into a look |
| **Clip** | Search a store, crop, remove the background, add it to your closet |
| **Planner** | An outfit calendar with AI try-on previews |
| **Saved** | Every fit you've created, with previews |

Everything persists to localStorage, so a saved look survives a refresh.

### The AI features

Try-on previews and outfit analysis call real edge functions that need a
backend, so in demo mode they show a clear "needs a backend" message rather
than faking it. To turn them on:

```bash
# .env.local
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=paste-your-publishable-key
```

---

## The part I actually want to talk about

Any CRUD app can save a row. The interesting engineering here is in the
places where a straightforward answer wasn't the right one:

**A full backend, swapped behind one import.** Every component talks to the
data layer through a single `supabase` client
(`src/integrations/supabase/client.ts`). For this demo I wanted reviewers to
run the app instantly, but I refused to write fake branches through the UI.
So when no keys are set, that one import resolves to a localStorage-backed
client that mirrors the same query API (`from(...).select().eq().order()`,
auth, storage). Same components, two backends, zero duplicated UI logic.

**The dress-me interaction.** The shuffler is a scroll-snap, haptic-ticced
carousel that has to feel like flipping through clothes, not a grid. Getting
top/bottom/shoes to overlap and tuck correctly without feeling janky took
real iteration.

**An async pipeline that hides latency.** Planning an outfit kicks off
`plannerService.ts` → parity of a content-hash cache so the same person +
outfit never regenerates, base-photo-change invalidation, background
generation, and polling. The UI never blocks while the try-on is cooking.

**Race-safe state.** `useClosetData` is the single source of truth for the
wardrobe; it handles duplicate loads, stale request resolution, and even a
deferred re-seed when the DB hiccups on signup. This is the kind of bug-ridden
history you only get from a real app that real people use.

**Client-side smarts.** Images are downscaled before upload, magic-byte MIME
checking lives in the edge functions, and there's real reasoning about cost
and latency baked into where the work happens.

None of this is tutorial boilerplate. Each decision has a constraint behind
it and a story in the git history.

---

## Structure

```
src/
  integrations/supabase/client.ts   # the one seam — real vs. demo backend
  lib/demo/                         # localStorage-backed client + query builder
  lib/demo-wardrobe.ts              # gender-specific seed wardrobes
  services/plannerService.ts        # async try-on pipeline w/ content-hash cache
  hooks/useClosetData.ts            # race-safe wardrobe single-source-of-truth
  components/                       # every screen (Dress Me, Canvas, Planner…)
public/clothes/                     # seed garment images
```

The native mobile plugin calls are all behind `Capacitor.isNativePlatform()`
guards, so they flatten to no-ops in the browser.

---

## For the technical review

TypeScript, runnable, deployable, multiple files of substance. I built this
for actual users, not for this application. The stuff I'd love to defend in a
conversation: the single-seam backend swap, the dress-me interaction model,
the caching + invalidation in the try-on pipeline, and the state handling in
`useClosetData`.