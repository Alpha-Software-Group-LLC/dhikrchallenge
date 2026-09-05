import { lazy, Suspense, useEffect } from "react";
import { StoreProvider, useStore } from "@/data/store";
import { RouterProvider, useRouter } from "@/components/router";
import { AppShell, Toasts } from "@/components/shell";
import { matchRoute } from "@/lib/router";
import { Arabic, Button, ErrorState, Skeleton } from "@/components/ui";
import { TodayPage } from "@/pages/Today";
import { LandingPage } from "@/pages/Landing";
import { OnboardingPage } from "@/pages/Onboarding";
import { AuthPage } from "@/pages/Auth";
import { STRONGER_HEART } from "@/content";

const JourneyPage = lazy(() => import("@/pages/Journey").then((m) => ({ default: m.JourneyPage })));
const LibraryPage = lazy(() => import("@/pages/Library").then((m) => ({ default: m.LibraryPage })));
const TasbihPage = lazy(() => import("@/pages/Tasbih").then((m) => ({ default: m.TasbihPage })));
const CirclesPage = lazy(() => import("@/pages/Circles").then((m) => ({ default: m.CirclesPage })));
const CircleNewPage = lazy(() => import("@/pages/CircleNew").then((m) => ({ default: m.CircleNewPage })));
const CircleHomePage = lazy(() => import("@/pages/CircleHome").then((m) => ({ default: m.CircleHomePage })));
const JoinPage = lazy(() => import("@/pages/Join").then((m) => ({ default: m.JoinPage })));
const YouPage = lazy(() => import("@/pages/You").then((m) => ({ default: m.YouPage })));
const InstallPage = lazy(() => import("@/pages/Install").then((m) => ({ default: m.InstallPage })));

function Splash() {
  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ textAlign: "center" }} className="anim-in">
        <Arabic text="بِسْمِ ٱللَّهِ" size={30} color="var(--gold)" />
        <div className="small muted" style={{ marginTop: 10 }}>
          Preparing your journey…
        </div>
      </div>
    </div>
  );
}

function PageFallback() {
  return (
    <div className="page">
      <Skeleton lines={6} height={30} />
    </div>
  );
}

function Routes() {
  const { mode, home, error, reload, startJourney, notify } = useStore();
  const { path, navigate } = useRouter();

  const join = matchRoute("/join/:code", path);
  const authSignIn = path === "/signin";
  const authSignUp = path === "/signup";
  const install = path === "/platforms" || path === "/install";

  // Redirect signed-in users away from public-only pages.
  useEffect(() => {
    if (mode === "account" && (authSignIn || authSignUp)) navigate("/", { replace: true });
  }, [mode, authSignIn, authSignUp, navigate]);

  if (mode === "booting") return <Splash />;

  if (mode === "error") {
    return (
      <div className="page page-public">
        <ErrorState title="Dhikr Challenge couldn't start" message={error ?? "Please refresh and try again."} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (join) {
    return (
      <AppShell nav={mode !== "signed-out"}>
        <Suspense fallback={<PageFallback />}>
          <JoinPage code={join.params.code ?? ""} />
        </Suspense>
      </AppShell>
    );
  }
  if (install) {
    return (
      <AppShell nav={mode !== "signed-out"}>
        <Suspense fallback={<PageFallback />}>
          <InstallPage />
        </Suspense>
      </AppShell>
    );
  }
  if (authSignIn || authSignUp) {
    return (
      <AppShell nav={false}>
        <AuthPage mode={authSignUp ? "signup" : "signin"} />
      </AppShell>
    );
  }

  if (mode === "signed-out") {
    return (
      <>
        <LandingPage />
        <Toasts />
      </>
    );
  }

  // Guest or account.
  const needsOnboarding = !home.onboardingCompleted && !home.journey;
  if (needsOnboarding && (path === "/" || path === "/onboarding")) {
    return (
      <>
        <OnboardingPage />
        <Toasts />
      </>
    );
  }

  const circle = matchRoute("/circles/:id", path);
  const dhikr = matchRoute("/dhikr/:id", path);
  const you = matchRoute("/you/:section", path);

  let page: React.ReactNode;
  if (path === "/") page = <TodayPage />;
  else if (path === "/journey") page = <JourneyPage />;
  else if (path === "/dhikr") page = <LibraryPage />;
  else if (dhikr) page = <LibraryPage initialId={dhikr.params.id} />;
  else if (path === "/tasbih") page = <TasbihPage />;
  else if (path === "/circles") page = <CirclesPage />;
  else if (path === "/circles/new") page = <CircleNewPage />;
  else if (circle) page = <CircleHomePage id={circle.params.id ?? ""} />;
  else if (path === "/you") page = <YouPage />;
  else if (you) page = <YouPage section={you.params.section} />;
  else if (path === "/onboarding") page = <TodayPage />;
  else
    page = (
      <div className="page">
        <div className="card quiet" style={{ textAlign: "center", padding: 30 }}>
          <div className="card-title">That page isn't here.</div>
          <div className="card-note">Return to today's remembrance.</div>
          <div style={{ marginTop: 14 }}>
            <Button onClick={() => navigate("/")}>Today</Button>
            {!home.journey && (
              <Button variant="quiet" style={{ marginLeft: 8 }} onClick={() => startJourney(STRONGER_HEART.id).catch((e) => notify(e.message, "error"))}>
                Start Day 1
              </Button>
            )}
          </div>
        </div>
      </div>
    );

  return (
    <AppShell>
      {error && path !== "/" && (
        <div className="page" style={{ paddingBottom: 0 }}>
          <ErrorState message={error} onRetry={() => void reload()} />
        </div>
      )}
      <Suspense fallback={<PageFallback />}>{page}</Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <StoreProvider>
        <Routes />
      </StoreProvider>
    </RouterProvider>
  );
}
