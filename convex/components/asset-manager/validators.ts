// Shared validators for asset-manager component
// These are defined once and reused across all queries/mutations
// to ensure consistency and reduce duplication.

import { v } from "convex/values";

/**
 * Validator fields for a folder document.
 * Use with v.object(folderFields) for returns validators.
 */
export const folderFields = {
  _id: v.id("folders"),
  path: v.string(),
  name: v.string(),
  extra: v.optional(v.any()),
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.optional(v.string()),
  updatedBy: v.optional(v.string()),
  _creationTime: v.number(),
};

/**
 * Validator fields for an asset document.
 * Use with v.object(assetFields) for returns validators.
 */
export const assetFields = {
  _id: v.id("assets"),
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
  _creationTime: v.number(),
};

/**
 * Validator fields for an asset version document.
 * Use with v.object(assetVersionFields) for returns validators.
 */
export const assetVersionFields = {
  _id: v.id("assetVersions"),
  assetId: v.id("assets"),
  version: v.number(),
  state: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
  label: v.optional(v.string()),
  extra: v.optional(v.any()),
  storageId: v.optional(v.id("_storage")),
  size: v.optional(v.number()),
  contentType: v.optional(v.string()),
  sha256: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.optional(v.string()),
  updatedBy: v.optional(v.string()),
  _creationTime: v.number(),
};
