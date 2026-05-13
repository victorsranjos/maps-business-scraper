import { Resend } from 'resend';
import {
    getCampaign,
    getLeadsForCampaign,
    getNextAccount,
    createSendRecord,
    markSent,
    markFailed,
    updateCampaignStatus,
    getSetting,
    type Campaign,
    type LeadWithEmail,
    type ResendAccount,
} from '../db/campaigns.js';

// ─── Token interpolation ──────────────────────────────────────────────────────

function interpolate(template: string, lead: LeadWithEmail): string {
    return template
        .replace(/\{\{nome\}\}/gi, lead.name)
        .replace(/\{\{cidade\}\}/gi, lead.city)
        .replace(/\{\{nicho\}\}/gi, lead.niche)
        .replace(/\{\{email\}\}/gi, lead.email)
        .replace(/\{\{website\}\}/gi, lead.website ?? '');
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export interface OrchestratorOptions {
    campaignId: string;
    /** Override send delay in seconds (default: read from app_settings) */
    sendDelayOverride?: number;
    /** Called after each send (for SSE progress streaming) */
    onProgress?: (info: { sent: number; failed: number; total: number; current: string }) => void;
}

export async function runCampaign(options: OrchestratorOptions): Promise<void> {
    const { campaignId, onProgress } = options;

    // ── 1. Load campaign ──────────────────────────────────────────────────────
    const campaign = await getCampaign(campaignId) as Campaign | null;
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`);
    if (campaign.status === 'DONE') throw new Error(`Campaign ${campaignId} is already done`);

    // ── 2. Load settings ──────────────────────────────────────────────────────
    const delaySetting = options.sendDelayOverride
        ?? parseInt((await getSetting('sendDelaySeconds')) ?? '30', 10);
    const sendDelayMs = Math.max(delaySetting * 1000, 5000); // Minimum 5s between sends

    console.log(`[Orchestrator] Campaign "${campaign.name}" — delay between sends: ${sendDelayMs / 1000}s`);

    // ── 3. Load eligible leads (have email, not yet sent in this campaign) ────
    const allLeads = await getLeadsForCampaign(campaign);
    if (allLeads.length === 0) {
        console.log('[Orchestrator] Nenhum lead com email encontrado para esta campanha.');
        await updateCampaignStatus(campaignId, 'DONE', {
            totalTargeted: 0, totalSent: 0, totalFailed: 0,
        });
        return;
    }

    const total = allLeads.length;
    console.log(`[Orchestrator] ${total} leads elegíveis para esta campanha.`);

    await updateCampaignStatus(campaignId, 'RUNNING', { totalTargeted: total, totalSent: 0, totalFailed: 0 });

    // ── 4. Send loop ──────────────────────────────────────────────────────────
    let sent = 0;
    let failed = 0;

    for (const lead of allLeads) {
        // Check if campaign was paused externally
        const freshCampaign = await getCampaign(campaignId) as Campaign | null;
        if (freshCampaign?.status === 'PAUSED') {
            console.log('[Orchestrator] Campanha pausada — interrompendo envio.');
            break;
        }

        // Pick the next available Resend account (round-robin, respects daily caps)
        const account = await getNextAccount() as ResendAccount | null;
        if (!account) {
            console.warn('[Orchestrator] Todas as contas atingiram o limite diário. Pausando campanha.');
            await updateCampaignStatus(campaignId, 'PAUSED');
            break;
        }

        // Create the PENDING send record (idempotent — won't duplicate)
        const sendId = await createSendRecord(
            campaignId,
            lead._id,
            account._id,
            lead.email,
        );

        // Interpolate tokens
        const subject = interpolate(campaign.subject, lead);
        const html = interpolate(campaign.body, lead);

        // Send via Resend
        try {
            const resend = new Resend(account.apiKey);
            const { data, error } = await resend.emails.send({
                from: account.fromName
                    ? `${account.fromName} <${account.fromEmail}>`
                    : account.fromEmail,
                to: [lead.email],
                subject,
                html,
            });

            if (error) throw new Error(error.message ?? JSON.stringify(error));

            await markSent(sendId, data?.id ?? '', account._id);
            sent++;
            console.log(`[Orchestrator] ✅ Enviado para ${lead.email} via ${account.label} (${sent}/${total})`);
        } catch (err: any) {
            const msg = err?.message ?? String(err);
            await markFailed(sendId, msg);
            failed++;
            console.error(`[Orchestrator] ❌ Falha ao enviar para ${lead.email}: ${msg}`);
        }

        onProgress?.({ sent, failed, total, current: lead.email });
        await updateCampaignStatus(campaignId, 'RUNNING', {
            totalSent: sent,
            totalFailed: failed,
        });

        // Rate-limit: sleep between sends
        if (sent + failed < total) {
            console.log(`[Orchestrator] Aguardando ${sendDelayMs / 1000}s antes do próximo envio...`);
            await new Promise((r) => setTimeout(r, sendDelayMs));
        }
    }

    // ── 5. Finalize ───────────────────────────────────────────────────────────
    const freshStatus = (await getCampaign(campaignId))?.status;
    if (freshStatus !== 'PAUSED') {
        await updateCampaignStatus(campaignId, 'DONE', {
            totalSent: sent,
            totalFailed: failed,
        });
    }

    console.log(`[Orchestrator] Campanha "${campaign.name}" concluída. Enviados: ${sent}, Falhas: ${failed}.`);
}
