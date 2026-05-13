import { FastifyPluginAsync } from 'fastify';
import { startCrawler } from '../scraper/index.js';
import { scrapeEmailsForLeads } from '../scraper/emailScraper.js';
import { runCampaign } from '../mailer/orchestrator.js';
import { convex, api } from '../db/campaigns.js';

const routes: FastifyPluginAsync = async (app) => {

    // ── Existing: start Maps scraper ─────────────────────────────────────────
    app.post('/api/scrape', async (request, reply) => {
        const body = request.body as { city?: string; niche?: string; limit?: number; apiKey?: string };

        if (!body || !body.city || !body.niche) {
            return reply.code(400).send({ error: "Missing 'city' or 'niche' in request body." });
        }

        const limit = body.limit && body.limit > 0 ? body.limit : 20;

        // Start background scraper job (non-blocking)
        startCrawler(body.city, body.niche, limit, body.apiKey).catch(console.error);

        return reply.code(202).send({ message: "Job accepted and started." });
    });

    // ── NEW: manually trigger email scraping for a set of leads ─────────────
    app.post('/api/scrape-emails', async (request, reply) => {
        const body = request.body as { city?: string; niche?: string; limit?: number } | undefined;

        // Fire-and-forget
        scrapeEmailsForLeads({
            city: body?.city,
            niche: body?.niche,
            limit: body?.limit ?? 200,
        }).catch(console.error);

        return reply.code(202).send({ message: "Email scraping job accepted and started." });
    });

    // ── NEW: start sending a campaign (fire-and-forget background job) ───────
    app.post<{ Params: { id: string } }>('/api/campaigns/:id/send', async (request, reply) => {
        const { id } = request.params;
        if (!id) return reply.code(400).send({ error: 'Missing campaign id.' });

        // Check campaign exists before accepting
        const campaign = await convex.query(api.campaigns.getCampaign, { id });
        if (!campaign) return reply.code(404).send({ error: 'Campaign not found.' });
        if (campaign.status === 'RUNNING') {
            return reply.code(409).send({ error: 'Campaign is already running.' });
        }

        // Fire-and-forget in background
        runCampaign({ campaignId: id }).catch(console.error);

        return reply.code(202).send({ message: `Campaign ${id} send job accepted.` });
    });

    // ── NEW: pause a running campaign ────────────────────────────────────────
    app.post<{ Params: { id: string } }>('/api/campaigns/:id/pause', async (request, reply) => {
        const { id } = request.params;
        await convex.mutation(api.campaigns.updateCampaign, { id, status: 'PAUSED' });
        return reply.send({ message: `Campaign ${id} paused.` });
    });

    // ── NEW: get campaign send progress ──────────────────────────────────────
    app.get<{ Params: { id: string } }>('/api/campaigns/:id/progress', async (request, reply) => {
        const { id } = request.params;
        const progress = await convex.query(api.campaigns.getCampaignProgress, { id });
        return reply.send(progress);
    });
};

export default routes;
