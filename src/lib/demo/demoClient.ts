/**
 * demoClient.ts — a demo-mode replacement for @supabase/supabase-js.
 *
 * The real app imports the Supabase client from ONE place
 * (`@/integrations/supabase/client`). When no backend keys are configured we
 * hand back this object instead: same method names, same `{ data, error }`
 * shape, same `auth`/`storage`/`functions` surface — but everything reads and
 * writes a localStorage store. That lets the **entire existing UI run
 * unchanged and fully offline**, with a fake local session.
 *
 * When real keys ARE configured (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
 * the integration layer uses the genuine @supabase/supabase-js client and the
 * real edge functions, so the AI features (try-on, style analysis) come to
 * life.
 */

import { DemoQuery, seedTableIfEmpty } from "./demoStore";
import { getDemoItemsForGender } from "../demo-wardrobe";

const AUTH_KEY = "trendza_demo_auth_v1";
const ONBOARDING_KEY = "trendza_demo_onboarding_v1";
const GENDER_KEY = "trendza_demo_gender_v1";

export const DEMO_USER_ID = "00000000-0000-4000-a000-0000000000dd";

/** Store the visitor's chosen gender so the demo shows the right wardrobe. */
export function getDemoGender(): string | null {
  try {
    return localStorage.getItem(GENDER_KEY);
  } catch {
    return null;
  }
}

export function setDemoGender(gender: string | null): void {
  try {
    if (gender) localStorage.setItem(GENDER_KEY, gender);
    else localStorage.removeItem(GENDER_KEY);
  } catch {
    // ignore
  }
}

export function resetDemoGender(): void {
  try {
    localStorage.removeItem(GENDER_KEY);
  } catch {
    // ignore
  }
}

/** Build per-user closet rows from the shared demo wardrobe set. */
function buildClosetRows() {
  const gender = getDemoGender() ?? "female";
  const items = getDemoItemsForGender(gender);
  return items.map((it) => ({
    id: it.id,
    user_id: DEMO_USER_ID,
    title: it.title,
    brand: it.brand ?? "",
    category: it.category,
    color: it.color,
    season: it.season ?? "all",
    tags: it.tags ?? [],
    attributes: it.attributes ?? {},
    source_image_url: it.source_image_url,
    created_at: it.created_at,
  }));
}

/** Seed tables lazily & idempotently the first time they're touched. */
let seeded = false;
function ensureSeed() {
  if (seeded) return;
  seeded = true;
  const gender = getDemoGender() ?? "female";

  seedTableIfEmpty("trendza_closet_items", buildClosetRows());

  seedTableIfEmpty("onboarding_v2", [
    {
      user_id: DEMO_USER_ID,
      step: "consolidated",
      completed: true,
      completed_at: new Date().toISOString(),
      step_data: {
        gender: { gender },
        personalization_completed: { completedAt: new Date().toISOString() },
      },
      current_step: "completed",
      updated_at: new Date().toISOString(),
    },
  ]);

  seedTableIfEmpty("profiles", [
    {
      id: DEMO_USER_ID,
      onboarded: true,
      subscription_tier: "free",
      selected_image: null,
      created_at: new Date().toISOString(),
    },
  ]);

  seedTableIfEmpty("trendza_outfits", []);
  seedTableIfEmpty("planner_outfits", []);
  seedTableIfEmpty("planner_generated_images", []);
}

export function isDemoOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return false;
  }
}

export function setDemoOnboarded(v: boolean): void {
  try {
    if (v) localStorage.setItem(ONBOARDING_KEY, "true");
    else localStorage.removeItem(ONBOARDING_KEY);
  } catch {
    // ignore
  }
}

const DEMO_USER = {
  id: DEMO_USER_ID,
  email: "demo@example.com",
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
};

function demoSession() {
  return {
    access_token: "demo_token",
    refresh_token: "demo_refresh",
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    token_type: "bearer",
    user: DEMO_USER,
  };
}

