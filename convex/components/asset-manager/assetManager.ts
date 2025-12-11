import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { slugify } from "./slugify";
import { allocateFolderSegment } from "./allocateFolderSegment";
import { getActorFields } from "./authAdapter";
import { Id } from "./_generated/dataModel";

const ROOT_PARENT = "" as const;

function normalizeFolderPath(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "/") return "";
  // Strip leading/trailing slashes and collapse multiple slashes
  const withoutSlashes = trimmed.replace(/^\/+|\/+$/g, "");
  if (!withoutSlashes) return "";
  // You can add more validation here if you like (no `..`, etc.)
  return withoutSlashes;
}

export const createFolderByPath = mutation({
  args: {
    path: v.string(),
    name: v.optional(v.string()),
    extra: v.optional(v.any()),
  },
  returns: v.id("folders"),
  handler: async (ctx, args) => {
    const newFolderPath = normalizeFolderPath(args.path);
    if (newFolderPath.trim().length === 0) {
      throw new Error("Folder path cannot be empty");
    }
    const existing = await ctx.db
      .query("folders")
      .withIndex("by_path", (q) => q.eq("path", newFolderPath))
      .first();

    if (existing) {
      throw new Error("Folder already exists");
    }

    const now = Date.now();

    const id = await ctx.db.insert("folders", {
      path: newFolderPath,
      name: args.name ?? newFolderPath.split("/").pop()!,
      extra: args.extra,
      createdAt: now,
      updatedAt: now,
      ...(await getActorFields(ctx)),
    });

    return id;
  },
});

function joinPath(parent: string, segment: string): string {
  return parent ? `${parent}/${segment}` : segment;
}

export const createFolderByName = mutation({
  args: {
    parentPath: v.string(),
    name: v.string(),
    extra: v.optional(v.any()),
  },
  returns: v.id("folders"),
  handler: async (ctx, args) => {
    const normalizedParentPath = normalizeFolderPath(args.parentPath);
    const slugifiedName = slugify(args.name);
    let newFolderPath = joinPath(normalizedParentPath, slugifiedName);

    const existing = await ctx.db
      .query("folders")
      .withIndex("by_path", (q) =>
        q.eq("path", joinPath(normalizedParentPath, slugifiedName)),
      )
      .first();

    if (existing) {
      if (args.name !== existing.name) {
        const segment = await allocateFolderSegment(
          ctx,
          normalizedParentPath,
          slugifiedName,
        );
        newFolderPath = joinPath(normalizedParentPath, segment);
      } else {
        throw new Error("Folder already exists");
      }
    }

    const now = Date.now();
    const id = await ctx.db.insert("folders", {
      path: newFolderPath,
      name: args.name,
      extra: args.extra,
      createdAt: now,
      updatedAt: now,
      ...(await getActorFields(ctx)),
    });

    return id;
  },
});

export const getFolder = query({
  args: { path: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("folders"),
      path: v.string(),
      name: v.string(),
      extra: v.optional(v.any()),
      createdAt: v.number(),
      updatedAt: v.number(),
      createdBy: v.optional(v.string()),
      updatedBy: v.optional(v.string()),
      _creationTime: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const normalized = normalizeFolderPath(args.path);
    if (!normalized) return null;

    const folder = await ctx.db
      .query("folders")
      .withIndex("by_path", (q) => q.eq("path", normalized))
      .first();

    return folder ?? null;
  },
});

const SUFFIX = "\uffff";

const depth = (path: string): number => path.split("/").length;
export const listFolders = query({
  args: {
    parentPath: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("folders"),
      path: v.string(),
      name: v.string(),
      extra: v.optional(v.any()),
      createdAt: v.number(),
      updatedAt: v.number(),
      createdBy: v.optional(v.string()),
      updatedBy: v.optional(v.string()),
      _creationTime: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const parentPath =
      args.parentPath === undefined
        ? ROOT_PARENT
        : normalizeFolderPath(args.parentPath);
    const parentPrefix = parentPath ? `${parentPath}/` : "";
    const end = `${parentPrefix}${SUFFIX}`;
    const candidates = await ctx.db
      .query("folders")
      .withIndex("by_path", (q) => q.gte("path", parentPrefix).lt("path", end))
      .order("asc")
      .collect();
    return candidates.filter(
      (candidate) => depth(candidate.path) === depth(parentPrefix),
    );
  },
});

