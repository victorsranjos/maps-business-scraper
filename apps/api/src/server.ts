import Fastify from 'fastify';
import cors from '@fastify/cors';
import scratchRoutes from './routes/index.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import { resetAllDailyCounts } from './db/campaigns.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const server = Fastify({
    logger: true
});

server.register(cors, {
    origin: '*' // Para aceitar do React dev server
});

server.register(scratchRoutes);

const port = process.env.API_PORT ? parseInt(process.env.API_PORT) : 3001;

server.listen({ port, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`🚀 MAPS SCRAPER BACKEND listening at ${address}`);
});

// ─── Nightly cron: reset daily send counters at midnight ─────────────────────
cron.schedule('0 0 * * *', async () => {
    try {
        const result = await resetAllDailyCounts();
        console.log(`[Cron] Daily send counters reset for ${result.reset} Resend accounts.`);
    } catch (e) {
        console.error('[Cron] Failed to reset daily send counters:', e);
    }
}, { timezone: 'America/Sao_Paulo' });
