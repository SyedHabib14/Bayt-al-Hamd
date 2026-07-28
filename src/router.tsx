import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Public archive content changes rarely; realtime subscriptions
        // (useRealtimeInvalidate) already invalidate on writes, so a longer
        // client-side stale window avoids redundant refetches on every
        // navigation without ever showing stale-forever data.
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Preload a route's data as soon as the user hovers/focuses its link,
    // not only on click — makes navigation feel instant on desktop.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
    defaultPendingMs: 150,
    defaultPendingMinMs: 200,
  });

  return router;
};
