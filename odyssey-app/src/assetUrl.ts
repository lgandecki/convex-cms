// src/assetUrls.ts

/**
 * Get the Convex site URL from the Convex deployment URL.
 * Converts .cloud to .site for HTTP routes.
 */
function getConvexSiteUrl(): string | undefined {
  const convexUrl =
    // Vite / TanStack / other ESM bundlers
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.VITE_CONVEX_URL) ||
    // Next.js / Node
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_CONVEX_URL) ||
    undefined;

  console.log("[getConvexSiteUrl] convexUrl from env:", convexUrl);

  if (!convexUrl) return undefined;

  // Convert https://foo.convex.cloud to https://foo.convex.site
  const siteUrl = convexUrl.replace(/\.cloud$/, ".site");
  console.log("[getConvexSiteUrl] converted to siteUrl:", siteUrl);
  return siteUrl;
}

/**
 * Build a URL for a specific file version.
 *
 * - In "Vercel+Convex" mode (VITE_ASSET_BASE_PATH="/cdn"), we return `/cdn/:versionId/:filename`
 *   because Vercel rewrites that to Convex and caches it.
 *
 * - In "direct Convex" mode (local dev or no Vercel), we return an absolute URL
 *   to the Convex site: `https://your-deployment.convex.site/am/file/v/:versionId/:filename`
 *
 * You can override the base path via env/config or the basePath option.
 */
export function getVersionUrl(options: {
  versionId: string;
  basename?: string;
  // Optional override if you ever need multiple asset bases
  basePath?: string; // e.g. "/cdn" or "/am/file/v"
}): string {
  const { versionId } = options;
  const basename = options.basename ?? "file";

  // Check if we have a custom asset base path (e.g. "/cdn" for Vercel)
  const envBase =
    // Vite / TanStack / other ESM bundlers
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.VITE_ASSET_BASE_PATH) ||
    // Next.js / Node
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_ASSET_BASE_PATH) ||
    undefined;

  const encodedName = encodeURIComponent(basename);

  console.log("[getVersionUrl] options:", options);
  console.log("[getVersionUrl] envBase:", envBase);
  console.log("[getVersionUrl] import.meta.env:", (import.meta as any).env);

  // If a custom base path is provided (e.g. "/cdn" for Vercel), use relative URL
  if (options.basePath || envBase) {
    const basePath = options.basePath ?? envBase;
    const trimmedBase = basePath.replace(/\/+$/, "");
    const result = `${trimmedBase}/${versionId}/${encodedName}`;
    console.log("[getVersionUrl] using custom basePath, result:", result);
    return result;
  }

  // Otherwise, use absolute URL to Convex site (works in local dev)
  const siteUrl = getConvexSiteUrl();
  console.log("[getVersionUrl] siteUrl:", siteUrl);

  if (siteUrl) {
    const result = `${siteUrl}/am/file/v/${versionId}/${encodedName}`;
    console.log("[getVersionUrl] using siteUrl, result:", result);
    return result;
  }

  // Fallback to relative path (won't work in local dev without proxy)
  const fallback = `/am/file/v/${versionId}/${encodedName}`;
  console.log("[getVersionUrl] fallback (no siteUrl), result:", fallback);
  return fallback;
}
