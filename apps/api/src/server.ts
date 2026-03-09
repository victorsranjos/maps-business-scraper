import Fastify from 'fastify';
import cors from '@fastify/cors';
import scratchRoutes from './routes/index.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Trigger reload for local convex
