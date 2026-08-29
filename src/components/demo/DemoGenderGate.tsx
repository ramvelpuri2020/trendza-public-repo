/**
 * DemoGenderGate — the entry screen for demo mode.
 *
 * When the app runs without a real backend (demo mode) and no gender has been
 * chosen yet, we show this gate instead of the auth onboarding. Picking a
 * gender seeds the matching demo wardrobe, activates a fake local session
 * (so `useAuth` reports signed-in), marks onboarding complete, and hands the
 * visitor straight into the real dashboard — reviewed with clothes that fit
 * them.
 *
 * It intentionally reuses the app's existing design language (monochrome
 * cards, the `option-card` styles from index.css).
 */
import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  setDemoGender,
  activateDemoSession,
  setDemoOnboarded,
} from "@/lib/demo/demoClient";

const GENDERS = [
  {
    value: "Female",
    label: "Female",
    emoji: "xf7f0",
    blurb: "Explore the women's wardrobe",
  },
  {
    value: "Male",
    label: "Male",
    emoji: "xf7f2",
    blurb: "Explore the men's wardrobe",
  },
] as const;

const EMB: Record<string, string> = {
  Female: "👩",
  Male: "👨",
};

export function DemoGenderGate({ onDone }: { onDone: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const finish = () => {
    setBusy(true);
    // Seed + activate the local session, then let the router re-evaluate.
    setDemoGender(selected);
    setDemoOnboarded(true);
    activateDemoSession();
    try {
      localStorage.setItem("onboarding_completed", "true");
      localStorage.setItem("subscription_active", "true");
      localStorage.setItem("subscription_tier", "free");
    } catch {
      // ignore
    }
    // Small pause so the press feedback lands before the screen swaps.
    setTimeout(onDone, 350);
  };

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-6"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome to trendza
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            This is a live demo of the full app. Pick a wardrobe to start —
            everything is pre-loaded so you can jump straight in.
          </p>
        </div>

        <div className="space-y-3">
          {GENDERS.map((g) => {
            const active = selected === g.value;
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => setSelected(g.value)}
                className={`option-card w-full ${
                  active ? "selected" : ""
                }`}
                style={{ borderRadius: 16 }}
              >
                <span className="emoji" style={{ fontSize: 28 }}>
                  {EMB[g.value] ?? "🧑"}
                </span>
                <span className="flex-1">
                  <span className="block text-[17px] font-semibold text-gray-900">
                    {g.label}
                  </span>
                  <span className="block text-sm text-gray-500">
                    {g.blurb}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!selected || busy}
          onClick={finish}
          className="btn-primary mt-8 w-full"
          style={{
            borderRadius: 16,
            opacity: !selected ? 0.4 : 1,
          }}
        >
          {busy ? (
            <span className="loading-spinner" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
          ) : (
            <>
              Enter the demo <ArrowRight className="ml-1 h-4 w-4" />
            </>
          )}
        </button>
        <p className="mt-4 text-center text-xs text-gray-400">
          Demo mode — no account, no setup, nothing leaves your browser.
        </p>
      </div>
    </div>
  );
}