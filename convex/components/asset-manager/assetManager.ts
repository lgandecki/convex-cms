import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { slugify } from "./slugify";
import { allocateFolderSegment } from "./allocateFolderSegment";

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

function splitParent(path: string): { parentPath: string; name: string } {
  const idx = path.lastIndexOf("/");
  if (idx === -1) {
    return { parentPath: ROOT_PARENT, name: path };
  }
  return {
    parentPath: path.slice(0, idx),
    name: path.slice(idx + 1) || path, // fallback
  };
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
    const now = Date.now();

    const id = await ctx.db.insert("folders", {
      path: newFolderPath,
      name: args.name ?? newFolderPath.split("/").pop()!,
      extra: args.extra,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

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
    let newFolderPath: string;
    if (normalizedParentPath === "") {
      newFolderPath = `${slugifiedName}`;
    } else {
      newFolderPath = `${normalizedParentPath}/${slugifiedName}`;
    }

    const existing = await ctx.db
      .query("folders")
      .withIndex("by_path", (q) => q.eq("path", newFolderPath))
      .first();

    if (existing && args.name !== existing.name) {
      const segment = await allocateFolderSegment(
        ctx,
        normalizedParentPath,
        slugifiedName,
      );
      newFolderPath = `${normalizedParentPath}/${segment}`;
    }

    const now = Date.now();

    const id = await ctx.db.insert("folders", {
      path: newFolderPath,
      name: args.name,
      extra: args.extra,
      createdAt: now,
      updatedAt: now,
    });

    return id;
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
    }),
  ),
  handler: async (ctx, args) => {
    const parentPath =
      args.parentPath === undefined
        ? ROOT_PARENT
        : normalizeFolderPath(args.parentPath);
    const parentPrefix = parentPath ? `${parentPath}/` : "";
    console.log("parentPrefix", parentPrefix);
    console.log("parentPath", parentPath);
    const end = `${parentPrefix}${SUFFIX}`;
    const candidates = await ctx.db
      .query("folders")
      .withIndex("by_path", (q) => q.gte("path", parentPath).lt("path", end)) //XXX parentPath should be parentPrefix, but need a failing test for that first
      .order("asc") // alphabetical by path
      .collect();
    console.log("candidates", candidates);
    return candidates.filter(
      (candidate) => depth(candidate.path) === depth(parentPrefix),
    );
  },
});
