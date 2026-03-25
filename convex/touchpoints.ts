import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const CHANNEL_VALUES = v.union(
    v.literal("WHATSAPP"),
    v.literal("EMAIL"),
    v.literal("INSTAGRAM"),
    v.literal("TELEFONE"),
    v.literal("LINKEDIN"),
    v.literal("OUTRO"),
);

const DIRECTION_VALUES = v.union(
    v.literal("OUTBOUND"),
    v.literal("INBOUND"),
);

const STATUS_VALUES = v.union(
    v.literal("ENVIADO"),
    v.literal("RESPONDIDO"),
    v.literal("SEM_RESPOSTA"),
);

// Busca todos os touchpoints de um lead, do mais recente para o mais antigo
export const getByLead = query({
    args: { leadId: v.id("leads") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("touchpoints")
            .withIndex("by_lead_contacted", (q) => q.eq("leadId", args.leadId))
            .order("desc")
            .collect();
    },
});

// Registra um novo touchpoint
export const add = mutation({
    args: {
        leadId: v.id("leads"),
        channel: CHANNEL_VALUES,
        direction: DIRECTION_VALUES,
        status: STATUS_VALUES,
        message: v.optional(v.string()),
        notes: v.optional(v.string()),
        contactedAt: v.number(), // timestamp (ms) do momento do contato
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("touchpoints", {
            ...args,
            createdAt: Date.now(),
        });
    },
});

// Atualiza um touchpoint existente (ex: mudar status de ENVIADO para RESPONDIDO)
export const update = mutation({
    args: {
        touchpointId: v.id("touchpoints"),
        status: v.optional(STATUS_VALUES),
        message: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { touchpointId, ...patch } = args;
        // Remove campos undefined para não sobrescrever com null
        const cleanPatch = Object.fromEntries(
            Object.entries(patch).filter(([, v]) => v !== undefined)
        );
        await ctx.db.patch(touchpointId, cleanPatch);
    },
});

// Remove um touchpoint
export const remove = mutation({
    args: { touchpointId: v.id("touchpoints") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.touchpointId);
    },
});
