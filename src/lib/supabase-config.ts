// Non-generated config — safe from `supabase gen types` wipes.
// Import from here instead of client.ts for URL/key access.
//
// The web demo runs fully offline with ZERO configuration (the local
// `demo/supabase` client backs the same query API against localStorage).
// When you set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in a `.env`
// file, the real Supabase client is used instead and the AI features
// (try-on, style analysis) hit the real edge functions.
export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";

export const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

/** True when no real backend is wired — we run against the demo store. */
export const IS_DEMO_MODE = !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY;

// ── Demo-mode LIVE SEARCH ────────────────────────────────────────────────
// In demo mode the wardrobe/closet run offline on localStorage, but web
// search (search-clothes) and its image proxy hit the REAL edge functions, so
// reviewers get genuine Google Shopping results with zero setup. This only
// uses the *publishable* anon key (designed to be embedded in client apps);
// the secret SERPER / DashScope keys never leave the edge function env.
// Override with VITE_DEMO_SEARCH_URL / VITE_DEMO_SEARCH_ANON to point
// elsewhere.
export const DEMO_SEARCH_URL =
  (import.meta.env.VITE_DEMO_SEARCH_URL as string | undefined) ??
  "https://jjqwhxamjxsiotnhhqco.supabase.co";

export const DEMO_SEARCH_ANON_KEY =
  (import.meta.env.VITE_DEMO_SEARCH_ANON as string | undefined) ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqcXdoeGFtanhzaW90bmhocWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxMDQxNTQsImV4cCI6MjA1MzY4MDE1NH0.4KMTPF3R6-XQCeRVPSuuWibRawzjEtk60RFCQZr2dz0";

/** Real edge-function base for demo-mode search calls. */
export const DEMO_SEARCH_ENDPOINT = `${DEMO_SEARCH_URL}/functions/v1/search-clothes`;

/** The edge-function endpoint to use for search-clothes, in either mode. */
export const SEARCH_FN_ENDPOINT =
  IS_DEMO_MODE
    ? DEMO_SEARCH_ENDPOINT
    : `${SUPABASE_URL}/functions/v1/search-clothes`;

/** The publishable key to use for search-clothes, in either mode. */
export const SEARCH_FN_KEY =
  IS_DEMO_MODE ? DEMO_SEARCH_ANON_KEY : SUPABASE_PUBLISHABLE_KEY;