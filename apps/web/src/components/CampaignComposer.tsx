import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import {
    X, Eye, EyeOff, ChevronDown, Mail, Target,
    Loader2, Sparkles, AlertCircle, Users,
} from 'lucide-react';

interface CampaignComposerProps {
    campaign?: {
        _id: Id<'campaigns'>;
        name: string;
        subject: string;
        body: string;
        targetCity?: string;
        targetNiche?: string;
        targetStatus?: string;
    } | null;
    onClose: () => void;
}

// Personalization tokens available for subject/body
const TOKENS = [
    { token: '{{nome}}',    label: 'Nome do negócio' },
    { token: '{{cidade}}',  label: 'Cidade' },
    { token: '{{nicho}}',   label: 'Nicho' },
    { token: '{{website}}', label: 'Website' },
];

const LEAD_STATUSES = [
    { value: '', label: 'Todos os status' },
    { value: 'NOVO', label: 'Novo' },
    { value: 'CONTATADO', label: 'Contatado' },
    { value: 'EM_NUTRICAO', label: 'Em Nutrição' },
    { value: 'RESPOSTA_RECEBIDA', label: 'Resposta Recebida' },
];

// Renders a simple preview of the email with tokens substituted
function EmailPreview({ subject, body }: { subject: string; body: string }) {
    const sample = { nome: 'Sabor & Arte Restaurante', cidade: 'São Paulo', nicho: 'Restaurante', website: 'www.exemplo.com.br' };
    const subst = (t: string) => t
        .replace(/\{\{nome\}\}/gi, sample.nome)
        .replace(/\{\{cidade\}\}/gi, sample.cidade)
        .replace(/\{\{nicho\}\}/gi, sample.nicho)
        .replace(/\{\{website\}\}/gi, sample.website);

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 text-slate-600 font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Prévia do E-mail
            </div>
            <div className="p-4 space-y-2">
                <p className="text-slate-500 text-xs">Assunto:</p>
                <p className="font-semibold text-slate-800">{subst(subject) || '(sem assunto)'}</p>
                <hr className="border-slate-100" />
                <p className="text-slate-500 text-xs mt-2">Corpo:</p>
                <div
                    className="text-slate-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: subst(body).replace(/\n/g, '<br/>') || '<em>(corpo vazio)</em>' }}
                />
            </div>
        </div>
    );
}

