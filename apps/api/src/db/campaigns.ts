import { ConvexHttpClient } from 'convex/browser';
import { anyApi } from 'convex/server';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env.local') });

const convexUrl = process.env.CONVEX_URL || 'http://127.0.0.1:3210';
export const convex = new ConvexHttpClient(convexUrl);
export const api = anyApi;

// ─── Type helpers (mirrors Convex schema) ────────────────────────────────────

export interface ResendAccount {
    _id: string;
    label: string;
    apiKey: string;
    fromEmail: string;
    fromName?: string;
    dailyCap: number;
    dailySentCount: number;
    isActive: boolean;
}

export interface Campaign {
    _id: string;
    name: string;
    subject: string;
    body: string;
    targetCity?: string;
    targetNiche?: string;
    targetStatus?: string;
    status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'DONE';
    totalTargeted?: number;
    totalSent?: number;
    totalFailed?: number;
}

export interface LeadWithEmail {
    _id: string;
    name: string;
    email: string;
    city: string;
    niche: string;
    status: string;
    website?: string;
}

// ─── Exported helpers ─────────────────────────────────────────────────────────

export async function getCampaign(id: string): Promise<Campaign | null> {
    return await convex.query(api.campaigns.getCampaign, { id });
}

export async function getLeadsForCampaign(campaign: Campaign): Promise<LeadWithEmail[]> {
    const raw = await convex.query(api.business.getLeadsWithEmail, {
        city: campaign.targetCity,
        niche: campaign.targetNiche,
        status: campaign.targetStatus,
        limit: 2000,
    });
    return (raw as any[]).filter((l) => !!l.email);
}

export async function getNextAccount(): Promise<ResendAccount | null> {
    return await convex.query(api.resendAccounts.getNextAvailableAccount, {});
}

export async function createSendRecord(
    campaignId: string,
    leadId: string,
    resendAccountId: string,
    toEmail: string
): Promise<string> {
    return await convex.mutation(api.campaigns.createSendRecord, {
        campaignId,
        leadId,
        resendAccountId,
        toEmail,
    });
}

export async function markSent(
    sendId: string,
    resendMessageId: string,
    accountId: string
) {
    await Promise.all([
        convex.mutation(api.campaigns.updateSendStatus, {
            id: sendId,
            status: 'SENT',
            resendMessageId,
        }),
        convex.mutation(api.resendAccounts.incrementSendCount, { id: accountId }),
    ]);
}

export async function markFailed(sendId: string, error: string) {
    await convex.mutation(api.campaigns.updateSendStatus, {
        id: sendId,
        status: 'FAILED',
        error,
    });
}

export async function updateCampaignStatus(
    id: string,
    status: Campaign['status'],
    totals?: { totalSent?: number; totalFailed?: number; totalTargeted?: number }
) {
    await convex.mutation(api.campaigns.updateCampaign, { id, status, ...totals });
}

export async function getSetting(key: string): Promise<string | null> {
    return await convex.query(api.campaigns.getSetting, { key });
}

export async function resetAllDailyCounts() {
    return await convex.mutation(api.resendAccounts.resetAllDailyCounts, {});
}
