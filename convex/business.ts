import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

// Query paginada + filtrada para a aba "Meus Leads Salvos"
// Filtros server-side via índice: cidade e nicho. Status e busca por nome são filtrados client-side após paginar.
export const getLeadsFiltered = query({
    args: {
        paginationOpts: paginationOptsValidator,
        city: v.optional(v.string()),
        niche: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { city, niche } = args;

        // Usa índice composto quando ambos os filtros estão presentes
        if (city && niche) {
            return await ctx.db
                .query("leads")
                .withIndex("by_city_niche", (q) => q.eq("city", city).eq("niche", niche))
                .order("desc")
                .paginate(args.paginationOpts);
        }

        // Apenas cidade
        if (city) {
            return await ctx.db
                .query("leads")
                .withIndex("by_city_niche", (q) => q.eq("city", city))
                .order("desc")
                .paginate(args.paginationOpts);
        }

        // Sem filtros por índice: retorna todos paginados
        return await ctx.db
            .query("leads")
            .order("desc")
            .paginate(args.paginationOpts);
    },
});

// Query para buscar cidades, nichos únicos e total de leads (para popular os dropdowns e o contador)
export const getLeadsMeta = query({
    handler: async (ctx) => {
        // Executa duas queries em paralelo para mínima latência
        const [allLeads, sampleLeads] = await Promise.all([
            // Conta todos os leads (sem limite) para o total real
            ctx.db.query("leads").collect(),
            // Amostra para extrair cidades/nichos únicos (4000 suficiente para dropdowns)
            ctx.db.query("leads").order("desc").take(4000),
        ]);
        const total = allLeads.length;
        const cities = Array.from(new Set(sampleLeads.map(l => l.city))).sort();
        const niches = Array.from(new Set(sampleLeads.map(l => l.niche))).sort();
        return { total, cities, niches };
    },
});

// Query para o Pipeline Kanban — carrega leads de uma coluna (status) específico via índice
export const getLeadsByStatus = query({
    args: {
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
        return await ctx.db
            .query("leads")
            .withIndex("by_status", (q) => q.eq("status", args.status))
            .order("desc")
            .take(200);
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

// Mutation p/ o Node.js Backend inserir um lead achado — com proteção contra duplicatas
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
        // Duplicate check: same name + city + niche
        const existing = await ctx.db
            .query("leads")
            .withIndex("by_name_city_niche", (q) =>
                q.eq("name", args.name).eq("city", args.city).eq("niche", args.niche)
            )
            .first();

        if (existing) {
            // Already exists — skip silently and return the existing id
            return existing._id;
        }

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

