import { httpAction } from "./_generated/server";
import { HttpRouter } from "convex/server";
import { components } from "../../_generated/api";
import { parseVersionIdFromPath } from "./helpers/parseVersionIdFromPath";

export const registerAssetFsRoutes = (
  http: HttpRouter,
  options?: { basePath?: string },
): void => {
  const basePath = options?.basePath ?? "/am/file";

  http.route({
    method: "GET",
    pathPrefix: `${basePath}/v/`,
    handler: httpAction(async (ctx, req) => {
      const { pathname } = new URL(req.url);
      const versionId = parseVersionIdFromPath(pathname, basePath);

      if (!versionId) {
        return new Response("Missing versionId", { status: 400 });
      }

      const result = await ctx.runQuery(
        components.assetManager.assetFsHttp.getVersionForServing,
        { versionId },
      );

      console.log("[registerAssetFsRoutes] result:", result);
      if (!result) {
        return new Response("Not found", { status: 404 });
      }

      if (result.kind === "blob") {
        const blob = await ctx.storage.get(result.storageId);
        // const blob = await ctx.storage.get("kg20p229ejkbvhpdm5g9fx03h17x3797");
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
};