export function CampaignComposer({ campaign, onClose }: CampaignComposerProps) {
    const isEditing = !!campaign;

    // Form state
    const [name, setName] = useState(campaign?.name ?? '');
    const [subject, setSubject] = useState(campaign?.subject ?? '');
    const [body, setBody] = useState(campaign?.body ?? '');
    const [targetCity, setTargetCity] = useState(campaign?.targetCity ?? '');
    const [targetNiche, setTargetNiche] = useState(campaign?.targetNiche ?? '');
    const [targetStatus, setTargetStatus] = useState(campaign?.targetStatus ?? '');

    const [showPreview, setShowPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estimated reach: leads with email matching filters
    const estimatedLeads = useQuery(api.business.getLeadsWithEmail, {
        city: targetCity || undefined,
        niche: targetNiche || undefined,
        status: targetStatus || undefined,
        limit: 2000,
    });
    const reach = estimatedLeads?.length ?? null;

    // Convex mutations
    const createCampaign = useMutation(api.campaigns.createCampaign);
    const updateCampaign = useMutation(api.campaigns.updateCampaign);

    // Metadata
    const meta = useQuery(api.business.getLeadsMeta);

    const insertToken = (field: 'subject' | 'body', token: string) => {
        if (field === 'subject') setSubject((s) => s + token);
        else setBody((b) => b + token);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !subject.trim() || !body.trim()) {
            setError('Nome, assunto e corpo são obrigatórios.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            if (isEditing && campaign) {
                await updateCampaign({
                    id: campaign._id,
                    name, subject, body,
                    targetCity: targetCity || undefined,
                    targetNiche: targetNiche || undefined,
                    targetStatus: targetStatus || undefined,
                });
            } else {
                await createCampaign({
                    name, subject, body,
                    targetCity: targetCity || undefined,
                    targetNiche: targetNiche || undefined,
                    targetStatus: targetStatus || undefined,
                });
            }
            onClose();
        } catch (err: any) {
            setError(err?.message ?? 'Erro ao salvar campanha.');
        } finally {
            setSaving(false);
        }
    };

    return (
        // Backdrop
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {isEditing ? 'Editar Campanha' : 'Nova Campanha'}
                        </h2>
                        <p className="text-slate-500 text-sm mt-0.5">
                            Compose seu e-mail e defina o público-alvo.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-5">
                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Campaign Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome da Campanha</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Prospecção Restaurantes SP — Maio"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                    </div>

                    {/* Target Filters */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-violet-500" />
                            Público-Alvo
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Cidade</label>
                                <select
                                    value={targetCity}
                                    onChange={(e) => setTargetCity(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="">Todas</option>
                                    {meta?.cities?.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Nicho</label>
                                <select
                                    value={targetNiche}
                                    onChange={(e) => setTargetNiche(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="">Todos</option>
                                    {meta?.niches?.map((n) => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Status do Lead</label>
                                <select
                                    value={targetStatus}
                                    onChange={(e) => setTargetStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Estimated reach */}
                        <div className="mt-2 flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-slate-400" />
                            {reach === null ? (
                                <span className="text-slate-400">Calculando...</span>
                            ) : (
                                <span className={`font-semibold ${reach > 0 ? 'text-violet-700' : 'text-slate-400'}`}>
                                    {reach} lead{reach !== 1 ? 's' : ''} com e-mail corresponde{reach !== 1 ? 'm' : ''} a estes filtros.
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Subject */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-sm font-semibold text-slate-700">Assunto</label>
                            <TokenPicker onInsert={(t) => insertToken('subject', t)} />
                        </div>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Ex: Olá {{nome}}, posso ajudar com seu site?"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>

                    {/* Body */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-sm font-semibold text-slate-700">Corpo do E-mail</label>
                            <div className="flex items-center gap-2">
                                <TokenPicker onInsert={(t) => insertToken('body', t)} />
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium"
                                >
                                    {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    {showPreview ? 'Fechar prévia' : 'Pré-visualizar'}
                                </button>
                            </div>
                        </div>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder={`Olá {{nome}},\n\nNosso time de marketing identificou que o {{nicho}} em {{cidade}} é uma oportunidade incrível...\n\nAtt,\nSeu Nome`}
                            rows={10}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            Suporta HTML básico. Use os tokens acima para personalização automática.
                        </p>
                    </div>

                    {/* Email Preview */}
                    {showPreview && <EmailPreview subject={subject} body={body} />}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-slate-600 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl font-semibold shadow-md hover:bg-violet-700 transition-all disabled:opacity-60"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {isEditing ? 'Salvar Alterações' : 'Criar Rascunho'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Token picker dropdown
function TokenPicker({ onInsert }: { onInsert: (token: string) => void }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-600 font-medium border border-slate-200 px-2.5 py-1 rounded-lg hover:border-violet-300 transition-all"
            >
                <Sparkles className="w-3 h-3" />
                Inserir token
                <ChevronDown className="w-3 h-3" />
            </button>
            {open && (
                <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-xl shadow-xl z-10 min-w-48 overflow-hidden">
                    {TOKENS.map(({ token, label }) => (
                        <button
                            key={token}
                            type="button"
                            onClick={() => { onInsert(token); setOpen(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-violet-50 hover:text-violet-700 transition-colors flex items-center justify-between gap-4"
                        >
                            <span className="text-slate-600">{label}</span>
                            <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-violet-600 font-mono">{token}</code>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
