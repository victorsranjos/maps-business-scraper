import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const CATEGORIES = ["COPY", "SCRIPT", "IMAGEM", "EMAIL", "ANUNCIO", "OUTRO"] as const;

export const listByCategory = query({
    args: {
        category: v.union(
            v.literal("COPY"),
            v.literal("SCRIPT"),
            v.literal("IMAGEM"),
            v.literal("EMAIL"),
            v.literal("ANUNCIO"),
            v.literal("OUTRO"),
        ),
    },
    handler: async (ctx, { category }) => {
        return ctx.db
            .query("swipe_items")
            .withIndex("by_category", (q) => q.eq("category", category))
            .order("desc")
            .collect();
    },
});

export const listAll = query({
    args: {},
    handler: async (ctx) => {
        return ctx.db
            .query("swipe_items")
            .withIndex("by_created")
            .order("desc")
            .collect();
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        content: v.optional(v.string()),
        category: v.union(
            v.literal("COPY"),
            v.literal("SCRIPT"),
            v.literal("IMAGEM"),
            v.literal("EMAIL"),
            v.literal("ANUNCIO"),
            v.literal("OUTRO"),
        ),
        source: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        return ctx.db.insert("swipe_items", {
            ...args,
            createdAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("swipe_items") },
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
    },
});

export const update = mutation({
    args: {
        id: v.id("swipe_items"),
        title: v.optional(v.string()),
        content: v.optional(v.string()),
        category: v.optional(v.union(
            v.literal("COPY"),
            v.literal("SCRIPT"),
            v.literal("IMAGEM"),
            v.literal("EMAIL"),
            v.literal("ANUNCIO"),
            v.literal("OUTRO"),
        )),
        source: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
    },
    handler: async (ctx, { id, ...rest }) => {
        await ctx.db.patch(id, rest);
    },
});
