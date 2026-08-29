// This file is the app's single integration point with its backend.
//
// It dispatches between two implementations depending on whether real backend
// keys are configured:
//
//   • IS_DEMO_MODE  — no VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY set.
//                     `supabase` is the localStorage-backed demo client, so the
//                     app runs fully offline with zero setup. Pick a gender on
//                     the entry gate and every existing component works
//                     unchanged against a local store.
//
//   • real mode     — keys set. `supabase` is the genuine @supabase/supabase-js
//                     client and the AI edge functions (try-on, style analysis)
//                     are live.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  IS_DEMO_MODE,
} from '@/lib/supabase-config';
import { demoClient } from '@/lib/demo/demoClient';

export const IS_DEMO = IS_DEMO_MODE;

// In demo mode the client is a lightweight stand-in that matches the query
// surface — cast through `unknown` to the same typed SupabaseClient so the 40+
// components that `import { supabase } from "@/integrations/supabase/client"`
// compile unchanged.
export const supabase = (IS_DEMO_MODE
  ? (demoClient as unknown as SupabaseClient<Database>)
  : createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY));