import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── READ ─────────────────────────────────────────────────────────────────────

export const listAccounts = query({
    handler: async (ctx) => {
        return await ctx.db.query("resend_accounts").order("asc").collect();
    },
});

// Returns the active account with the most capacity remaining that is still
// under its daily cap. Implements round-robin by picking lowest dailySentCount.
// Returns null if no account has capacity.
export const getNextAvailableAccount = query({
    handler: async (ctx) => {
        const accounts = await ctx.db
            .query("resend_accounts")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .collect();

        const eligible = accounts.filter((a) => a.dailySentCount < a.dailyCap);
        if (eligible.length === 0) return null;

        // Pick the one with the fewest sends today (most capacity left)
        return eligible.sort((a, b) => a.dailySentCount - b.dailySentCount)[0];
    },
});

// ─── WRITE ────────────────────────────────────────────────────────────────────

export const addAccount = mutation({
    args: {
        label: v.string(),
        apiKey: v.string(),
        fromEmail: v.string(),
        fromName: v.optional(v.string()),
        dailyCap: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("resend_accounts", {
            label: args.label,
            apiKey: args.apiKey,
            fromEmail: args.fromEmail,
            fromName: args.fromName,
            dailyCap: args.dailyCap ?? 80,
            dailySentCount: 0,
            dailyResetAt: Date.now(),
            isActive: true,
            createdAt: Date.now(),
        });
    },
});

export const updateAccount = mutation({
    args: {
        id: v.id("resend_accounts"),
        label: v.optional(v.string()),
        fromName: v.optional(v.string()),
        dailyCap: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, ...patch } = args;
        const filtered = Object.fromEntries(
            Object.entries(patch).filter(([, v]) => v !== undefined)
        );
        await ctx.db.patch(id, filtered);
    },
});

export const removeAccount = mutation({
    args: { id: v.id("resend_accounts") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// Called by the mailer orchestrator after each successful/failed send
export const incrementSendCount = mutation({
    args: { id: v.id("resend_accounts") },
    handler: async (ctx, args) => {
        const account = await ctx.db.get(args.id);
        if (!account) return;
        await ctx.db.patch(args.id, {
            dailySentCount: account.dailySentCount + 1,
        });
    },
});

// Called by the nightly node-cron job to reset all counters
export const resetAllDailyCounts = mutation({
    handler: async (ctx) => {
        const accounts = await ctx.db.query("resend_accounts").collect();
        const now = Date.now();
        for (const account of accounts) {
            await ctx.db.patch(account._id, {
                dailySentCount: 0,
                dailyResetAt: now,
            });
        }
        return { reset: accounts.length };
    },
});
