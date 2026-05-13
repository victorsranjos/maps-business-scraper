import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import {
    Mail, Plus, Play, Pause, Trash2, ChevronRight,
    CheckCircle2, XCircle, Clock, BarChart2, Users,
    Loader2, AlertCircle,
} from 'lucide-react';
import { CampaignComposer } from './CampaignComposer';

type CampaignStatus = 'DRAFT' | 'RUNNING' | 'PAUSED' | 'DONE';

interface Campaign {
    _id: Id<'campaigns'>;
    name: string;
    subject: string;
    status: CampaignStatus;
    targetCity?: string;
    targetNiche?: string;
    targetStatus?: string;
    totalTargeted?: number;
    totalSent?: number;
    totalFailed?: number;
    createdAt: number;
}

const STATUS_META: Record<CampaignStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    DRAFT:   { label: 'Rascunho',  color: 'text-slate-600',  bg: 'bg-slate-100',  icon: Clock },
    RUNNING: { label: 'Enviando',  color: 'text-blue-600',   bg: 'bg-blue-100',   icon: Loader2 },
    PAUSED:  { label: 'Pausada',   color: 'text-amber-600',  bg: 'bg-amber-100',  icon: Pause },
    DONE:    { label: 'Concluída', color: 'text-green-600',  bg: 'bg-green-100',  icon: CheckCircle2 },
};

function ProgressBar({ sent, failed, total }: { sent: number; failed: number; total: number }) {
    if (!total) return null;
    const sentPct = Math.round((sent / total) * 100);
    const failedPct = Math.round((failed / total) * 100);
    return (
        <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{sent} enviados · {failed} falhas · {total - sent - failed} pendentes</span>
                <span>{sentPct}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="bg-green-500 transition-all duration-500" style={{ width: `${sentPct}%` }} />
                <div className="bg-red-400 transition-all duration-500" style={{ width: `${failedPct}%` }} />
            </div>
        </div>
    );
}

export function Campaigns() {
    const campaigns = useQuery(api.campaigns.listCampaigns) as Campaign[] | undefined;
    const deleteCampaign = useMutation(api.campaigns.deleteCampaign);

    const [composerOpen, setComposerOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const triggerSend = async (campaign: Campaign) => {
        setLoadingId(campaign._id);
        setErrorMsg(null);
        try {
            const res = await fetch(`http://localhost:3001/api/campaigns/${campaign._id}/send`, {
                method: 'POST',
            });
            if (!res.ok) {
                const data = await res.json();
                setErrorMsg(data.error ?? 'Erro ao iniciar envio.');
            }
        } catch {
            setErrorMsg('Não foi possível conectar com a API.');
        } finally {
            setLoadingId(null);
        }
    };

    const triggerPause = async (campaign: Campaign) => {
        setLoadingId(campaign._id);
        await fetch(`http://localhost:3001/api/campaigns/${campaign._id}/pause`, { method: 'POST' });
        setLoadingId(null);
    };

    const handleDelete = async (campaign: Campaign) => {
        if (!confirm(`Excluir campanha "${campaign.name}"? Isso removerá o histórico de envios.`)) return;
        await deleteCampaign({ id: campaign._id });
    };

    const openComposer = (campaign?: Campaign) => {
        setEditingCampaign(campaign ?? null);
        setComposerOpen(true);
    };

    if (campaigns === undefined) {
        return (
            <div className="flex items-center justify-center py-24 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Carregando campanhas...
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Mail className="w-6 h-6 text-violet-600" />
                        Campanhas de E-mail
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Crie e dispare campanhas para leads com e-mail extraído.
                    </p>
                </div>
                <button
                    onClick={() => openComposer()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-semibold shadow-md hover:bg-violet-700 transition-all hover:shadow-lg active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Nova Campanha
                </button>
            </div>

            {/* Error banner */}
            {errorMsg && (
                <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errorMsg}
                    <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
                </div>
            )}

            {/* Empty state */}
            {campaigns.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                    <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Nenhuma campanha ainda.</p>
                    <p className="text-slate-400 text-sm mt-1">Crie sua primeira campanha para começar a prospectar.</p>
                    <button
                        onClick={() => openComposer()}
                        className="mt-6 px-6 py-2.5 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-all"
                    >
                        Criar Campanha
                    </button>
                </div>
            )}

            {/* Campaign cards */}
            <div className="space-y-4">
                {campaigns.map((campaign) => {
                    const meta = STATUS_META[campaign.status];
                    const StatusIcon = meta.icon;
                    const isRunning = campaign.status === 'RUNNING';
                    const isLoading = loadingId === campaign._id;
                    const total = campaign.totalTargeted ?? 0;
                    const sent = campaign.totalSent ?? 0;
                    const failed = campaign.totalFailed ?? 0;

                    return (
                        <div
                            key={campaign._id}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    {/* Status badge + name */}
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
                                            <StatusIcon className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                                            {meta.label}
                                        </span>
                                        <h3 className="font-bold text-slate-800 text-lg truncate">{campaign.name}</h3>
                                    </div>

                                    {/* Subject */}
                                    <p className="text-slate-500 text-sm truncate">Assunto: {campaign.subject}</p>

                                    {/* Filters */}
                                    <div className="flex gap-3 mt-2 flex-wrap">
                                        {campaign.targetCity && (
                                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{campaign.targetCity}</span>
                                        )}
                                        {campaign.targetNiche && (
                                            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{campaign.targetNiche}</span>
                                        )}
                                        {total > 0 && (
                                            <span className="text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Users className="w-3 h-3" />{total} alvos
                                            </span>
                                        )}
                                    </div>

                                    {/* Progress bar */}
                                    {total > 0 && <ProgressBar sent={sent} failed={failed} total={total} />}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {campaign.status === 'DRAFT' || campaign.status === 'PAUSED' ? (
                                        <button
                                            onClick={() => triggerSend(campaign)}
                                            disabled={isLoading}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-all disabled:opacity-60"
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                            {campaign.status === 'PAUSED' ? 'Retomar' : 'Enviar'}
                                        </button>
                                    ) : campaign.status === 'RUNNING' ? (
                                        <button
                                            onClick={() => triggerPause(campaign)}
                                            disabled={isLoading}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-all disabled:opacity-60"
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                                            Pausar
                                        </button>
                                    ) : null}

                                    {campaign.status === 'DRAFT' && (
                                        <button
                                            onClick={() => openComposer(campaign)}
                                            className="flex items-center gap-1.5 px-3 py-2 text-slate-500 border border-slate-200 text-sm rounded-xl hover:bg-slate-50 transition-all"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                            Editar
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDelete(campaign)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        title="Excluir campanha"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Stats footer for done campaigns */}
                            {campaign.status === 'DONE' && total > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="flex items-center justify-center gap-1 text-green-600 font-bold text-lg">
                                            <CheckCircle2 className="w-4 h-4" />{sent}
                                        </div>
                                        <div className="text-xs text-slate-500">Enviados</div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-center gap-1 text-red-500 font-bold text-lg">
                                            <XCircle className="w-4 h-4" />{failed}
                                        </div>
                                        <div className="text-xs text-slate-500">Falhas</div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-center gap-1 text-slate-700 font-bold text-lg">
                                            <BarChart2 className="w-4 h-4" />{total > 0 ? Math.round((sent / total) * 100) : 0}%
                                        </div>
                                        <div className="text-xs text-slate-500">Taxa entrega</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Campaign Composer Modal */}
            {composerOpen && (
                <CampaignComposer
                    campaign={editingCampaign}
                    onClose={() => { setComposerOpen(false); setEditingCampaign(null); }}
                />
            )}
        </div>
    );
}
