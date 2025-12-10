import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  folders: defineTable({
    path: v.string(),
    name: v.string(),
    extra: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_path", ["path"]),
});

export default schema;
