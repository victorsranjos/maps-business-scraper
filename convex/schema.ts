import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    leads: defineTable({
        name: v.string(),        // Nome do negócio
        niche: v.string(),       // Nicho (ex: Restaurante)
        city: v.string(),        // Cidade buscada
        // Campos extraídos opcionalmente
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        instagram: v.optional(v.string()),
        facebook: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        // Status de Gerenciamento CRM - Funil de Vendas
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

        searchSessionId: v.optional(v.string()), // ID da sessão/UUID do job de busca
        createdAt: v.number(),
    })
        // Adiciona índices para busca rápida por sessão, cidade ou nicho
        .index("by_session", ["searchSessionId"])
        .index("by_city_niche", ["city", "niche"]),
});
