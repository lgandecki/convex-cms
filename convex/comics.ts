// convex/comics.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { components } from "./_generated/api";
import { requireAuth } from "./authHelpers";

// Character metadata structure
const characterMetadataValidator = v.object({
  name: v.string(),
  organism: v.string(),
  power: v.string(),
  archetype: v.string(),
  bio: v.string(),
});

// Frame structure for scenarios
const frameValidator = v.object({
  scene: v.string(),
  characters: v.array(v.string()),
  speaker: v.string(),
  dialogue: v.string(),
  imageType: v.union(v.literal("comic"), v.literal("superhero")),
});

// Character image config in scenarios
const characterImagesValidator = v.record(
  v.string(),
  v.union(v.literal("comic"), v.literal("superhero"), v.literal("both"))
);

// Full scenario structure
const scenarioValidator = v.object({
  name: v.string(),
  description: v.string(),
  characterImages: characterImagesValidator,
  frames: v.array(frameValidator),
});

// ============== CHARACTER OPERATIONS ==============

// List all characters from /comics/characters/
export const listCharacters = query({
  args: {},
  handler: async (ctx) => {
    // List all folders under /comics/characters/
    const characterFolders = await ctx.runQuery(
      components.assetManager.assetManager.listFolders,
      { parentPath: "comics/characters" }
    );

    const characters = await Promise.all(
      characterFolders.map(async (folder) => {
        const characterKey = folder.name;

        // Get published assets including metadata
        const publishedAssets = await ctx.runQuery(
          components.assetManager.assetManager.listPublishedAssetsInFolder,
          { folderPath: folder.path }
        );

        // Get published files for URLs
        const publishedFiles = await ctx.runQuery(
          components.assetManager.assetManager.listPublishedFilesInFolder,
          { folderPath: folder.path }
        );

        // Find metadata from assets
        const metadataAsset = publishedAssets.find(
          (a) => a.basename === "metadata.json"
        );

        // Find images from files
        const comicImage = publishedFiles.find(
          (f) => f.basename === "comic.png" || f.basename === "comic.jpg"
        );
        const superheroImage = publishedFiles.find(
          (f) => f.basename === "superhero.png" || f.basename === "superhero.jpg"
        );

        return {
          key: characterKey,
          folderPath: folder.path,
          metadata: (metadataAsset?.extra as CharacterMetadata) ?? null,
          comicImageUrl: comicImage?.url ?? null,
          superheroImageUrl: superheroImage?.url ?? null,
        };
      })
    );

    return characters;
  },
});

// Type for character metadata
type CharacterMetadata = {
  name: string;
  organism: string;
  power: string;
  archetype: string;
  bio: string;
};

// Get a single character with full details
export const getCharacter = query({
  args: {
    characterKey: v.string(),
  },
  handler: async (ctx, args) => {
    const folderPath = `comics/characters/${args.characterKey}`;

    // Check if folder exists
    const folder = await ctx.runQuery(
      components.assetManager.assetManager.getFolder,
      { path: folderPath }
    );

    if (!folder) {
      return null;
    }

    // Get all assets in the character folder
    const assets = await ctx.runQuery(
      components.assetManager.assetManager.listAssets,
      { folderPath }
    );

    // Get published assets (includes extra/metadata)
    const publishedAssets = await ctx.runQuery(
      components.assetManager.assetManager.listPublishedAssetsInFolder,
      { folderPath }
    );

    // Get published files (includes URLs)
    const publishedFiles = await ctx.runQuery(
      components.assetManager.assetManager.listPublishedFilesInFolder,
      { folderPath }
    );

    // Find metadata from assets
    const metadataAsset = publishedAssets.find(
      (a) => a.basename === "metadata.json"
    );

    // Find images from files
    const comicFile = publishedFiles.find(
      (f) => f.basename === "comic.png" || f.basename === "comic.jpg"
    );
    const superheroFile = publishedFiles.find(
      (f) => f.basename === "superhero.png" || f.basename === "superhero.jpg"
    );

    return {
      key: args.characterKey,
      folderPath,
      metadata: (metadataAsset?.extra as CharacterMetadata) ?? null,
      comicImageUrl: comicFile?.url ?? null,
      superheroImageUrl: superheroFile?.url ?? null,
      assets,
      publishedFiles,
    };
  },
});

// Update character metadata
export const updateCharacterMetadata = mutation({
  args: {
    characterKey: v.string(),
    metadata: characterMetadataValidator,
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const folderPath = `comics/characters/${args.characterKey}`;

    // Check if character folder exists, create if not
    const folder = await ctx.runQuery(
      components.assetManager.assetManager.getFolder,
      { path: folderPath }
    );

    if (!folder) {
      // Create the character folder structure
      await ctx.runMutation(
        components.assetManager.assetManager.createFolderByPath,
        { path: folderPath }
      );
    }

    // Check if metadata asset exists
    const existingAsset = await ctx.runQuery(
      components.assetManager.assetManager.getAsset,
      { folderPath, basename: "metadata.json" }
    );

    if (!existingAsset) {
      // Create new metadata asset
      await ctx.runMutation(
        components.assetManager.assetManager.createAsset,
        {
          folderPath,
          basename: "metadata.json",
          extra: args.metadata,
        }
      );
    }

    // Publish the metadata
    await ctx.runMutation(
      components.assetManager.assetManager.publishDraft,
      { folderPath, basename: "metadata.json" }
    );

    return { success: true };
  },
});

// ============== SCENARIO OPERATIONS ==============

