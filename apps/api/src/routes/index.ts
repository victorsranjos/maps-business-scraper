import { FastifyPluginAsync } from 'fastify';
import { startCrawler } from '../scraper/index.js';

const scrapePlugin: FastifyPluginAsync = async (app) => {
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
};

export default scrapePlugin;