export const updateFolder = mutation({
  args: {
    path: v.string(),
    name: v.optional(v.string()),
    newPath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalized = normalizeFolderPath(args.path);
    if (!normalized) {
      throw new Error("Folder path cannot be empty");
    }

    const existing = await ctx.db
      .query("folders")
      .withIndex("by_path", (q) => q.eq("path", normalized))
      .first();

    if (!existing) {
      throw new Error("Folder does not exist");
    }

    if (args.newPath) {
      const newNormalized = normalizeFolderPath(args.newPath);
      const newExisting = await ctx.db
        .query("folders")
        .withIndex("by_path", (q) => q.eq("path", newNormalized))
        .first();
      if (newExisting) {
        throw new Error("New path already exists");
      }
    }

    const now = Date.now();
    const actorFields = await getActorFields(ctx);
    const id = await ctx.db.patch(existing._id, {
      name: args.name ?? existing.name,
      path: args.newPath ?? existing.path,
      updatedAt: now,
      updatedBy: actorFields.updatedBy,
    });
    return existing._id;
  },
});
// Idempotent: returns existing folder id if it already exists.
// export const ensureFolder = mutation({
//   args: {
//     path: v.string(),
//     name: v.optional(v.string()),
//     extra: v.optional(v.any()),
//   },
//   returns: v.id("folders"),
//   handler: async (ctx, args) => {
//     const normalized = normalizeFolderPath(args.path);
//     if (!normalized) {
//       throw new Error("Folder path cannot be empty");
//     }

//     const existing = await ctx.db
//       .query("folders")
//       .withIndex("by_path", (q) => q.eq("path", normalized))
//       .first();

//     if (existing) {
//       return existing._id;
//     }

//     const { parentPath, name: defaultName } = splitParent(normalized);
//     const now = Date.now();

//     const id = await ctx.db.insert("folders", {
//       path: normalized,
//       parentPath,
//       name: args.name ?? defaultName,
//       extra: args.extra,
//       createdAt: now,
//       updatedAt: now,
//     });

//     return id;
//   },
// });

export const createAsset = mutation({
  args: {
    folderPath: v.string(),
    basename: v.string(),
    extra: v.optional(v.any()),
  },
  returns: v.id("assets"),
  handler: async (ctx, args) => {
    const folderPath = normalizeFolderPath(args.folderPath);
    if (args.basename.includes("/")) {
      throw new Error("basename must not contain '/'");
    }

    const existing = await ctx.db
      .query("assets")
      .withIndex("by_folder_basename", (q) =>
        q.eq("folderPath", folderPath).eq("basename", args.basename),
      )
      .first();

    if (existing) {
      throw new Error("Asset already exists");
    }

    const now = Date.now();
    const actorFields = await getActorFields(ctx);

    return await ctx.db.insert("assets", {
      folderPath,
      basename: args.basename,
      extra: args.extra,
      versionCounter: 0,
      createdAt: now,
      updatedAt: now,
      ...actorFields,
    });
  },
});

export const getAsset = query({
  args: { folderPath: v.string(), basename: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("assets"),
      folderPath: v.string(),
      basename: v.string(),
      extra: v.optional(v.any()),
      versionCounter: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
      createdBy: v.optional(v.string()),
      updatedBy: v.optional(v.string()),
      _creationTime: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const normalizedFolderPath = normalizeFolderPath(args.folderPath);

    const normalizedBasename = args.basename.trim();
    if (!normalizedBasename) {
      return null;
    }
    const asset = await ctx.db
      .query("assets")
      .withIndex("by_folder_basename", (q) =>
        q
          .eq("folderPath", normalizedFolderPath)
          .eq("basename", normalizedBasename),
      )
      .first();
    return asset ?? null;
  },
});

export const listAssets = query({
  args: { folderPath: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("assets"),
      folderPath: v.string(),
      basename: v.string(),
      extra: v.optional(v.any()),
      versionCounter: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
      createdBy: v.optional(v.string()),
      updatedBy: v.optional(v.string()),
      _creationTime: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const normalizedFolderPath = normalizeFolderPath(args.folderPath);

    const assets = await ctx.db
      .query("assets")
      .withIndex("by_folder_basename", (q) =>
        q.eq("folderPath", normalizedFolderPath),
      )
      .order("asc")
      .collect();
    return assets;
  },
});

