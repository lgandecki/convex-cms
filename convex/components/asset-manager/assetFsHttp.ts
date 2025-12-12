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
    if (version.state !== "published") return null;
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
