/**
 * Book-Specific Queries
 *
 * These queries provide book-domain abstractions on top of the asset-manager component.
 * They handle the folder structure conventions and return typed data for UI components.
 *
 * Folder Structure:
 *   books/
 *     {book-slug}/                   <- Book folder with BookFolderExtra
 *       characters/
 *         {character-slug}/          <- Character folder with CharacterFolderExtra
 *           avatar.png
 *           speaks.mp4
 *           listens.mp4
 *       chapters/
 *         chapter-1.xml              <- Asset with ChapterExtra in version.extra
 *       backgrounds/
 *         ch1-p0.mp4                 <- Asset with BackgroundExtra
 *       music/
 *         scene1.mp3                 <- Asset with MusicExtra
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { components } from "./_generated/api";

// =============================================================================
// Book Queries
// =============================================================================

/**
 * List all books (folders under "books/").
 * Returns book metadata from folder.extra.
 */
export const listBooks = query({
  args: {},
  handler: async (ctx) => {
    const folders = await ctx.runQuery(
      components.assetManager.assetManager.listFolders,
      { parentPath: "books" }
    );

    return folders.map((folder) => ({
      path: folder.path,
      slug: folder.path.split("/").pop()!,
      name: folder.name,
      extra: folder.extra,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    }));
  },
});

/**
 * Get metadata for a specific book.
 */
