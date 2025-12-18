import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  folders: defineTable({
    path: v.string(),
    name: v.string(),
    extra: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  }).index("by_path", ["path"]),
  assets: defineTable({
    folderPath: v.string(),
    basename: v.string(),
    extra: v.optional(v.any()),
    versionCounter: v.number(),
    publishedVersionId: v.optional(v.id("assetVersions")),
    draftVersionId: v.optional(v.id("assetVersions")),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  }).index("by_folder_basename", ["folderPath", "basename"]),
  assetVersions: defineTable({
    assetId: v.id("assets"),
    version: v.number(),
    state: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    ),

    label: v.optional(v.string()),
    extra: v.optional(v.any()),

    // NEW: file storage metadata
    storageId: v.optional(v.id("_storage")),
    size: v.optional(v.number()),
    contentType: v.optional(v.string()),
    sha256: v.optional(v.string()),

    createdAt: v.number(),
    createdBy: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    publishedBy: v.optional(v.string()),
    archivedAt: v.optional(v.number()),
    archivedBy: v.optional(v.string()),
  })
    .index("by_asset", ["assetId"])
    .index("by_asset_version", ["assetId", "version"]),
  assetEvents: defineTable({
    assetId: v.id("assets"),
    type: v.string(),
    fromFolderPath: v.optional(v.string()),
    toFolderPath: v.optional(v.string()),
    fromBasename: v.optional(v.string()),
    toBasename: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.optional(v.string()),
  }).index("by_asset", ["assetId"]),
});

export default schema;