// List all scenarios from /comics/scenarios/
export const listScenarios = query({
  args: {},
  handler: async (ctx) => {
    // Get published assets which include extra/metadata
    const publishedAssets = await ctx.runQuery(
      components.assetManager.assetManager.listPublishedAssetsInFolder,
      { folderPath: "comics/scenarios" }
    );

    return publishedAssets
      .filter((a) => a.basename.endsWith(".json"))
      .map((a) => ({
        name: a.basename.replace(".json", ""),
        basename: a.basename,
        scenario: a.extra as ScenarioData | null,
      }));
  },
});

// Type for scenario data
type ScenarioData = {
  name: string;
  description: string;
  characterImages: Record<string, "comic" | "superhero" | "both">;
  frames: Array<{
    scene: string;
    characters: string[];
    speaker: string;
    dialogue: string;
    imageType: "comic" | "superhero";
  }>;
};

// Get a single scenario
export const getScenario = query({
  args: {
    scenarioName: v.string(),
  },
  handler: async (ctx, args) => {
    const basename = args.scenarioName.endsWith(".json")
      ? args.scenarioName
      : `${args.scenarioName}.json`;

    // Get published assets to access the extra/scenario data
    const publishedAssets = await ctx.runQuery(
      components.assetManager.assetManager.listPublishedAssetsInFolder,
      { folderPath: "comics/scenarios" }
    );

    const scenarioAsset = publishedAssets.find((a) => a.basename === basename);

    if (!scenarioAsset) {
      return null;
    }

    return {
      name: args.scenarioName.replace(".json", ""),
      basename,
      scenario: scenarioAsset.extra as ScenarioData | null,
    };
  },
});

// Create a new scenario
export const createScenario = mutation({
  args: {
    name: v.string(),
    scenario: scenarioValidator,
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const folderPath = "comics/scenarios";
    const basename = `${args.name}.json`;

    // Ensure the scenarios folder exists
    const folder = await ctx.runQuery(
      components.assetManager.assetManager.getFolder,
      { path: folderPath }
    );

    if (!folder) {
      await ctx.runMutation(
        components.assetManager.assetManager.createFolderByPath,
        { path: folderPath }
      );
    }

    // Check if scenario already exists
    const existing = await ctx.runQuery(
      components.assetManager.assetManager.getAsset,
      { folderPath, basename }
    );

    if (existing) {
      throw new Error(`Scenario "${args.name}" already exists`);
    }

    // Create the scenario asset
    await ctx.runMutation(
      components.assetManager.assetManager.createAsset,
      {
        folderPath,
        basename,
        extra: args.scenario,
      }
    );

    // Publish it
    await ctx.runMutation(
      components.assetManager.assetManager.publishDraft,
      { folderPath, basename }
    );

    return { success: true, name: args.name };
  },
});

// Update an existing scenario
export const updateScenario = mutation({
  args: {
    scenarioName: v.string(),
    scenario: scenarioValidator,
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const folderPath = "comics/scenarios";
    const basename = args.scenarioName.endsWith(".json")
      ? args.scenarioName
      : `${args.scenarioName}.json`;

    // Check if scenario exists
    const existing = await ctx.runQuery(
      components.assetManager.assetManager.getAsset,
      { folderPath, basename }
    );

    if (!existing) {
      throw new Error(`Scenario "${args.scenarioName}" not found`);
    }

    // Update by creating new asset with same name (creates new version)
    await ctx.runMutation(
      components.assetManager.assetManager.createAsset,
      {
        folderPath,
        basename,
        extra: args.scenario,
      }
    );

    // Publish the new version
    await ctx.runMutation(
      components.assetManager.assetManager.publishDraft,
      { folderPath, basename }
    );

    return { success: true };
  },
});

// ============== GALLERY OPERATIONS ==============

// List generated comic strips from /comics/strips/
export const listGeneratedStrips = query({
  args: {
    scenarioName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const folderPath = args.scenarioName
      ? `comics/strips/${args.scenarioName}`
      : "comics/strips";

    // First check if the folder exists
    const folder = await ctx.runQuery(
      components.assetManager.assetManager.getFolder,
      { path: folderPath }
    );

    if (!folder) {
      return [];
    }

    // If looking at a specific scenario, get the strips
    if (args.scenarioName) {
      const publishedFiles = await ctx.runQuery(
        components.assetManager.assetManager.listPublishedFilesInFolder,
        { folderPath }
      );

      return publishedFiles
        .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f.basename))
        .map((f) => ({
          scenarioName: args.scenarioName!,
          basename: f.basename,
          url: f.url,
        }));
    }

    // Otherwise list all scenario folders
    const scenarioFolders = await ctx.runQuery(
      components.assetManager.assetManager.listFolders,
      { parentPath: folderPath }
    );

    const allStrips = await Promise.all(
      scenarioFolders.map(async (folder) => {
        const publishedFiles = await ctx.runQuery(
          components.assetManager.assetManager.listPublishedFilesInFolder,
          { folderPath: folder.path }
        );

        return publishedFiles
          .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f.basename))
          .map((f) => ({
            scenarioName: folder.name,
            basename: f.basename,
            url: f.url,
          }));
      })
    );

    return allStrips.flat();
  },
});

// Get all versions of a generated strip for a scenario
export const getStripVersions = query({
  args: {
    scenarioName: v.string(),
    basename: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const folderPath = `comics/strips/${args.scenarioName}`;
    const stripBasename = args.basename ?? `${args.scenarioName}.png`;

    const versions = await ctx.runQuery(
      components.assetManager.assetManager.getAssetVersions,
      { folderPath, basename: stripBasename }
    );

    return versions;
  },
});
