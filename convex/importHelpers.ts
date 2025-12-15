// convex/importHelpers.ts
// Unauthenticated helpers for one-off import scripts
// DELETE THIS FILE after import is complete!

import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { components } from "./_generated/api";

// Unauthenticated version of generateUploadUrl for import
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.runMutation(
      components.assetManager.generateUploadUrl.generateUploadUrl,
      {}
    );
  },
});

// Unauthenticated version of commitUpload for import
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
    assetId: v.string(),
    versionId: v.string(),
    version: v.number(),
  }),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.assetManager.assetManager.commitUpload,
      args
    );
  },
});

// Unauthenticated folder creation for import
export const createFolderByPath = mutation({
  args: {
    path: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.assetManager.assetManager.createFolderByPath,
      args
    );
  },
});

// Unauthenticated character metadata update for import
export const updateCharacterMetadata = mutation({
  args: {
    characterKey: v.string(),
    metadata: v.object({
      name: v.string(),
      organism: v.string(),
      power: v.string(),
      archetype: v.string(),
      bio: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const folderPath = `comics/characters/${args.characterKey}`;

    // Use commitVersion which handles both creating new assets
    // and updating existing ones, with immediate publish
    await ctx.runMutation(
      components.assetManager.assetManager.commitVersion,
      {
        folderPath,
        basename: "metadata.json",
        publish: true,
        extra: args.metadata,
      }
    );

    return { success: true };
  },
});

// Unauthenticated scenario creation for import
export const createOrUpdateScenario = mutation({
  args: {
    name: v.string(),
    scenario: v.object({
      name: v.string(),
      description: v.string(),
      characterImages: v.record(
        v.string(),
        v.union(v.literal("comic"), v.literal("superhero"), v.literal("both"))
      ),
      frames: v.array(
        v.object({
          scene: v.string(),
          characters: v.array(v.string()),
          speaker: v.string(),
          dialogue: v.string(),
          imageType: v.union(v.literal("comic"), v.literal("superhero")),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    const folderPath = "comics/scenarios";
    const basename = `${args.name}.json`;

    // Ensure folder exists
    try {
      await ctx.runMutation(
        components.assetManager.assetManager.createFolderByPath,
        { path: folderPath }
      );
    } catch {
      // Folder might exist
    }

    // Use commitVersion which handles both creating new assets
    // and updating existing ones, with immediate publish
    await ctx.runMutation(
      components.assetManager.assetManager.commitVersion,
      {
        folderPath,
        basename,
        publish: true,
        extra: args.scenario,
      }
    );

    return { success: true };
  },
});
