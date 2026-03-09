import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { anyApi } from "convex/server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

async function test() {
    try {
        const api = anyApi as any;
        console.log("Fetching all leads...");
        const all = await client.query(api.business.getAllLeads);
        console.log(`Found ${all.length} leads in DB`);
        if (all.length > 0) {
            console.log("Sample lead:", all[0]);
        }

        console.log("Fetching by search (empty)...");
        const emptySearch = await client.query(api.business.getLeads, {});
        console.log(`Found ${emptySearch.length} leads from getLeads`);

    } catch (e) {
        console.error("Error:", e);
    }
}
test();
