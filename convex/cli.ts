// convex/cli.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
// Import the registered components entry point
import { components } from "./_generated/api";

// --- Wrappers for Asset Manager ---

export const listFolders = query({
  args: {
    parentPath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Call the component's function
    // Note: Ensure your component is named 'assetManager' in convex.config.ts
    return await ctx.runQuery(
      components.assetManager.assetManager.listFolders,
      args,
    );
  },
});

export const getFolder = query({
  args: {
    path: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(
      components.assetManager.assetManager.getFolder,
      args,
    );
  },
});

export const createFolderByName = mutation({
  args: {
    parentPath: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.assetManager.assetManager.createFolderByName,
      args,
    );
  },
});