function authActive(): boolean {
  try {
    return (
      localStorage.getItem(AUTH_KEY) === "true" || isDemoOnboarded()
    );
  } catch {
    return false;
  }
}

type AuthListener = (event: string, session: any) => void;
const listeners: AuthListener[] = [];

const auth = {
  async getSession() {
    if (!authActive()) return { data: { session: null }, error: null };
    return { data: { session: demoSession() }, error: null };
  },

  async getUser() {
    if (!authActive()) return { data: { user: null }, error: null };
    return { data: { user: DEMO_USER }, error: null };
  },

  onAuthStateChange(cb: AuthListener) {
    listeners.push(cb);
    cb("INITIAL_SESSION", authActive() ? demoSession() : null);
    return {
      data: { subscription: { unsubscribe: () => {} } },
      error: null,
    };
  },

  _emit(event: string) {
    const session = authActive() ? demoSession() : null;
    listeners.forEach((l) => l(event, session));
  },

  async signInAnonymously() {
    this._activate();
    return { data: { user: DEMO_USER, session: demoSession() }, error: null };
  },

  async signInWithPassword() {
    this._activate();
    return { data: { user: DEMO_USER, session: demoSession() }, error: null };
  },

  async signUp() {
    this._activate();
    return { data: { user: DEMO_USER, session: demoSession() }, error: null };
  },

  async signInWithIdToken() {
    this._activate();
    return { data: { user: DEMO_USER, session: demoSession() }, error: null };
  },

  async signInWithOAuth() {
    this._activate();
    return { data: { url: "about:blank" }, error: null };
  },

  async setSession() {
    this._activate();
    return { data: { session: demoSession() }, error: null };
  },

  async refreshSession() {
    return this.getSession();
  },

  async signOut() {
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(ONBOARDING_KEY);
    } catch {
      // ignore
    }
    this._emit("SIGNED_OUT");
    return { error: null };
  },

  _activate() {
    try {
      localStorage.setItem(AUTH_KEY, "true");
    } catch {
      // ignore
    }
    this._emit("SIGNED_IN");
  },
};

/** Tap into the demo auth to mark the app signed-in + onboarded. */
export function activateDemoSession(): void {
  auth._activate();
  setDemoOnboarded(true);
}

export function deactivateDemoSession(): void {
  auth.signOut();
}

function from(table: string): DemoQuery {
  ensureSeed();
  return new DemoQuery(table, "select");
}

const storage = {
  from() {
    return {
      upload: async () => {
        return { data: { path: "uploads/demo/image.jpg" }, error: null };
      },
      getPublicUrl: (path: string) => {
        return { data: { publicUrl: demoAssetUrl(path) }, error: null };
      },
      createSignedUrl: (path: string) => {
        return { data: { signedUrl: demoAssetUrl(path) }, error: null };
      },
      createSignedUrls: () => ({ data: null, error: null }),
      remove: async () => ({ data: { path: null }, error: null }),
    };
  },
};

function demoAssetUrl(path: string): string {
  if (/seed-wardrobe\//.test(path)) {
    return "/clothes/" + (path.split("/").pop() ?? "f-top-1.png");
  }
  return "/placeholder.jpg";
}

const functions = {
  invoke: async (fn: string) => {
    // DEMO STUB. Without a real backend these edge functions can't run. Return
    // a clearly-flagged "not configured" error the UI treats as a failure, so
    // the try-on / analyze flow shows a friendly message instead of hanging.
    return {
      data: null,
      error: {
        message: `Demo mode: ${fn} needs a real backend (set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY).`,
        name: "DemoModeError",
      },
    };
  },
};

/** Direct query access (used by the adapter/tests). */
export function demoFrom(table: string): DemoQuery {
  ensureSeed();
  return new DemoQuery(table, "select");
}

export const demoClient = {
  auth: auth as any,
  from,
  storage: storage as any,
  functions: functions as any,
};