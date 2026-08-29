import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense, lazy, useState } from "react";
import Auth from "./pages/Auth";
import { SubscriptionProvider } from "./components/subscription/SubscriptionProvider";
import { AuthErrorBoundary } from "./components/auth/AuthErrorBoundary";
import { useAuth } from "./hooks/useAuth";
import { IS_DEMO } from "./integrations/supabase/client";
import { DemoGenderGate } from "./components/demo/DemoGenderGate";
import {
  getDemoGender,
  setDemoOnboarded,
  isDemoOnboarded,
} from "./lib/demo/demoClient";

// Lazy load non-critical components
const Index = lazy(() => import("./pages/Index"));
const Profile = lazy(() => import("./pages/Profile"));
const UpgradePage = lazy(() => import("./pages/UpgradePage"));
const WheringPage = lazy(() => import("./components/whering/WheringPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AppRoutes = () => {
  // Route gating model — free-tier friendly.
  //
  // We now allow the dashboard to render for any user that has:
  //   1. Completed authentication (live `useAuth`), AND
  //   2. Completed onboarding (the localStorage flag the paywall
  //      completion path sets — `AuthOnboardingWizard.handlePaywallComplete`
  //      writes `onboarding_completed=true` for both paid and free tiers).
  //
  // We deliberately do NOT gate on `isPro` here anymore. The previous
  // `isAuthenticated && isPro` rule meant free-tier users could never
  // reach `/scan` even after the paywall flow completed, which forced
  // `Auth.tsx` to fall back to a full-document `window.location.href`
  // reload that wiped React state and re-rendered the paywall on
  // remount — the "second paywall's X button bounces back to first
  // paywall" loop bug.
  //
  // The premium feature gating still happens inside pages
  // (ScanView/ClosetView/Profile read `useSubscription().isPro`), so
  // free-tier users land in the dashboard with premium features
  // disabled, which is the standard freemium model.
  //
  // The localStorage read is scoped to ONBOARDING COMPLETION, not
  // subscription status, so a momentarily-cleared cache key cannot
  // bounce a paid user.
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const onboardingCompletedFromCache =
    typeof window !== 'undefined'
      ? localStorage.getItem('onboarding_completed') === 'true'
      : false;

  // IMPORTANT: both branches must consult the cached
  // `onboarding_completed` flag. If we only consult it during
  // `authLoading`, then the moment auth resolves (`isAuthenticated`
  // flips true for any logged-in user), the gate degenerates to a
  // pure auth check — which would let a brand-new user mid-onboarding
  // through to /scan before the wizard has run. The paywall flow writes
  // `onboarding_completed=true` only via
  // `AuthOnboardingWizard.handlePaywallComplete`, so reading the flag
  // on both sides of the loading boundary is the single source of truth.
  const hasCompletedOnboarding = authLoading
    ? onboardingCompletedFromCache
    : isAuthenticated && onboardingCompletedFromCache;

  const shouldShowDashboard = hasCompletedOnboarding;

  console.log('🔍 [AppRoutes]', {
    isAuthenticated,
    authLoading,
    onboardingCompletedFromCache,
    shouldShowDashboard: hasCompletedOnboarding,
  });

  return (
    <Routes>
      {/* Onboarding route - always accessible */}
      <Route
        path="/auth"
        element={
          shouldShowDashboard ?
            <Navigate to="/dress-me" replace /> :
            <Auth />
        }
      />

      {/* App routes - only if completed onboarding (free or paid) */}
      {shouldShowDashboard ? (
        <>
          {/* `/scan` is the home + dashboard (ScanView owns recent scans,
              calendar week, stats). `/scan/*` covers any future subroutes. */}
          <Route
            path="/scan"
            element={
              <Suspense fallback={null}>
                <Index />
              </Suspense>
            }
          />
          <Route
            path="/scan/:rest/*"
            element={
              <Suspense fallback={null}>
                <Index />
              </Suspense>
            }
          />

          {/* `/fits` covers the new top-level Fits tab + its subroutes
              (`/fits/builder`, `/fits/:id`). The view handles subroutes
              internally via pathname parse. */}
          <Route
            path="/fits"
            element={
              <Suspense fallback={null}>
                <Index />
              </Suspense>
            }
          />
          <Route
            path="/fits/:rest/*"
            element={
              <Suspense fallback={null}>
                <Index />
              </Suspense>
            }
          />

          {/* Closet tab + any future subroutes (e.g. `/closet/collections`). */}
          <Route
            path="/closet"
            element={
              <Suspense fallback={null}>
                <Index />
              </Suspense>
            }
          />
          <Route
            path="/closet/:rest/*"
            element={
              <Suspense fallback={null}>
                <Index />
              </Suspense>
            }
          />

          {/* Whering tabs integrated into the dashboard:
              Dress Me / Wardrobe / Canvas / Clip */}
          <Route
            path="/dress-me"
            element={
              <Suspense fallback={null}>
                <Index />
              </Suspense>
            }
          />
          <Route
            path="/dress-me/:rest/*"
            element={
              <Suspense fallback={null}>
                <Index />
              </Suspense>
            }
          />
          <Route
            path="/wardrobe"
            element={
              <Suspense fallback={null}>
                <Index />
              </Suspense>
            }
          />
          <Route
            path="/wardrobe/:rest/*"
            element={
              <Suspense fallback={null}>
                <Index />
              </Suspense>
            }
          />
          <Route
            path="/canvas"
            element={
              <Suspense fallback={null}>
                <Index />
              </Suspense>
            }
          />
          <Route
            path="/canvas/:rest/*"
            element={
              <Suspense fallback={null}>
                <Index />
              </Suspense>
            }
          />
          <Route
            path="/clip"
            element={
              <Suspense fallback={null}>
                <Index />
              </Suspense>
            }
          />
          <Route
            path="/clip/:rest/*"
            element={
              <Suspense fallback={null}>
                <Index />
              </Suspense>
            }
          />

          {/* Planner tab — outfit calendar with AI try-on photos */}
          <Route
            path="/planner"
            element={
              <Suspense fallback={null}>
                <Index />
              </Suspense>
            }
          />
          <Route
            path="/planner/:rest/*"
            element={
              <Suspense fallback={null}>
                <Index />
              </Suspense>
            }
          />

          <Route
            path="/profile"
            element={
              <Suspense fallback={null}>
                <Profile />
              </Suspense>
            }
          />
          <Route
            path="/upgrade"
            element={
              <Suspense fallback={null}>
                <UpgradePage />
              </Suspense>
            }
          />
          {/* Whering-style phone shell — exposes the four views
              (Dress Me / Wardrobe / Canvas / Clipper) plus the FAB +
              bottom-sheet, faithfully ported from
              https://github.com/ramvelpuri2020/capacitor-app-optimization. */}
          <Route
            path="/whering"
            element={
              <Suspense fallback={null}>
                <WheringPage />
              </Suspense>
            }
          />
          <Route path="/whering/:rest/*" element={<Navigate to="/whering" replace />} />
          <Route path="/" element={<Navigate to="/dress-me" replace />} />
          <Route path="*" element={<Navigate to="/dress-me" replace />} />
        </>
      ) : (
        // Not authenticated or onboarding not yet completed.
        // Free-tier and paid users who finished onboarding fall into the
        // dashboard branch above; this is strictly the "haven't onboarded
        // yet" -> kick them back to /auth path.
        <Route path="*" element={<Navigate to="/auth" replace />} />
      )}
    </Routes>
  );
};

/**
 * Demo gate holder — only active in demo mode (no backend keys).
 *
 * Before the visitor has picked a gender, show the DemoGenderGate. Once they
 * pick one it seeds the matching wardrobe, activates a local session, and
 * marks onboarding complete; the normal `AppRoutes` re-evaluates against the
 * live `useAuth` + `onboarding_completed` checks and drops them into the real
 * dashboard.
 */

const MaybeDemoGate = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);

  if (!IS_DEMO) return <>{children}</>;

  const onboarded = isDemoOnboarded();
  const hasGender = !!getDemoGender();

  if (onboarded && hasGender) return <>{children}</>;

  // If a gender somehow exists but onboarding wasn't flagged, treat it as
  // complete rather than stalls the visitor. Otherwise show the gate.
  const showGate = !onboarded;
  return showGate ? (
    <DemoGenderGate onDone={() => {
      setReady(true);
      setDemoOnboarded(true);
    }} />
  ) : (
    <>{children}</>
  );
};

const App = () => {
  // 🔥 Background removal model now PRE-LOADS when user is logged in!
  // This makes first upload INSTANT instead of 40 seconds

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthErrorBoundary>
          <SubscriptionProvider>
            <MaybeDemoGate>
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true
                }}
              >
                <AppRoutes />
              </BrowserRouter>
            </MaybeDemoGate>
          </SubscriptionProvider>
        </AuthErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;