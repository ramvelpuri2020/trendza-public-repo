/**
 * haptics — the "feel" layer.
 *
 * Same `haptic()` API across web + native so the Whering-style components
 * never need to know what platform they run on.
 *
 * Behaviour:
 * - iOS / Android (Capacitor): Container → `Haptics.impact` / `selectionChanged`.
 *   iOS WebView is the only place the Capacitor plugin runs reliably —
 *   Capacitor.isNativePlatform() gates the native call.
 * - Web fallback: `navigator.vibrate` with a short/medium pattern per
 *   impact style. Browsers that ignore `vibrate` (Safari desktop, Firefox)
 *   silently no-op — same promise shape as the native path.
 * - SSR safety: every access to `navigator` is feature-detected, so the
 *   module evaluates cleanly in any environment.
 *
 * Impact cadence used by callers:
 *   - "light"      — every carousel snap-tick (the "tactile dial" feel)
 *   - "selection"  — grabbing / lifting a canvas item
 *   - "medium"     — shuffle / save / add / delete (a single thump)
 *   - "success"    — fit saved, upload completed
 *   - "warning"    — destructive confirm
 */

export type Impact = "light" | "medium" | "selection" | "success" | "warning";

const FIRE_AND_FORGET = true;

let nativeModulePromise: Promise<{
  impact: (style: "LIGHT" | "MEDIUM" | "HEAVY") => Promise<void>;
  impactMedium: () => Promise<void>;
  selectionChanged: () => Promise<void>;
  notification: (type: "SUCCESS" | "WARNING" | "ERROR") => Promise<void>;
}> | null = null;

/**
 * `isNativePlatform` is resolved lazily exactly once and cached. The
 * web path never touches the import, and the native path resolves
 * `Capacitor` once at first call instead of re-importing per invocation.
 */
let isNativePlatformCache: boolean | null = null;
async function detectNativePlatform(): Promise<boolean> {
  if (isNativePlatformCache !== null) return isNativePlatformCache;
  try {
    const { Capacitor } = await import("@capacitor/core");
    isNativePlatformCache = Capacitor.isNativePlatform();
  } catch {
    isNativePlatformCache = false;
  }
  return isNativePlatformCache;
}

/**
 * Lazy-load Capacitor Haptics only when called on a native platform so
 * browser bundles never pay the import cost. The promise is cached so
 * re-entrant calls share one import; on rejection the cache is reset so
 * a later call can retry rather than staying broken forever.
 */
async function getNative() {
  if (nativeModulePromise) return nativeModulePromise;
  nativeModulePromise = (async () => {
    // Capacitor.Plugins is a runtime-resolved map; the Haptics plugin
    // only itself exposes haptic primitives, not a "selection" class.
    // `selectionChanged` is the closest analogue.
    const capMod = await import("@capacitor/haptics");
    return {
      impact: (style: "LIGHT" | "MEDIUM" | "HEAVY") =>
        capMod.Haptics.impact({ style: capMod.ImpactStyle[style] }),
      impactMedium: () =>
        capMod.Haptics.impact({ style: capMod.ImpactStyle.Medium }),
      selectionChanged: () => capMod.Haptics.selectionChanged(),
      notification: (type: "SUCCESS" | "WARNING" | "ERROR") =>
        capMod.Haptics.notification({ type: capMod.NotificationType[type] }),
    };
  })();
  try {
    return await nativeModulePromise;
  } catch (err) {
    // Reset so a later call retries the dynamic import. Common cause:
    // Capacitor sync not run on a fresh clone — the user re-installs
    // and the plugin becomes available again.
    nativeModulePromise = null;
    throw err;
  }
}

/**
 * Web Vibration patterns per impact style. The numbers are milliseconds
 * (vibrate: ms, pause: ms, vibrate: ms, …). Short pulses read as ticks;
 * the medium pattern is a single thump.
 */
const WEB_PATTERNS: Record<Impact, number | number[]> = {
  light: 8,
  selection: 12,
  medium: 22,
  success: [10, 30, 18],
  warning: [18, 20, 18],
};

function vibrateWeb(pattern: number | number[]) {
  if (typeof navigator === "undefined") return;
  const v = navigator.vibrate?.bind(navigator);
  if (!v) return;
  try {
    v(pattern);
  } catch {
    /* vibrate() throws on iOS Safari desktop pre-13; ignore */
  }
}

/**
 * Public entry-point. Always returns a resolved promise so callers can
 * `void haptic(...)` without awaiting. Native path is gated by
 * `Capacitor.isNativePlatform()` (cached after first call) so the web
 * path stays zero-cost and the native path doesn't re-import every tick.
 */
export async function haptic(style: Impact = "light"): Promise<void> {
  try {
    if (await detectNativePlatform()) {
      const native = await getNative();
      switch (style) {
        case "light":
          await native.impact("LIGHT");
          break;
        case "medium":
        case "selection":
          await native.impact("MEDIUM");
          break;
        case "success":
          await native.notification("SUCCESS");
          break;
        case "warning":
          await native.notification("WARNING");
          break;
      }
      return;
    }
  } catch {
    /* Native module unavailable (web or stripped platform) — fall through */
  }
  vibrateWeb(WEB_PATTERNS[style]);
}

/**
 * Synchronous-feeling fire-and-forget for event handlers that don't want
 * to `await` (e.g. onTap, onPointerDown). The unhandled-promise risk is
 * nil — `haptic()` always resolves or swallows its own errors.
 */
export function tap(style: Impact = "light"): void {
  void haptic(style);
}

// ─────────────────────────────────────────────────────────────────────────
// Higher-level helpers — capture the impact cadence the Whering docs call
// out so callers stop reinventing it. These are pure sugar over `tap()`.
// ─────────────────────────────────────────────────────────────────────────

/** Tick on every snap (carousel). */
export const snapTick = () => tap("light");

/** Lift a canvas item. */
export const selectTick = () => tap("selection");

/** Save / shuffle / add / delete. */
export const thrust = () => tap("medium");

/** Fit saved / upload completed. */
export const successTick = () => tap("success");

/** Destructive confirm. */
export const warningTick = () => tap("warning");

// FIRE_AND_FORGET is exported only so eslint doesn't strip the import;
// the symbol documents the call-site convention.
export const __ = FIRE_AND_FORGET;
