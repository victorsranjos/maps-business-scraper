import { chromium } from 'playwright';
import { ConvexHttpClient } from 'convex/browser';
import { anyApi } from 'convex/server';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env.local') });

const convexUrl = process.env.CONVEX_URL || 'http://127.0.0.1:3210';
const convex = new ConvexHttpClient(convexUrl);
const api = anyApi;

// ─── Email extraction helpers ─────────────────────────────────────────────────

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

/** Common contact paths to check on a website */
const CONTACT_PATHS = ['/contato', '/contact', '/sobre', '/about', '/fale-conosco', '/atendimento'];

/** Blocked domains: social networks, CDNs, etc. that aren't real contact emails */
const BLOCKED_DOMAINS = [
    'wixpress.com', 'sentry.io', 'example.com', 'google.com',
    'facebook.com', 'instagram.com', 'twitter.com', 'shopify.com',
    'squarespace.com', 'wordpress.com', 'github.com', 'mailto',
];

function extractEmails(text: string): string[] {
    const matches = text.match(EMAIL_REGEX) ?? [];
    return [...new Set(matches)].filter((email) => {
        const domain = email.split('@')[1]?.toLowerCase() ?? '';
        return !BLOCKED_DOMAINS.some((b) => domain.includes(b));
    });
}

async function scrapeEmailFromWebsite(url: string): Promise<string | null> {
    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        });
        const page = await context.newPage();

        // Set a short timeout — we don't want to hang on slow sites
        page.setDefaultTimeout(12000);

        const baseUrl = new URL(url).origin;

        // ── 1. Scan homepage for mailto: links (fastest signal) ──────────────
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        } catch {
            // Some pages timeout or redirect strangely — still try to read content
        }

        const mailtoLinks = await page.$$eval('a[href^="mailto:"]', (els) =>
            els.map((el) => el.getAttribute('href')?.replace('mailto:', '').split('?')[0] ?? '')
        );
        const homepageEmails = extractEmails(mailtoLinks.join(' ') + ' ' + (await page.content()));
        if (homepageEmails.length > 0) return homepageEmails[0];

        // ── 2. Try common contact pages ───────────────────────────────────────
        for (const subpath of CONTACT_PATHS) {
            try {
                const contactUrl = baseUrl + subpath;
                await page.goto(contactUrl, { waitUntil: 'domcontentloaded', timeout: 8000 });
                const content = await page.content();
                const mailtoHrefs = await page.$$eval('a[href^="mailto:"]', (els) =>
                    els.map((el) => el.getAttribute('href')?.replace('mailto:', '').split('?')[0] ?? '')
                );
                const found = extractEmails(mailtoHrefs.join(' ') + ' ' + content);
                if (found.length > 0) return found[0];
            } catch {
                // Page doesn't exist — try next
            }
        }

        return null;
    } catch (err) {
        console.error(`[EmailScraper] Erro em ${url}:`, err);
        return null;
    } finally {
        await browser?.close();
    }
}

// ─── Main worker ──────────────────────────────────────────────────────────────

export interface ScrapeEmailsOptions {
    city?: string;
    niche?: string;
    limit?: number;
    /** Milliseconds to wait between each website visit (default: 1500) */
    delayMs?: number;
}

export async function scrapeEmailsForLeads(options: ScrapeEmailsOptions = {}) {
    const { city, niche, limit = 200, delayMs = 1500 } = options;

    console.log(`[EmailScraper] Iniciando busca de emails (city=${city}, niche=${niche}, limit=${limit})...`);

    // Fetch unscraped leads with websites from Convex
    const leads = await convex.query(api.business.getLeadsWithWebsite, {
        city,
        niche,
        limit,
    }) as Array<{ _id: string; name: string; website?: string }>;

    console.log(`[EmailScraper] ${leads.length} leads com website para processar.`);

    let found = 0;
    let tried = 0;

    for (const lead of leads) {
        if (!lead.website) continue;

        console.log(`[EmailScraper] (${tried + 1}/${leads.length}) Verificando: ${lead.name} — ${lead.website}`);

        const email = await scrapeEmailFromWebsite(lead.website);

        // Update Convex regardless (marks emailScraped = true)
        await convex.mutation(api.business.updateLeadEmail, {
            leadId: lead._id,
            ...(email ? { email } : {}),
        });

        if (email) {
            console.log(`[EmailScraper] ✅ Email encontrado: ${email} (${lead.name})`);
            found++;
        } else {
            console.log(`[EmailScraper] ⚠️  Nenhum email em ${lead.website}`);
        }

        tried++;

        // Rate limiting — avoid hammering servers
        if (tried < leads.length) {
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }

    console.log(`[EmailScraper] Concluído: ${found} emails encontrados de ${tried} sites.`);
    return { tried, found };
}
