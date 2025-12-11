import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { components } from "./_generated/api";

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    // auth checks here if needed
    return await ctx.runMutation(
      components.assetManager.generateUploadUrl.generateUploadUrl,
      {},
    );
  },
});

export const commitUpload = mutation({
  args: {
    folderPath: v.string(),
    basename: v.string(),
    storageId: v.id("_storage"),
    publish: v.optional(v.boolean()),
    label: v.optional(v.string()),
    extra: v.optional(v.any()),
  },
  returns: v.object({
    // These IDs are returned from the asset-manager *component* schema,
    // so we type them as strings here to avoid referencing component-only tables.
    assetId: v.string(),
    versionId: v.string(),
    version: v.number(),
  }),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.assetManager.assetManager.commitUpload,
      args,
    );
  },
});
