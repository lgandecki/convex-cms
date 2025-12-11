// convex/assetFsHttp.ts
import type { HttpRouter } from "convex/server";
import { httpAction, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { parseVersionIdFromPath } from "./helpers/parseVersionIdFromPath";

const SMALL_FILE_LIMIT = 20 * 1024 * 1024; // 20MB

export const getVersionForServing = internalQuery({
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

export const httpServeVersion = internalAction({
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
  handler: async (ctx, { versionId }): Promise<ServeVersionResult> => {
    return await ctx.runQuery(internal.assetFsHttp.getVersionForServing, {
      versionId,
    });
  },
});

export function registerAssetFsRoutes(
  http: HttpRouter,
  options?: { basePath?: string },
) {
  const basePath = options?.basePath ?? "/am/file";

  http.route({
    path: `${basePath}/v/:versionId/:filename`,
    method: "GET",
    handler: httpAction(async (ctx, req) => {
      const { pathname } = new URL(req.url);
      const versionId = parseVersionIdFromPath(pathname, basePath);

      if (!versionId) {
        return new Response("Missing versionId", { status: 400 });
      }

      const result = await ctx.runAction(
        internal.assetFsHttp.httpServeVersion,
        {
          versionId: versionId as Id<"assetVersions">,
        },
      );

      if (!result) {
        return new Response("Not found", { status: 404 });
      }

      if (result.kind === "blob") {
        const blob = await ctx.storage.get(result.storageId);
        if (!blob) {
          return new Response("Not found", { status: 404 });
        }

        const headers = new Headers();
        if (result.contentType) {
          headers.set("Content-Type", result.contentType);
        }
        if (result.cacheControl) {
          headers.set("Cache-Control", result.cacheControl);
        }

        return new Response(blob, { status: 200, headers });
      }

      // redirect
      const headers = new Headers({ Location: result.location });
      if (result.cacheControl) {
        headers.set("Cache-Control", result.cacheControl);
      }

      return new Response(null, { status: 302, headers });
    }),
  });
}
