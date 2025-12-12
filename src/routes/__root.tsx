// src/routes/__root.tsx
import type { ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Outlet,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import "../index.css";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Asset Manager" },
    ],
  }),
  notFoundComponent: () => <div>Route not found</div>,
  component: RootComponent,
});

function NavigationProgress() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-primary/20">
      <div
        className="h-full w-1/3 bg-primary animate-pulse rounded-r"
        style={{ animation: "loading-progress 1s ease-in-out infinite" }}
      />
    </div>
  );
}

function RootComponent() {
  return (
    <RootDocument>
      <NavigationProgress />
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
