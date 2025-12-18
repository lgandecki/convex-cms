import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { components } from "./_generated/api";
import { requireAuth } from "./authHelpers";

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.runMutation(
      components.assetManager.generateUploadUrl.generateUploadUrl,
      {},
    );
  },
});

// Internal version for scheduled actions (no auth required)
export const generateUploadUrlInternal = internalMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
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
    await requireAuth(ctx);
    return await ctx.runMutation(
      components.assetManager.assetManager.commitUpload,
      args,
    );
  },
});

// Internal version for scheduled actions (no auth required)
export const commitUploadInternal = internalMutation({
  args: {
    folderPath: v.string(),
    basename: v.string(),
    storageId: v.id("_storage"),
    publish: v.optional(v.boolean()),
    label: v.optional(v.string()),
    extra: v.optional(v.any()),
  },
  returns: v.object({
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