export const getBookMetadata = query({
  args: {
    bookPath: v.string(),
  },
  handler: async (ctx, { bookPath }) => {
    const folder = await ctx.runQuery(
      components.assetManager.assetManager.getFolder,
      { path: bookPath }
    );

    if (!folder) return null;

    return {
      path: folder.path,
      slug: folder.path.split("/").pop()!,
      name: folder.name,
      extra: folder.extra,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  },
});

// =============================================================================
// Character Queries
// =============================================================================

/**
 * List all characters for a book.
 * Returns character folders with their metadata.
 */
export const listCharacters = query({
  args: {
    bookPath: v.string(),
  },
  handler: async (ctx, { bookPath }) => {
    const charactersPath = `${bookPath}/characters`;

    const folders = await ctx.runQuery(
      components.assetManager.assetManager.listFolders,
      { parentPath: charactersPath }
    );

    return folders.map((folder) => ({
      path: folder.path,
      slug: folder.path.split("/").pop()!,
      name: folder.name,
      extra: folder.extra,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    }));
  },
});

/**
 * Get a character bundle (metadata + all asset URLs).
 * Returns the character's folder.extra plus URLs for avatar, speaks, listens.
 */
export const getCharacterBundle = query({
  args: {
    characterPath: v.string(),
  },
  handler: async (ctx, { characterPath }) => {
    // Get character folder metadata
    const folder = await ctx.runQuery(
      components.assetManager.assetManager.getFolder,
      { path: characterPath }
    );

    if (!folder) return null;

    // Get published files in the character folder
    const files = await ctx.runQuery(
      components.assetManager.assetManager.listPublishedFilesInFolder,
      { folderPath: characterPath }
    );

    // Build bundle with typed asset references
    const bundle: {
      path: string;
      slug: string;
      name: string;
      extra: unknown;
      avatar?: { url: string; versionId: string; contentType?: string };
      speaks?: { url: string; versionId: string; contentType?: string };
      listens?: { url: string; versionId: string; contentType?: string };
    } = {
      path: folder.path,
      slug: folder.path.split("/").pop()!,
      name: folder.name,
      extra: folder.extra,
    };

    // Match assets to bundle slots
    for (const file of files) {
      const basename = file.basename.toLowerCase();
      const assetInfo = {
        url: file.url,
        versionId: file.versionId as string,
        contentType: file.contentType,
      };

      if (basename.startsWith("avatar.")) {
        bundle.avatar = assetInfo;
      } else if (basename.startsWith("speaks.")) {
        bundle.speaks = assetInfo;
      } else if (basename.startsWith("listens.")) {
        bundle.listens = assetInfo;
      }
    }

    return bundle;
  },
});

// =============================================================================
// Chapter Queries
// =============================================================================

/**
 * List all chapters for a book, sorted by chapter number.
 * Chapter number comes from version.extra.chapterNumber.
 */
export const listChapters = query({
  args: {
    bookPath: v.string(),
  },
  handler: async (ctx, { bookPath }) => {
    const chaptersPath = `${bookPath}/chapters`;

    const files = await ctx.runQuery(
      components.assetManager.assetManager.listPublishedFilesInFolder,
      { folderPath: chaptersPath }
    );

    // We need the version.extra for chapter metadata
    // listPublishedFilesInFolder doesn't return extra, so we need to use listPublishedAssetsInFolder
    const assets = await ctx.runQuery(
      components.assetManager.assetManager.listPublishedAssetsInFolder,
      { folderPath: chaptersPath }
    );

    // Join files with assets to get both URLs and extra
    const chapters = files.map((file) => {
      const asset = assets.find((a) => a.basename === file.basename);
      return {
        path: `${chaptersPath}/${file.basename}`,
        basename: file.basename,
        url: file.url,
        versionId: file.versionId as string,
        contentType: file.contentType,
        size: file.size,
        publishedAt: file.publishedAt,
        extra: asset?.extra,
        // Extract chapter number for sorting
        chapterNumber: (asset?.extra as { chapterNumber?: number })?.chapterNumber ?? 0,
        title: (asset?.extra as { title?: string })?.title,
      };
    });

    // Sort by chapter number
    return chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
  },
});

// =============================================================================
// Background Queries
// =============================================================================

/**
 * List all backgrounds for a book.
 * Sorted by chapter, then paragraph.
 */
export const listBackgrounds = query({
  args: {
    bookPath: v.string(),
  },
  handler: async (ctx, { bookPath }) => {
    const backgroundsPath = `${bookPath}/backgrounds`;

    const files = await ctx.runQuery(
      components.assetManager.assetManager.listPublishedFilesInFolder,
      { folderPath: backgroundsPath }
    );

    const assets = await ctx.runQuery(
      components.assetManager.assetManager.listPublishedAssetsInFolder,
      { folderPath: backgroundsPath }
    );

    const backgrounds = files.map((file) => {
      const asset = assets.find((a) => a.basename === file.basename);
      const extra = asset?.extra as {
        chapter?: number;
        paragraph?: number;
        backgroundColor?: string;
        textColor?: string;
      } | undefined;

      return {
        path: `${backgroundsPath}/${file.basename}`,
        basename: file.basename,
        url: file.url,
        versionId: file.versionId as string,
        contentType: file.contentType,
        size: file.size,
        publishedAt: file.publishedAt,
        extra: asset?.extra,
        // Extract for sorting
        chapter: extra?.chapter ?? 0,
        paragraph: extra?.paragraph ?? 0,
        backgroundColor: extra?.backgroundColor,
        textColor: extra?.textColor,
      };
    });

    // Sort by chapter, then paragraph
    return backgrounds.sort((a, b) => {
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return a.paragraph - b.paragraph;
    });
  },
});

// =============================================================================
// Music Queries
// =============================================================================

/**
 * List all music tracks for a book.
 * Sorted by chapter, then paragraph.
 */
export const listMusic = query({
  args: {
    bookPath: v.string(),
  },
  handler: async (ctx, { bookPath }) => {
    const musicPath = `${bookPath}/music`;

    const files = await ctx.runQuery(
      components.assetManager.assetManager.listPublishedFilesInFolder,
      { folderPath: musicPath }
    );

    const assets = await ctx.runQuery(
      components.assetManager.assetManager.listPublishedAssetsInFolder,
      { folderPath: musicPath }
    );

    const music = files.map((file) => {
      const asset = assets.find((a) => a.basename === file.basename);
      const extra = asset?.extra as {
        chapter?: number;
        paragraph?: number;
      } | undefined;

      return {
        path: `${musicPath}/${file.basename}`,
        basename: file.basename,
        url: file.url,
        versionId: file.versionId as string,
        contentType: file.contentType,
        size: file.size,
        publishedAt: file.publishedAt,
        extra: asset?.extra,
        // Extract for sorting
        chapter: extra?.chapter ?? 0,
        paragraph: extra?.paragraph ?? 0,
      };
    });

    // Sort by chapter, then paragraph
    return music.sort((a, b) => {
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return a.paragraph - b.paragraph;
    });
  },
});

// =============================================================================
// Book Stats Query (for dashboard)
// =============================================================================

/**
 * Get summary stats for a book (character count, chapter count, etc.)
 */
export const getBookStats = query({
  args: {
    bookPath: v.string(),
  },
  handler: async (ctx, { bookPath }) => {
    // Count characters
    const characterFolders = await ctx.runQuery(
      components.assetManager.assetManager.listFolders,
      { parentPath: `${bookPath}/characters` }
    );

    // Count chapters
    const chapterAssets = await ctx.runQuery(
      components.assetManager.assetManager.listAssets,
      { folderPath: `${bookPath}/chapters` }
    );

    // Count backgrounds
    const backgroundAssets = await ctx.runQuery(
      components.assetManager.assetManager.listAssets,
      { folderPath: `${bookPath}/backgrounds` }
    );

    // Count music
    const musicAssets = await ctx.runQuery(
      components.assetManager.assetManager.listAssets,
      { folderPath: `${bookPath}/music` }
    );

    return {
      characterCount: characterFolders.length,
      chapterCount: chapterAssets.length,
      backgroundCount: backgroundAssets.length,
      musicCount: musicAssets.length,
    };
  },
});
