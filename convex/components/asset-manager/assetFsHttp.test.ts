// convex/components/asset-manager/assetFsHttp.test.ts
/**
 * Tests for HTTP file serving functionality.
 *
 * This module handles serving asset versions over HTTP with intelligent caching:
 * - Small files (≤20MB): Served as blobs with immutable caching (1 year)
 * - Large files (>20MB): Served via redirect to storage URL with short caching (60s)
 * - Only published versions are served; drafts and archived versions return null
 */
import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api, internal } from "./_generated/api";
import { modules } from "./test.setup";

describe("getVersionForServing (HTTP file serving logic)", () => {
  describe("access control - only published versions are served", () => {
    it("returns null for draft versions (not yet published)", async () => {
      const t = convexTest(schema, modules);

      // Create a small file and commit as draft (not published)
      const storageId = await t.action(
        internal._testInsertFakeFile._testStoreFakeFile,
        { size: 100, contentType: "text/plain" },
      );

      const { versionId } = await t.mutation(api.assetManager.commitUpload, {
        folderPath: "drafts",
        basename: "secret.txt",
        storageId,
        publish: false, // Draft only
      });

      // Try to serve the draft version
      const result = await t.query(api.assetFsHttp.getVersionForServing, {
        versionId,
      });

      expect(result).toBeNull();
    });

    it("returns null for archived versions (previously published, now superseded)", async () => {
      const t = convexTest(schema, modules);

      // Create two versions - the first will be archived when second is published
      const s1 = await t.action(
        internal._testInsertFakeFile._testStoreFakeFile,
        { size: 100, contentType: "text/plain" },
      );
      const s2 = await t.action(
        internal._testInsertFakeFile._testStoreFakeFile,
        { size: 200, contentType: "text/plain" },
      );

      const v1 = await t.mutation(api.assetManager.commitUpload, {
        folderPath: "",
        basename: "doc.txt",
        storageId: s1,
        publish: true,
      });

      // Publishing v2 archives v1
      await t.mutation(api.assetManager.commitUpload, {
        folderPath: "",
        basename: "doc.txt",
        storageId: s2,
        publish: true,
      });

      // v1 is now archived - should not be servable
      const result = await t.query(api.assetFsHttp.getVersionForServing, {
        versionId: v1.versionId,
      });

      expect(result).toBeNull();
    });

    it("serves published versions successfully", async () => {
      const t = convexTest(schema, modules);

      const storageId = await t.action(
        internal._testInsertFakeFile._testStoreFakeFile,
        { size: 100, contentType: "application/json" },
      );

      const { versionId } = await t.mutation(api.assetManager.commitUpload, {
        folderPath: "api",
        basename: "config.json",
        storageId,
        publish: true,
      });

      const result = await t.query(api.assetFsHttp.getVersionForServing, {
        versionId,
      });

      expect(result).not.toBeNull();
      expect(result?.storageId).toEqual(storageId);
    });
  });

  describe("caching strategy - small vs large files", () => {
    it("small files (≤20MB) are served as blobs with immutable caching", async () => {
      const t = convexTest(schema, modules);

      // Create a small file (100 bytes, well under 20MB limit)
      const storageId = await t.action(
        internal._testInsertFakeFile._testStoreFakeFile,
        { size: 100, contentType: "image/png" },
      );

      const { versionId } = await t.mutation(api.assetManager.commitUpload, {
        folderPath: "images",
        basename: "icon.png",
        storageId,
        publish: true,
      });

      const result = await t.query(api.assetFsHttp.getVersionForServing, {
        versionId,
      });

      // Small files return blob response for direct serving
      expect(result?.kind).toBe("blob");
      expect(result?.storageId).toEqual(storageId);
      // contentType is set (defaults to octet-stream if not preserved by storage)
      expect(result?.contentType).toBeDefined();

      // Immutable caching for 1 year - file content is versioned so it never changes
      expect(result?.cacheControl).toBe("public, max-age=31536000, immutable");
    });

    it("large files (>20MB) are served via redirect with short caching", async () => {
      const t = convexTest(schema, modules);

      // Create a large file (25MB, over 20MB limit)
      const largeSize = 25 * 1024 * 1024; // 25MB
      const storageId = await t.action(
        internal._testInsertFakeFile._testStoreFakeFile,
        { size: largeSize, contentType: "video/mp4" },
      );

      const { versionId } = await t.mutation(api.assetManager.commitUpload, {
        folderPath: "videos",
        basename: "intro.mp4",
        storageId,
        publish: true,
      });

      const result = await t.query(api.assetFsHttp.getVersionForServing, {
        versionId,
      });

      // Large files return redirect to storage URL
      expect(result?.kind).toBe("redirect");
      expect(result?.location).toBeDefined();
      expect(typeof result?.location).toBe("string");
      expect((result?.location ?? "").length).toBeGreaterThan(0);

      // Short caching because storage URLs expire
      expect(result?.cacheControl).toBe("public, max-age=60");
    });

    it("files at exactly 20MB boundary are served as blobs", async () => {
      const t = convexTest(schema, modules);

      // Exactly 20MB - should be treated as small
      const exactLimit = 20 * 1024 * 1024;
      const storageId = await t.action(
        internal._testInsertFakeFile._testStoreFakeFile,
        { size: exactLimit, contentType: "application/zip" },
      );

      const { versionId } = await t.mutation(api.assetManager.commitUpload, {
        folderPath: "archives",
        basename: "data.zip",
        storageId,
        publish: true,
      });

      const result = await t.query(api.assetFsHttp.getVersionForServing, {
        versionId,
      });

      expect(result?.kind).toBe("blob");
    });

    it("files just over 20MB boundary are served via redirect", async () => {
      const t = convexTest(schema, modules);

      // Just over 20MB - should be treated as large
      const justOver = 20 * 1024 * 1024 + 1;
      const storageId = await t.action(
        internal._testInsertFakeFile._testStoreFakeFile,
        { size: justOver, contentType: "application/zip" },
      );

      const { versionId } = await t.mutation(api.assetManager.commitUpload, {
        folderPath: "archives",
        basename: "big-data.zip",
        storageId,
        publish: true,
      });

      const result = await t.query(api.assetFsHttp.getVersionForServing, {
        versionId,
      });

      expect(result?.kind).toBe("redirect");
    });
  });

  describe("content type handling", () => {
    it("always includes a content type in the response", async () => {
      const t = convexTest(schema, modules);

      const storageId = await t.action(
        internal._testInsertFakeFile._testStoreFakeFile,
        { size: 500, contentType: "application/pdf" },
      );

      const { versionId } = await t.mutation(api.assetManager.commitUpload, {
        folderPath: "docs",
        basename: "report.pdf",
        storageId,
        publish: true,
      });

      const result = await t.query(api.assetFsHttp.getVersionForServing, {
        versionId,
      });

      expect(result?.kind).toBe("blob");
      // Content type is always present (from storage metadata or defaults to octet-stream)
      expect(result?.contentType).toBeDefined();
      expect(typeof result?.contentType).toBe("string");
    });

    it("defaults to application/octet-stream when content type is not available", async () => {
      const t = convexTest(schema, modules);

      // Create file - storage may or may not preserve contentType
      const storageId = await t.action(
        internal._testInsertFakeFile._testStoreFakeFile,
        { size: 100 },
      );

      const { versionId } = await t.mutation(api.assetManager.commitUpload, {
        folderPath: "misc",
        basename: "unknown.bin",
        storageId,
        publish: true,
      });

      const result = await t.query(api.assetFsHttp.getVersionForServing, {
        versionId,
      });

      expect(result?.kind).toBe("blob");
      // Falls back to octet-stream when no contentType is available
      expect(result?.contentType).toBe("application/octet-stream");
    });
  });
});
