import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";
import { modules } from "./test.setup";

describe("assets (logical layer)", () => {
  it("createAsset creates an asset at root with normalized folderPath and versionCounter=0", async () => {
    const t = convexTest(schema, modules);

    const assetId = await t.mutation(api.assetManager.createAsset, {
      folderPath: "", // root
      basename: "cover.jpg",
      extra: { kind: "image" },
    });

    const asset = await t.query(api.assetManager.getAsset, {
      folderPath: "",
      basename: "cover.jpg",
    });

    expect(asset?._id).toEqual(assetId);
    expect(asset?.folderPath).toBe(""); // normalized root
    expect(asset?.basename).toBe("cover.jpg");
    expect(asset?.extra).toEqual({ kind: "image" });
    expect(asset?.versionCounter).toBe(0);

    expect(asset?.createdAt).toBeGreaterThan(0);
    expect(asset?.updatedAt).toBe(asset?.createdAt);

    // createdBy / updatedBy are driven by getActorFields(ctx).
    // For this test environment they might be undefined,
    // but they should be consistent with each other.
    expect(asset?.createdBy ?? null).toBe(asset?.updatedBy ?? null);
  });

  it("createAsset normalizes folderPath like folders do", async () => {
    const t = convexTest(schema, modules);

    const assetId = await t.mutation(api.assetManager.createAsset, {
      folderPath: "  kanban/backlog/  ",
      basename: "todo-1.json",
    });

    const asset = await t.query(api.assetManager.getAsset, {
      folderPath: "kanban/backlog",
      basename: "todo-1.json",
    });

    expect(asset?._id).toEqual(assetId);
    expect(asset?.folderPath).toBe("kanban/backlog");
    expect(asset?.basename).toBe("todo-1.json");
  });

  it("createAsset throws on duplicate (same folderPath + basename)", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.assetManager.createAsset, {
      folderPath: "",
      basename: "cover.jpg",
    });

    await expect(
      t.mutation(api.assetManager.createAsset, {
        folderPath: " / ", // different formatting, same normalized folderPath
        basename: "cover.jpg",
      }),
    ).rejects.toThrow(/already exists/i);
  });

  it("getAsset returns null when asset does not exist", async () => {
    const t = convexTest(schema, modules);

    const asset = await t.query(api.assetManager.getAsset, {
      folderPath: "",
      basename: "does-not-exist.txt",
    });

    expect(asset).toBeNull();
  });

  it("listAssets returns assets only for the given folderPath", async () => {
    const t = convexTest(schema, modules);

    // root assets
    await t.mutation(api.assetManager.createAsset, {
      folderPath: "",
      basename: "root-a.txt",
    });
    await t.mutation(api.assetManager.createAsset, {
      folderPath: "",
      basename: "root-b.txt",
    });

    // kanban/backlog assets
    await t.mutation(api.assetManager.createFolderByName, {
      parentPath: "",
      name: "Kanban",
    });
    await t.mutation(api.assetManager.createFolderByName, {
      parentPath: "kanban",
      name: "backlog",
    });

    await t.mutation(api.assetManager.createAsset, {
      folderPath: "kanban/backlog",
      basename: "card-1.json",
    });

    await t.mutation(api.assetManager.createAsset, {
      folderPath: "kanban/backlog",
      basename: "card-2.json",
    });

    // asset in another folder
    await t.mutation(api.assetManager.createAsset, {
      folderPath: "kanban",
      basename: "board-settings.json",
    });

    const rootAssets = await t.query(api.assetManager.listAssets, {
      folderPath: "",
    });
    const backlogAssets = await t.query(api.assetManager.listAssets, {
      folderPath: "kanban/backlog",
    });
    const kanbanAssets = await t.query(api.assetManager.listAssets, {
      folderPath: "kanban",
    });

    const rootNames = rootAssets.map((a) => a.basename).sort();
    const backlogNames = backlogAssets.map((a) => a.basename).sort();
    const kanbanNames = kanbanAssets.map((a) => a.basename).sort();

    expect(rootNames).toEqual(["root-a.txt", "root-b.txt"]);
    expect(backlogNames).toEqual(["card-1.json", "card-2.json"]);
    expect(kanbanNames).toEqual(["board-settings.json"]);

    // Spot-check createdBy/updatedBy exist on listed assets and are consistent.
    for (const asset of [...rootAssets, ...backlogAssets, ...kanbanAssets]) {
      expect(asset.createdAt).toBeGreaterThan(0);
      expect(asset.updatedAt).toBeGreaterThan(0);
      expect(asset.createdBy ?? null).toBe(asset.updatedBy ?? null);
    }
  });

  it("listAssets includes publishedVersionId when asset has a published version", async () => {
    const t = convexTest(schema, modules);

    // Create asset and commit a published version using commitVersion
    await t.mutation(api.assetManager.createAsset, {
      folderPath: "",
      basename: "test-with-version.txt",
    });

    // Commit a version with publish=true to set publishedVersionId
    const result = await t.mutation(api.assetManager.commitVersion, {
      folderPath: "",
      basename: "test-with-version.txt",
      publish: true,
      label: "v1",
    });

    // List assets and verify publishedVersionId is included
    const assets = await t.query(api.assetManager.listAssets, {
      folderPath: "",
    });

    expect(assets).toHaveLength(1);
    const asset = assets[0];
    expect(asset.basename).toBe("test-with-version.txt");

    // publishedVersionId should be present after a version is published
    expect(asset.publishedVersionId).toBeDefined();
    expect(asset.publishedVersionId).toBe(result.versionId);

    // draftVersionId may be undefined or not present since we published directly
    expect(asset.draftVersionId).toBeUndefined();
  });

  it("listAssets includes draftVersionId when asset has a draft version", async () => {
    const t = convexTest(schema, modules);

    // Create asset and commit a draft version
    await t.mutation(api.assetManager.createAsset, {
      folderPath: "",
      basename: "test-with-draft.txt",
    });

    // Commit a version with publish=false to set draftVersionId
    await t.mutation(api.assetManager.commitVersion, {
      folderPath: "",
      basename: "test-with-draft.txt",
      publish: false,
      label: "draft-v1",
    });

    // List assets and verify draftVersionId is included
    const assets = await t.query(api.assetManager.listAssets, {
      folderPath: "",
    });

    expect(assets).toHaveLength(1);
    const asset = assets[0];
    expect(asset.basename).toBe("test-with-draft.txt");

    // draftVersionId should be present after a draft is created
    expect(asset).toHaveProperty("draftVersionId");
    expect(asset.draftVersionId).toBeDefined();
  });
});