export const getFolderWithAssets = query({
  args: { path: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      folder: v.object({
        _id: v.id("folders"),
        path: v.string(),
        name: v.string(),
        extra: v.optional(v.any()),
        createdAt: v.number(),
        updatedAt: v.number(),
        createdBy: v.optional(v.string()),
        updatedBy: v.optional(v.string()),
        _creationTime: v.number(),
      }),
      assets: v.array(
        v.object({
          _id: v.id("assets"),
          folderPath: v.string(),
          basename: v.string(),
          extra: v.optional(v.any()),
          versionCounter: v.number(),
          createdAt: v.number(),
          updatedAt: v.number(),
          createdBy: v.optional(v.string()),
          updatedBy: v.optional(v.string()),
          _creationTime: v.number(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const folderPath = normalizeFolderPath(args.path);
    if (!folderPath) return null;

    const folder = await ctx.db
      .query("folders")
      .withIndex("by_path", (q) => q.eq("path", folderPath))
      .first();

    if (!folder) return null;

    const assets = await ctx.db
      .query("assets")
      .withIndex("by_folder_basename", (q) => q.eq("folderPath", folderPath))
      .collect();

    return { folder, assets };
  },
});
export const commitVersion = mutation({
  args: {
    folderPath: v.string(),
    basename: v.string(),
    publish: v.optional(v.boolean()),
    label: v.optional(v.string()),
    extra: v.optional(v.any()),
  },
  returns: v.object({
    assetId: v.id("assets"),
    versionId: v.id("assetVersions"),
    version: v.number(),
  }),
  handler: async (ctx, args) => {
    const normalizedFolderPath = normalizeFolderPath(args.folderPath);
    const normalizedBasename = args.basename.trim();
    if (!normalizedBasename) {
      throw new Error("basename cannot be empty");
    }

    const publish = args.publish ?? false;
    const now = Date.now();
    const actorFields = await getActorFields(ctx);

    let asset = await ctx.db
      .query("assets")
      .withIndex("by_folder_basename", (q) =>
        q
          .eq("folderPath", normalizedFolderPath)
          .eq("basename", normalizedBasename),
      )
      .first();

    let assetId: Id<"assets">;
    let newVersionNumber: number;

    if (!asset) {
      // Create new asset
      assetId = await ctx.db.insert("assets", {
        folderPath: normalizedFolderPath,
        basename: normalizedBasename,
        versionCounter: 1,
        createdAt: now,
        updatedAt: now,
        ...actorFields,
      });
      newVersionNumber = 1;
    } else {
      // Update existing asset
      newVersionNumber = asset.versionCounter + 1;
      await ctx.db.patch(asset._id, {
        versionCounter: newVersionNumber,
        updatedAt: now,
        updatedBy: actorFields.updatedBy,
      });
      assetId = asset._id;
    }

    // Create new version
    const versionId = await ctx.db.insert("assetVersions", {
      assetId,
      version: newVersionNumber,
      state: publish ? "published" : "draft",
      label: args.label,
      extra: args.extra,
      createdAt: now,
      ...actorFields,
      ...(publish
        ? { publishedAt: now, publishedBy: actorFields.createdBy }
        : {}),
    });

    if (publish) {
      // If there's an existing published version, archive it
      if (asset?.publishedVersionId) {
        await ctx.db.patch(asset.publishedVersionId, {
          state: "archived",
          archivedAt: now,
          archivedBy: actorFields.updatedBy,
        });
      }

      // Update asset with new published version
      await ctx.db.patch(assetId, {
        publishedVersionId: versionId,
        draftVersionId: undefined,
        updatedAt: now,
        updatedBy: actorFields.updatedBy,
      });
    } else {
      // Update asset with new draft version
      await ctx.db.patch(assetId, {
        draftVersionId: versionId,
        updatedAt: now,
        updatedBy: actorFields.updatedBy,
      });
    }

    return { assetId, versionId, version: newVersionNumber };
  },
});

export const getAssetVersions = query({
  args: {
    folderPath: v.string(),
    basename: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedFolderPath = normalizeFolderPath(args.folderPath);

    const asset = await ctx.db
      .query("assets")
      .withIndex("by_folder_basename", (q) =>
        q.eq("folderPath", normalizedFolderPath).eq("basename", args.basename),
      )
      .first();

    if (!asset) {
      return [];
    }

    const versions = await ctx.db
      .query("assetVersions")
      .withIndex("by_asset", (q) => q.eq("assetId", asset._id))
      .order("asc")
      .collect();

    return versions;
  },
});

export const publishDraft = mutation({
  args: {
    folderPath: v.string(),
    basename: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedFolderPath = normalizeFolderPath(args.folderPath);
    const now = Date.now();
    const actorFields = await getActorFields(ctx);

    // Find the asset
    const asset = await ctx.db
      .query("assets")
      .withIndex("by_folder_basename", (q) =>
        q.eq("folderPath", normalizedFolderPath).eq("basename", args.basename),
      )
      .first();

    if (!asset) {
      throw new Error(
        `Asset not found: ${normalizedFolderPath}/${args.basename}`,
      );
    }

    // Check that asset has a draft version
    if (!asset.draftVersionId) {
      throw new Error(
        `No draft version exists for asset: ${normalizedFolderPath}/${args.basename}`,
      );
    }

    // Get the draft version and verify it's actually a draft
    const draftVersion = await ctx.db.get(asset.draftVersionId);
    if (!draftVersion || draftVersion.state !== "draft") {
      throw new Error(`Draft version not found or not in draft state`);
    }

    // Archive existing published version if any
    if (asset.publishedVersionId) {
      await ctx.db.patch(asset.publishedVersionId, {
        state: "archived",
        archivedAt: now,
        archivedBy: actorFields.updatedBy,
      });
    }

    // Patch draft version to published
    await ctx.db.patch(asset.draftVersionId, {
      state: "published",
      publishedAt: now,
      publishedBy: actorFields.updatedBy,
    });

    // Update asset
    await ctx.db.patch(asset._id, {
      publishedVersionId: asset.draftVersionId,
      draftVersionId: undefined,
      updatedAt: now,
      updatedBy: actorFields.updatedBy,
    });

    return { assetId: asset._id, versionId: asset.draftVersionId };
  },
});

export const getPublishedVersion = query({
  args: {
    folderPath: v.string(),
    basename: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedFolderPath = normalizeFolderPath(args.folderPath);

    // Find the asset
    const asset = await ctx.db
      .query("assets")
      .withIndex("by_folder_basename", (q) =>
        q.eq("folderPath", normalizedFolderPath).eq("basename", args.basename),
      )
      .first();

    if (!asset || !asset.publishedVersionId) {
      return null;
    }

    // Load the published version
    const publishedVersion = await ctx.db.get(asset.publishedVersionId);
    if (!publishedVersion) {
      return null;
    }

    return {
      folderPath: asset.folderPath,
      basename: asset.basename,
      version: publishedVersion.version,
      state: publishedVersion.state,
      createdAt: publishedVersion.createdAt,
      publishedAt: publishedVersion.publishedAt,
      createdBy: publishedVersion.createdBy,
      publishedBy: publishedVersion.publishedBy,
    };
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
    assetId: v.id("assets"),
    versionId: v.id("assetVersions"),
    version: v.number(),
  }),
  handler: async (ctx, args) => {
    const folderPath = normalizeFolderPath(args.folderPath);
    if (args.basename.includes("/")) {
      throw new Error("basename must not contain '/'");
    }

    const now = Date.now();
    const actorFields = await getActorFields(ctx);
    const publish = args.publish ?? false;

    // 1. Look up or create asset
    let asset = await ctx.db
      .query("assets")
      .withIndex("by_folder_basename", (q) =>
        q.eq("folderPath", folderPath).eq("basename", args.basename),
      )
      .first();

    let assetId;
    let nextVersion: number;

    if (!asset) {
      nextVersion = 1;
      assetId = await ctx.db.insert("assets", {
        folderPath,
        basename: args.basename,
        extra: undefined,
        versionCounter: nextVersion,
        publishedVersionId: undefined,
        draftVersionId: undefined,
        createdAt: now,
        updatedAt: now,
        ...actorFields,
      });
      asset = await ctx.db.get(assetId);
    } else {
      nextVersion = (asset.versionCounter ?? 0) + 1;
      await ctx.db.patch(asset._id, {
        versionCounter: nextVersion,
        updatedAt: now,
        updatedBy: actorFields.updatedBy,
      });
      assetId = asset._id;
    }

    // 2. Fetch file metadata from _storage
    const fileDoc = await ctx.db.system.get(args.storageId);
    if (!fileDoc) {
      throw new Error("File metadata not found in _storage");
    }

    console.log(fileDoc);
    // 3. Insert version
    const versionId = await ctx.db.insert("assetVersions", {
      assetId,
      version: nextVersion,
      state: publish ? "published" : "draft",
      label: args.label,
      extra: args.extra,
      storageId: args.storageId,
      size: fileDoc.size,
      contentType: fileDoc.contentType,
      sha256: fileDoc.sha256,
      createdAt: now,
      createdBy: actorFields.createdBy,
      publishedAt: publish ? now : undefined,
      publishedBy: publish ? actorFields.updatedBy : undefined,
      archivedAt: undefined,
      archivedBy: undefined,
    });

    // 4. Update asset pointers and archive old published if needed
    if (publish) {
      if (asset?.publishedVersionId) {
        await ctx.db.patch(asset.publishedVersionId, {
          state: "archived",
          archivedAt: now,
          archivedBy: actorFields.updatedBy,
        });
      }

      await ctx.db.patch(assetId, {
        publishedVersionId: versionId,
        draftVersionId: undefined,
        updatedAt: now,
        updatedBy: actorFields.updatedBy,
      });
    } else {
      await ctx.db.patch(assetId, {
        draftVersionId: versionId,
        updatedAt: now,
        updatedBy: actorFields.updatedBy,
      });
    }

    return { assetId, versionId, version: nextVersion };
  },
});

export const getPublishedFile = query({
  args: {
    folderPath: v.string(),
    basename: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      folderPath: v.string(),
      basename: v.string(),
      version: v.number(),
      state: v.literal("published"),
      storageId: v.id("_storage"),
      size: v.optional(v.number()),
      contentType: v.optional(v.string()),
      sha256: v.optional(v.string()),
      createdAt: v.number(),
      publishedAt: v.number(),
      createdBy: v.optional(v.string()),
      publishedBy: v.optional(v.string()),
      url: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const folderPath = normalizeFolderPath(args.folderPath);

    const asset = await ctx.db
      .query("assets")
      .withIndex("by_folder_basename", (q) =>
        q.eq("folderPath", folderPath).eq("basename", args.basename),
      )
      .first();

    if (!asset || !asset.publishedVersionId) return null;

    const version = await ctx.db.get(asset.publishedVersionId);
    if (!version || version.state !== "published" || !version.storageId) {
      return null;
    }

    const url = await ctx.storage.getUrl(version.storageId);
    if (!url) return null;

    return {
      folderPath,
      basename: args.basename,
      version: version.version,
      state: "published" as const,
      storageId: version.storageId,
      size: version.size,
      contentType: version.contentType,
      sha256: version.sha256,
      createdAt: version.createdAt,
      publishedAt: version.publishedAt!,
      createdBy: version.createdBy,
      publishedBy: version.publishedBy,
      url,
    };
  },
});

export const listPublishedFilesInFolder = query({
  args: {
    folderPath: v.string(),
  },
  returns: v.array(
    v.object({
      folderPath: v.string(),
      basename: v.string(),
      version: v.number(),
      storageId: v.id("_storage"),
      url: v.string(),
      contentType: v.optional(v.string()),
      size: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const folderPath = normalizeFolderPath(args.folderPath);

    const assets = await ctx.db
      .query("assets")
      .withIndex("by_folder_basename", (q) => q.eq("folderPath", folderPath))
      .collect();

    const results = [];

    for (const asset of assets) {
      if (!asset.publishedVersionId) continue;
      const version = await ctx.db.get(asset.publishedVersionId);
      if (!version || version.state !== "published" || !version.storageId) {
        continue;
      }
      const url = await ctx.storage.getUrl(version.storageId);
      if (!url) continue;

      results.push({
        folderPath,
        basename: asset.basename,
        version: version.version,
        storageId: version.storageId,
        url,
        contentType: version.contentType,
        size: version.size,
      });
    }

    return results;
  },
});
