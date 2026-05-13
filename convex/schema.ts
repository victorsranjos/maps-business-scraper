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
        // Email scraping state
        emailScraped: v.optional(v.boolean()),     // true when scraper has tried this lead
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
        .index("by_city_niche", ["city", "niche"])
        .index("by_name_city_niche", ["name", "city", "niche"])
        .index("by_status", ["status"])
        .index("by_email_scraped", ["emailScraped"]),

    swipe_items: defineTable({
        title: v.string(),
        content: v.optional(v.string()),        // Copy, script, descrição
        category: v.union(                       // Coluna do kanban
            v.literal("COPY"),
            v.literal("SCRIPT"),
            v.literal("IMAGEM"),
            v.literal("EMAIL"),
            v.literal("ANUNCIO"),
            v.literal("OUTRO"),
        ),
        source: v.optional(v.string()),          // URL de origem / referência
        imageUrl: v.optional(v.string()),        // URL de imagem de referência
        tags: v.optional(v.array(v.string())),   // Tags livres
        createdAt: v.number(),
    })
        .index("by_category", ["category"])
        .index("by_created", ["createdAt"]),

    touchpoints: defineTable({
        leadId: v.id("leads"),          // Referência ao lead
        channel: v.union(               // Canal de contato
            v.literal("WHATSAPP"),
            v.literal("EMAIL"),
            v.literal("INSTAGRAM"),
            v.literal("TELEFONE"),
            v.literal("LINKEDIN"),
            v.literal("OUTRO"),
        ),
        direction: v.union(             // Sentido da comunicação
            v.literal("OUTBOUND"),      // Você enviou
            v.literal("INBOUND"),       // Lead respondeu
        ),
        status: v.union(
            v.literal("ENVIADO"),
            v.literal("RESPONDIDO"),
            v.literal("SEM_RESPOSTA"),
        ),
        message: v.optional(v.string()),  // Texto exato enviado/recebido
        notes: v.optional(v.string()),    // Anotações livres
        contactedAt: v.number(),          // Quando aconteceu
        createdAt: v.number(),
    })
        .index("by_lead", ["leadId"])
        .index("by_lead_contacted", ["leadId", "contactedAt"]),

    // ─── PROSPECTION MACHINE ─────────────────────────────────────────────────

    // Global app-level configuration (single document, key/value style)
    app_settings: defineTable({
        key: v.string(),    // e.g. "autoScrapeEmails", "sendDelaySeconds", "dailyCapPerAccount"
        value: v.string(),  // JSON-serialized value
    }).index("by_key", ["key"]),

    // Resend API accounts — each one has its own daily send counter
    resend_accounts: defineTable({
        label: v.string(),          // User-friendly name, e.g. "Conta Victor"
        apiKey: v.string(),         // Resend API key (stored as plain text — local app)
        fromEmail: v.string(),      // Verified sender e.g. "outreach@mydomain.com"
        fromName: v.optional(v.string()),   // Display name e.g. "Victor | Agência"
        dailyCap: v.number(),       // Max emails/day for this account (default 80)
        dailySentCount: v.number(), // Resets every 24h via cron
        dailyResetAt: v.number(),   // Timestamp of last reset (epoch ms)
        isActive: v.boolean(),      // Can be toggled off without deletion
        createdAt: v.number(),
    }).index("by_active", ["isActive"]),

    // Email campaigns
    campaigns: defineTable({
        name: v.string(),           // User-visible campaign name
        subject: v.string(),        // Email subject (supports {{nome}}, {{cidade}} tokens)
        body: v.string(),           // Email HTML body (supports tokens)
        // Target filters — undefined means "all"
        targetCity: v.optional(v.string()),
        targetNiche: v.optional(v.string()),
        targetStatus: v.optional(v.string()),   // Lead status filter
        // State machine
        status: v.union(
            v.literal("DRAFT"),
            v.literal("RUNNING"),
            v.literal("PAUSED"),
            v.literal("DONE"),
        ),
        // Progress counters (denormalized for fast display)
        totalTargeted: v.optional(v.number()),
        totalSent: v.optional(v.number()),
        totalFailed: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_status", ["status"])
        .index("by_created", ["createdAt"]),

    // Immutable audit log: one record per email send attempt
    campaign_sends: defineTable({
        campaignId: v.id("campaigns"),
        leadId: v.id("leads"),
        resendAccountId: v.id("resend_accounts"),
        toEmail: v.string(),
        status: v.union(
            v.literal("PENDING"),
            v.literal("SENT"),
            v.literal("FAILED"),
            v.literal("BOUNCED"),
        ),
        resendMessageId: v.optional(v.string()),   // Returned by Resend after successful send
        error: v.optional(v.string()),             // Error message on failure
        sentAt: v.optional(v.number()),
        createdAt: v.number(),
    })
        .index("by_campaign", ["campaignId"])
        .index("by_lead", ["leadId"])
        .index("by_campaign_lead", ["campaignId", "leadId"])   // Deduplication check
        .index("by_campaign_status", ["campaignId", "status"]),
});

