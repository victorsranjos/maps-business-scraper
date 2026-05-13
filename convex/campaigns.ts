import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

// Default values for app settings
const DEFAULTS: Record<string, string> = {
    autoScrapeEmails: "true",
    sendDelaySeconds: "30",
    dailyCapPerAccount: "80",
};

export const getSetting = query({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        const doc = await ctx.db
            .query("app_settings")
            .withIndex("by_key", (q) => q.eq("key", args.key))
            .first();
        return doc?.value ?? DEFAULTS[args.key] ?? null;
    },
});

export const getAllSettings = query({
    handler: async (ctx) => {
        const docs = await ctx.db.query("app_settings").collect();
        const map: Record<string, string> = { ...DEFAULTS };
        for (const doc of docs) {
            map[doc.key] = doc.value;
        }
        return map;
    },
});

export const setSetting = mutation({
    args: { key: v.string(), value: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("app_settings")
            .withIndex("by_key", (q) => q.eq("key", args.key))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, { value: args.value });
        } else {
            await ctx.db.insert("app_settings", { key: args.key, value: args.value });
        }
    },
});

// ─── CAMPAIGNS ────────────────────────────────────────────────────────────────

export const listCampaigns = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("campaigns")
            .withIndex("by_created")
            .order("desc")
            .collect();
    },
});

export const getCampaign = query({
    args: { id: v.id("campaigns") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getCampaignSends = query({
    args: { campaignId: v.id("campaigns") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("campaign_sends")
            .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
            .collect();
    },
});

export const getCampaignProgress = query({
    args: { campaignId: v.id("campaigns") },
    handler: async (ctx, args) => {
        const sends = await ctx.db
            .query("campaign_sends")
            .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
            .collect();

        const total = sends.length;
        const sent = sends.filter((s) => s.status === "SENT").length;
        const failed = sends.filter((s) => s.status === "FAILED").length;
        const pending = sends.filter((s) => s.status === "PENDING").length;

        return { total, sent, failed, pending };
    },
});

export const createCampaign = mutation({
    args: {
        name: v.string(),
        subject: v.string(),
        body: v.string(),
        targetCity: v.optional(v.string()),
        targetNiche: v.optional(v.string()),
        targetStatus: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert("campaigns", {
            ...args,
            status: "DRAFT",
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const updateCampaign = mutation({
    args: {
        id: v.id("campaigns"),
        name: v.optional(v.string()),
        subject: v.optional(v.string()),
        body: v.optional(v.string()),
        targetCity: v.optional(v.string()),
        targetNiche: v.optional(v.string()),
        targetStatus: v.optional(v.string()),
        status: v.optional(v.union(
            v.literal("DRAFT"),
            v.literal("RUNNING"),
            v.literal("PAUSED"),
            v.literal("DONE"),
        )),
        totalTargeted: v.optional(v.number()),
        totalSent: v.optional(v.number()),
        totalFailed: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...patch } = args;
        const filtered = Object.fromEntries(
            Object.entries(patch).filter(([, v]) => v !== undefined)
        );
        await ctx.db.patch(id, { ...filtered, updatedAt: Date.now() });
    },
});

export const deleteCampaign = mutation({
    args: { id: v.id("campaigns") },
    handler: async (ctx, args) => {
        // Also delete all related sends
        const sends = await ctx.db
            .query("campaign_sends")
            .withIndex("by_campaign", (q) => q.eq("campaignId", args.id))
            .collect();
        for (const send of sends) {
            await ctx.db.delete(send._id);
        }
        await ctx.db.delete(args.id);
    },
});

// ─── CAMPAIGN SENDS ───────────────────────────────────────────────────────────

// Creates a PENDING send record and returns its ID
export const createSendRecord = mutation({
    args: {
        campaignId: v.id("campaigns"),
        leadId: v.id("leads"),
        resendAccountId: v.id("resend_accounts"),
        toEmail: v.string(),
    },
    handler: async (ctx, args) => {
        // Idempotency: don't create duplicate send records for the same campaign+lead
        const existing = await ctx.db
            .query("campaign_sends")
            .withIndex("by_campaign_lead", (q) =>
                q.eq("campaignId", args.campaignId).eq("leadId", args.leadId)
            )
            .first();
        if (existing) return existing._id;

        return await ctx.db.insert("campaign_sends", {
            ...args,
            status: "PENDING",
            createdAt: Date.now(),
        });
    },
});

export const updateSendStatus = mutation({
    args: {
        id: v.id("campaign_sends"),
        status: v.union(
            v.literal("SENT"),
            v.literal("FAILED"),
            v.literal("BOUNCED"),
        ),
        resendMessageId: v.optional(v.string()),
        error: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...patch } = args;
        await ctx.db.patch(id, {
            ...patch,
            sentAt: Date.now(),
        });
    },
});
