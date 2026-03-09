import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
// Import will fail because routes don't exist yet
import scrapeRoutes from './index.js';

describe('Scrape Routes POST /api/scrape', () => {
    const app = Fastify();

    beforeAll(async () => {
        await app.register(scrapeRoutes);
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should return 202 Accepted and start the job for a valid request', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/scrape',
            payload: {
                city: 'São Paulo',
                niche: 'Restaurantes',
            },
        });

        expect(response.statusCode).toBe(202);
        expect(response.json()).toHaveProperty('message');
    });

    it('should return 400 Bad Request if city or niche are missing', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/scrape',
            payload: {
                city: 'São Paulo', // Missing niche
            },
        });

        expect(response.statusCode).toBe(400);
    });
});
