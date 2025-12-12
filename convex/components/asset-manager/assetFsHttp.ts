// convex/assetFsHttp.ts
import {
  action,
  internalAction,
  internalQuery,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";

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
    if (!version.storageId) return null;

    const url = await ctx.storage.getUrl(version.storageId);
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
 * - Small files (≤20MB): Served as blobs with immutable caching (1 year)
 * - Large files (>20MB): Served via redirect to storage URL with short caching (60s)
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
    if (!version.storageId) return null;

    const size = version.size ?? 0;
    const mime = version.contentType ?? "application/octet-stream";
    const isSmall = size > 0 && size <= SMALL_FILE_LIMIT;

    if (isSmall) {
      return {
        kind: "blob" as const,
        storageId: version.storageId,
        contentType: mime,
        cacheControl: "public, max-age=31536000, immutable",
      };
    }

    const url = await ctx.storage.getUrl(version.storageId);
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
