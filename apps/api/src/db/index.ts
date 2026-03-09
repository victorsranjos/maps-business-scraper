import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env.local') });

// Inicia o cliente node do Convex usando a variável que ele injetou no arquivo
const convexUrl = process.env.CONVEX_URL || "http://127.0.0.1:3210";
const convex = new ConvexHttpClient(convexUrl);
const api = anyApi;

export interface SaveLeadParams {
    name: string;
    niche: string;
    city: string;
    email?: string;
    phone?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    searchSessionId?: string;
}

export async function saveLead(data: SaveLeadParams) {
    console.log("[Convex DB DBG] Salvando lead remotamente:", data.name);
    try {
        await convex.mutation(api.business.saveLead, data);
        console.log(`[🎯 Banco de dados] Lead (${data.name}) sincronizado no painel ui.`);
        return true;
    } catch (e) {
        console.error("Falha violenta ao salvar no Convex:", e);
        return false;
    }
}
