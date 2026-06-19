import type { AnyRouter } from "@tanstack/react-router";

const WARM_ROUTES = [
  { to: "/auth/login" as const, search: { redirect: "/dashboard/patient" } },
  { to: "/auth/signup" as const },
  { to: "/about" as const },
  { to: "/report" as const },
];

export function prefetchCommonRoutes(router: AnyRouter) {
  if (typeof window === "undefined") return;

  const run = () => {
    for (const route of WARM_ROUTES) {
      void router.preloadRoute({ to: route.to, search: "search" in route ? route.search : undefined });
    }
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 2500 });
  } else {
    window.setTimeout(run, 600);
  }
}
