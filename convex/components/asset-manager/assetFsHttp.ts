// convex/assetFsHttp.ts
import {
  action,
  internalAction,
  internalQuery,
  query,
  QueryCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";

/**
 * Get the R2 public URL from storage config.
 * Requires r2PublicUrl to be configured (no fallback to signed URLs).
 */
async function getR2PublicUrl(ctx: QueryCtx, r2Key: string): Promise<string | null> {
  const config = await ctx.db
    .query("storageConfig")
    .withIndex("by_singleton", (q) => q.eq("singleton", "storageConfig"))
    .first();

  if (!config?.r2PublicUrl) {
    console.error("R2 public URL not configured. Call configureStorageBackend with r2PublicUrl.");
    return null;
  }

  const baseUrl = config.r2PublicUrl.replace(/\/+$/, "");
  return `${baseUrl}/${r2Key}`;
}

/**
 * Internal action that fetches a blob from component storage.
 * This is needed because HTTP actions in the main app cannot access
 * component storage directly - they can only access main app storage.
 * By using an action inside the component, we can access component storage
 * and return the blob data to the HTTP action.
 */
export const getBlobForServing = action({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.union(v.null(), v.bytes()),
  handler: async (ctx, { storageId }): Promise<ArrayBuffer | null> => {
    const blob = await ctx.storage.get(storageId);
    if (!blob) return null;
    return await blob.arrayBuffer();
  },
});

const SMALL_FILE_LIMIT = 20 * 1024 * 1024; // 20MB

/**
 * Get a direct storage URL for any version (regardless of state).
 * This is for admin preview only - it doesn't enforce published-only access.
 * Returns the storage URL which can be used to preview draft/archived versions.
 */
export const getVersionPreviewUrl = query({
  args: {
    versionId: v.id("assetVersions"),
  },
  returns: v.union(
    v.null(),
    v.object({
      url: v.string(),
      contentType: v.optional(v.string()),
      size: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, { versionId }) => {
    const version = await ctx.db.get(versionId);
    if (!version) return null;

    // Need either storageId (Convex) or r2Key (R2)
    if (!version.storageId && !version.r2Key) return null;

    let url: string | null = null;
    if (version.r2Key) {
      url = await getR2PublicUrl(ctx, version.r2Key);
    } else if (version.storageId) {
      url = await ctx.storage.getUrl(version.storageId);
    }
    if (!url) return null;

    return {
      url,
      contentType: version.contentType,
      size: version.size,
    };
  },
});

/**
 * Get version data for HTTP serving.
 *
 * Serves ANY version that has storage, regardless of state (draft/published/archived).
 * Version IDs are opaque UUIDs - knowing an ID is sufficient authorization.
 * The "published" concept is about which version is "current" at a path, not access control.
 *
 * Caching strategy:
 * - Convex storage, small files (≤20MB): Served as blobs with immutable caching (1 year)
 * - Convex storage, large files (>20MB): Served via redirect to storage URL with short caching (60s)
 * - R2 storage: Redirect to public URL with immutable caching (Cloudflare CDN handles caching)
 */
export const getVersionForServing = query({
  args: {
    versionId: v.id("assetVersions"),
  },
  returns: v.union(
    v.null(),
    v.object({
      kind: v.literal("blob"),
      storageId: v.id("_storage"),
      contentType: v.optional(v.string()),
      cacheControl: v.optional(v.string()),
    }),
    v.object({
      kind: v.literal("redirect"),
      location: v.string(),
      cacheControl: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, { versionId }) => {
    const version = await ctx.db.get(versionId);
    if (!version) return null;

    // Need either storageId (Convex) or r2Key (R2)
    if (!version.storageId && !version.r2Key) return null;

    const size = version.size ?? 0;
    const mime = version.contentType ?? "application/octet-stream";

    // R2 storage: redirect to public URL (Cloudflare CDN handles caching)
    if (version.r2Key) {
      const url = await getR2PublicUrl(ctx, version.r2Key);
      if (!url) return null;

      return {
        kind: "redirect" as const,
        location: url,
        // R2 public URLs are stable, Cloudflare CDN caches at edge
        cacheControl: "public, max-age=31536000, immutable",
      };
    }

    // Convex storage
    const isSmall = size > 0 && size <= SMALL_FILE_LIMIT;

    if (isSmall && version.storageId) {
      return {
        kind: "blob" as const,
        storageId: version.storageId,
        contentType: mime,
        cacheControl: "public, max-age=31536000, immutable",
      };
    }

    const url = await ctx.storage.getUrl(version.storageId!);
    if (!url) return null;

    return {
      kind: "redirect" as const,
      location: url,
      cacheControl: "public, max-age=60",
    };
  },
});

type ServeVersionResult =
  | null
  | {
      kind: "blob";
      storageId: Id<"_storage">;
      contentType?: string;
      cacheControl?: string;
    }
  | {
      kind: "redirect";
      location: string;
      cacheControl?: string;
    };

/**
 * Get the published version of an asset by path, ready for HTTP serving.
 * This is the "one request" pattern - look up by path and get serving info in one call.
 *
 * Returns redirect info (to R2 CDN or Convex storage URL) or blob serving info.
 * Returns null if no published version exists at the path.
 *
 * Usage in app's http.ts:
 * ```typescript
 * http.route({
 *   path: "/file/*",
 *   method: "GET",
 *   handler: httpAction(async (ctx, request) => {
 *     const pathParts = new URL(request.url).pathname.replace(/^\/file\//, '').split('/');
 *     const basename = pathParts.pop()!;
 *     const folderPath = pathParts.join('/');
 *
 *     const result = await ctx.runQuery(
 *       components.assetManager.assetFsHttp.getPublishedFileForServing,
 *       { folderPath, basename }
 *     );
 *     if (!result) return new Response("Not found", { status: 404 });
 *
 *     if (result.kind === "redirect") {
 *       return new Response(null, {
 *         status: 302,
 *         headers: {
 *           Location: result.location,
 *           "Cache-Control": result.cacheControl ?? "public, max-age=60",
 *         },
 *       });
 *     }
 *
 *     // For blob serving, call the action to get the blob
 *     const blob = await ctx.runAction(
 *       components.assetManager.assetFsHttp.getBlobForServing,
 *       { storageId: result.storageId }
 *     );
 *     if (!blob) return new Response("Not found", { status: 404 });
 *
 *     return new Response(blob, {
 *       headers: {
 *         "Content-Type": result.contentType ?? "application/octet-stream",
 *         "Cache-Control": result.cacheControl ?? "public, max-age=31536000, immutable",
 *       },
 *     });
 *   }),
 * });
 * ```
 */
export const getPublishedFileForServing = query({
  args: {
    folderPath: v.string(),
    basename: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      kind: v.literal("blob"),
      storageId: v.id("_storage"),
      contentType: v.optional(v.string()),
      cacheControl: v.optional(v.string()),
    }),
    v.object({
      kind: v.literal("redirect"),
      location: v.string(),
      cacheControl: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, { folderPath, basename }) => {
    // Look up the asset by path
    const asset = await ctx.db
      .query("assets")
      .withIndex("by_folder_basename", (q) =>
        q.eq("folderPath", folderPath).eq("basename", basename),
      )
      .first();

    if (!asset || !asset.publishedVersionId) return null;

    const version = await ctx.db.get(asset.publishedVersionId);
    if (!version) return null;

    // Need either storageId (Convex) or r2Key (R2)
    if (!version.storageId && !version.r2Key) return null;

    const size = version.size ?? 0;
    const mime = version.contentType ?? "application/octet-stream";

    // R2 storage: redirect to public URL (Cloudflare CDN handles caching)
    if (version.r2Key) {
      const url = await getR2PublicUrl(ctx, version.r2Key);
      if (!url) return null;

      return {
        kind: "redirect" as const,
        location: url,
        cacheControl: "public, max-age=31536000, immutable",
      };
    }

    // Convex storage
    const isSmall = size > 0 && size <= SMALL_FILE_LIMIT;

    if (isSmall && version.storageId) {
      return {
        kind: "blob" as const,
        storageId: version.storageId,
        contentType: mime,
        cacheControl: "public, max-age=31536000, immutable",
      };
    }

    const url = await ctx.storage.getUrl(version.storageId!);
    if (!url) return null;

    return {
      kind: "redirect" as const,
      location: url,
      cacheControl: "public, max-age=60",
    };
  },
});

// export const httpServeVersion = internalAction({
//   args: {
//     versionId: v.id("assetVersions"),
//   },
//   returns: v.union(
//     v.null(),
//     v.object({
//       kind: v.literal("blob"),
//       storageId: v.id("_storage"),
//       contentType: v.optional(v.string()),
//       cacheControl: v.optional(v.string()),
//     }),
//     v.object({
//       kind: v.literal("redirect"),
//       location: v.string(),
//       cacheControl: v.optional(v.string()),
//     }),
//   ),
//   handler: async (ctx, { versionId }): Promise<ServeVersionResult> => {
//     return await ctx.runQuery(internal.assetFsHttp.getVersionForServing, {
//       versionId,
//     });
//   },
// });
