// src/routes/admin.tsx
import { useEffect, useRef } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../convex/_generated/api";
import { AdminPanel } from "../admin/AdminPanel";

type SearchParams = {
  folder?: string;
  asset?: string;
  version?: string;
};

// Reusable query options - used in both loader and components
export const queries = {
  folders: (parentPath?: string) => convexQuery(api.cli.listFolders, { parentPath }),
  assets: (folderPath: string) => convexQuery(api.cli.listAssets, { folderPath }),
  publishedFilesInFolder: (folderPath: string) =>
    convexQuery(api.cli.listPublishedFilesInFolder, { folderPath }),
  asset: (folderPath: string, basename: string) =>
    convexQuery(api.cli.getAsset, { folderPath, basename }),
  assetVersions: (folderPath: string, basename: string) =>
    convexQuery(api.cli.getAssetVersions, { folderPath, basename }),
  publishedFile: (folderPath: string, basename: string) =>
    convexQuery(api.cli.getPublishedFile, { folderPath, basename }),
};

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    folder: typeof search.folder === "string" ? search.folder : undefined,
    asset: typeof search.asset === "string" ? search.asset : undefined,
    version: typeof search.version === "string" ? search.version : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps: { folder, asset } }) => {
    // Skip during SSR - Convex WebSocket not available, let Suspense show skeletons
    if (typeof window === "undefined") {
      return;
    }

    const { queryClient } = context;
    const folderPath = folder ?? "";

    // Load data for the CURRENT view (this we wait for)
    const folderDataPromises = [
      queryClient.ensureQueryData(queries.folders("")),
      queryClient.ensureQueryData(queries.folders(folderPath)),
      queryClient.ensureQueryData(queries.assets(folderPath)),
      queryClient.ensureQueryData(queries.publishedFilesInFolder(folderPath)),
    ];

    // Wait for folder data first
    const [rootFolders, currentSubfolders] = await Promise.all(folderDataPromises);

    // If asset is selected, wait for its details too (separate to avoid type mixing)
    if (asset) {
      await Promise.all([
        queryClient.ensureQueryData(queries.asset(folderPath, asset)),
        queryClient.ensureQueryData(queries.assetVersions(folderPath, asset)),
        queryClient.ensureQueryData(queries.publishedFile(folderPath, asset)),
      ]);
    }

    // Background prefetch: root folders + subfolders of current folder (fire and forget)
    const rootPaths = (rootFolders as { path: string }[])
      .map((f) => f.path)
      .filter((path) => path !== folderPath);

    const subfolderPaths = (currentSubfolders as { path: string }[])
      .map((f) => f.path);

    const allPathsToPrefetch = [...new Set([...rootPaths, ...subfolderPaths])];

    // Don't await - let these run in background
    for (const path of allPathsToPrefetch) {
      queryClient.prefetchQuery(queries.folders(path));
      queryClient.prefetchQuery(queries.assets(path));
      queryClient.prefetchQuery(queries.publishedFilesInFolder(path));
    }
  },
  component: Admin,
});

function Admin() {
  const { folder, asset, version } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const hasPrefetched = useRef(false);

  // Get root folders for prefetching
  const { data: rootFolders } = useQuery(queries.folders(""));

  // "Simulate hover" - preload all folder routes after initial load
  useEffect(() => {
    if (!rootFolders || hasPrefetched.current) return;
    hasPrefetched.current = true;

    const currentFolder = folder ?? "";
    const otherPaths = rootFolders
      .map((f: { path: string }) => f.path)
      .filter((path: string) => path !== currentFolder);

    // Preload routes for all other folders (triggers loader for each)
    for (const path of otherPaths) {
      router.preloadRoute({ to: "/admin", search: { folder: path || undefined } });
    }
  }, [rootFolders, folder, router]);

  const handleFolderSelect = (folderPath: string) => {
    void navigate({
      to: "/admin",
      search: { folder: folderPath || undefined },
    });
  };

  const handleAssetSelect = (assetInfo: { folderPath: string; basename: string } | null) => {
    if (assetInfo) {
      void navigate({
        to: "/admin",
        search: { folder: assetInfo.folderPath || undefined, asset: assetInfo.basename },
      });
    } else {
      void navigate({
        to: "/admin",
        search: { folder: folder || undefined },
      });
    }
  };

  const handleVersionSelect = (versionId: string | null) => {
    void navigate({
      to: "/admin",
      search: {
        folder: folder || undefined,
        asset: asset,
        version: versionId || undefined,
      },
    });
  };

  return (
    <AdminPanel
      folderPath={folder ?? ""}
      selectedAsset={asset ? { folderPath: folder ?? "", basename: asset } : null}
      selectedVersionId={version ?? null}
      onFolderSelect={handleFolderSelect}
      onAssetSelect={handleAssetSelect}
      onVersionSelect={handleVersionSelect}
    />
  );
}
