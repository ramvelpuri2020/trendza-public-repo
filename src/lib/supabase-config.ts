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