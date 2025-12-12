// src/routes/index.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
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

export const Route = createFileRoute("/")({
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
    const [rootFolders] = await Promise.all(folderDataPromises);

    // If asset is selected, wait for its details too (separate to avoid type mixing)
    if (asset) {
      await Promise.all([
        queryClient.ensureQueryData(queries.asset(folderPath, asset)),
        queryClient.ensureQueryData(queries.assetVersions(folderPath, asset)),
        queryClient.ensureQueryData(queries.publishedFile(folderPath, asset)),
      ]);
    }

    // Background prefetch: all other folders' data (fire and forget)
    const otherPaths = (rootFolders as { path: string }[])
      .map((f) => f.path)
      .filter((path) => path !== folderPath);

    // Don't await - let these run in background
    for (const path of otherPaths) {
      queryClient.prefetchQuery(queries.folders(path));
      queryClient.prefetchQuery(queries.assets(path));
      queryClient.prefetchQuery(queries.publishedFilesInFolder(path));
    }
  },
  component: Home,
});

function Home() {
  const { folder, asset, version } = Route.useSearch();
  const navigate = useNavigate();

  const handleFolderSelect = (folderPath: string) => {
    void navigate({
      to: "/",
      search: { folder: folderPath || undefined },
    });
  };

  const handleAssetSelect = (assetInfo: { folderPath: string; basename: string } | null) => {
    if (assetInfo) {
      void navigate({
        to: "/",
        search: { folder: assetInfo.folderPath || undefined, asset: assetInfo.basename },
      });
    } else {
      void navigate({
        to: "/",
        search: { folder: folder || undefined },
      });
    }
  };

  const handleVersionSelect = (versionId: string | null) => {
    void navigate({
      to: "/",
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
