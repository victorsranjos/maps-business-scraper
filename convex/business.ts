import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query genérica para a aba "Meus Leads Salvos" trazer toda a base CRM
export const getAllLeads = query({
    handler: async (ctx) => {
        return await ctx.db.query("leads").order("desc").take(1000);
    },
});

// Query para o Frontend (React) listar os Leads baseados em Cidade e Nicho
export const getLeads = query({
    args: {
        city: v.optional(v.string()),
        niche: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        // Se ambos cidade e nicho são providos, usa o índice específico
        if (args.city && args.niche) {
            return await ctx.db
                .query("leads")
                .withIndex("by_city_niche", (q) => q.eq("city", args.city!).eq("niche", args.niche!))
                .order("desc")
                .take(100);
        }

        // Sem filtros, busca os 50 mais recentes
        return await ctx.db.query("leads").order("desc").take(50);
    },
});

// Mutation p/ o Node.js Backend (Playwright Crawler) inserir um lead achado
export const saveLead = mutation({
    args: {
        name: v.string(),
        niche: v.string(),
        city: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        instagram: v.optional(v.string()),
        facebook: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        searchSessionId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const leadId = await ctx.db.insert("leads", {
            ...args,
            status: "NOVO", // Inicia sempre como lead novo
            createdAt: Date.now(),
        });
        return leadId;
    },
});

// CRM Mutation p/ alterar o status do Lead no funil de vendas
export const updateLeadStatus = mutation({
    args: {
        leadId: v.id("leads"),
        status: v.union(
            v.literal("NOVO"),
            v.literal("CONTATADO"),
            v.literal("EM_NUTRICAO"),
            v.literal("RESPOSTA_RECEBIDA"),
            v.literal("REUNIAO_AGENDADA"),
            v.literal("PROPOSTA_ENVIADA"),
            v.literal("NEGOCIACAO"),
            v.literal("CLIENTE_GANHO"),
            v.literal("CLIENTE_PERDIDO"),
            v.literal("DESCARTADO")
        ),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.leadId, { status: args.status });
    },
});