describe("getFolderWithAssets", () => {
  it("returns null for non-existent folder", async () => {
    const t = convexTest(schema, modules);

    const result = await t.query(api.assetManager.getFolderWithAssets, {
      path: "non-existent",
    });

    expect(result).toBeNull();
  });

  it("returns null for empty path when no root folder exists", async () => {
    const t = convexTest(schema, modules);

    const result = await t.query(api.assetManager.getFolderWithAssets, {
      path: "",
    });

    expect(result).toBeNull();
  });

  it("returns folder with empty assets array when folder exists but has no assets", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.assetManager.createFolderByPath, {
      path: "empty-folder",
    });

    const result = await t.query(api.assetManager.getFolderWithAssets, {
      path: "empty-folder",
    });

    expect(result).not.toBeNull();
    expect(result!.folder.path).toBe("empty-folder");
    expect(result!.folder.name).toBe("empty-folder");
    expect(result!.assets).toEqual([]);
  });

  it("returns folder with assets when both exist", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.assetManager.createFolderByPath, {
      path: "project/docs",
      name: "Documentation",
    });

    await t.mutation(api.assetManager.createAsset, {
      folderPath: "project/docs",
      basename: "readme.md",
      extra: { type: "markdown" },
    });

    await t.mutation(api.assetManager.createAsset, {
      folderPath: "project/docs",
      basename: "api.md",
      extra: { type: "api-docs" },
    });

    const result = await t.query(api.assetManager.getFolderWithAssets, {
      path: "project/docs",
    });

    expect(result).not.toBeNull();
    expect(result!.folder.path).toBe("project/docs");
    expect(result!.folder.name).toBe("Documentation");
    expect(result!.assets).toHaveLength(2);

    const assetNames = result!.assets.map((a) => a.basename).sort();
    expect(assetNames).toEqual(["api.md", "readme.md"]);

    // Check asset properties
    const readmeAsset = result!.assets.find((a) => a.basename === "readme.md");
    expect(readmeAsset).toBeDefined();
    expect(readmeAsset!.folderPath).toBe("project/docs");
    expect(readmeAsset!.extra).toEqual({ type: "markdown" });
    expect(readmeAsset!.versionCounter).toBe(0);
  });

  it("normalizes folder path correctly", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.assetManager.createFolderByPath, {
      path: "test/folder",
    });

    await t.mutation(api.assetManager.createAsset, {
      folderPath: "test/folder",
      basename: "file.txt",
    });

    // Test with trailing slash
    const result1 = await t.query(api.assetManager.getFolderWithAssets, {
      path: "test/folder/",
    });

    // Test with leading slash
    const result2 = await t.query(api.assetManager.getFolderWithAssets, {
      path: "/test/folder",
    });

    // Test with both
    const result3 = await t.query(api.assetManager.getFolderWithAssets, {
      path: "/test/folder/",
    });

    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
    expect(result3).not.toBeNull();

    expect(result1!.folder.path).toBe("test/folder");
    expect(result2!.folder.path).toBe("test/folder");
    expect(result3!.folder.path).toBe("test/folder");

    expect(result1!.assets).toHaveLength(1);
    expect(result2!.assets).toHaveLength(1);
    expect(result3!.assets).toHaveLength(1);
  });

  it("includes all required fields in folder and assets", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ tokenIdentifier: "user-1" });

    await asUser.mutation(api.assetManager.createFolderByPath, {
      path: "test-folder",
      extra: { description: "Test folder" },
    });

    await asUser.mutation(api.assetManager.createAsset, {
      folderPath: "test-folder",
      basename: "test-asset.txt",
      extra: { size: 1024 },
    });

    const result = await asUser.query(api.assetManager.getFolderWithAssets, {
      path: "test-folder",
    });

    expect(result).not.toBeNull();

    // Check folder fields
    const folder = result!.folder;
    expect(folder._id).toBeDefined();
    expect(folder.path).toBe("test-folder");
    expect(folder.name).toBe("test-folder");
    expect(folder.extra).toEqual({ description: "Test folder" });
    expect(folder.createdAt).toBeGreaterThan(0);
    expect(folder.updatedAt).toBeGreaterThan(0);
    expect(folder.createdBy).toBe("user-1");
    expect(folder.updatedBy).toBe("user-1");
    expect(folder._creationTime).toBeGreaterThan(0);

    // Check asset fields
    const asset = result!.assets[0];
    expect(asset._id).toBeDefined();
    expect(asset.folderPath).toBe("test-folder");
    expect(asset.basename).toBe("test-asset.txt");
    expect(asset.extra).toEqual({ size: 1024 });
    expect(asset.versionCounter).toBe(0);
    expect(asset.createdAt).toBeGreaterThan(0);
    expect(asset.updatedAt).toBeGreaterThan(0);
    expect(asset.createdBy).toBe("user-1");
    expect(asset.updatedBy).toBe("user-1");
    expect(asset._creationTime).toBeGreaterThan(0);
  });
});
