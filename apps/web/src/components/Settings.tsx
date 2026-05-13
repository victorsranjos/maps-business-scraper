import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import {
    Key, Save, AlertCircle, Mail, Plus, Trash2, ToggleLeft,
    ToggleRight, Eye, EyeOff, Settings2, Loader2, CheckCircle2,
} from 'lucide-react';

interface ResendAccount {
    _id: Id<'resend_accounts'>;
    label: string;
    apiKey: string;
    fromEmail: string;
    fromName?: string;
    dailyCap: number;
    dailySentCount: number;
    isActive: boolean;
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
        </div>
    );
}

// ─── Google Maps API Key section ──────────────────────────────────────────────
function GoogleApiSection() {
    const [apiKey, setApiKey] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const storedKey = localStorage.getItem('google_maps_api_key');
        if (storedKey) setApiKey(storedKey);
    }, []);

    const handleSave = () => {
        if (apiKey.trim()) localStorage.setItem('google_maps_api_key', apiKey.trim());
        else localStorage.removeItem('google_maps_api_key');
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                    Google Maps API Key (New Places API)
                </label>
                <input
                    id="apiKey"
                    type="password"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 font-mono text-sm"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                />
            </div>
            <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-sm text-gray-700">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p>A chave fica salva apenas no <strong>Local Storage</strong> do seu navegador e nunca vai ao banco de dados.</p>
            </div>
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors"
                >
                    <Save className="w-4 h-4" />
                    {isSaved ? 'Salvo!' : 'Salvar Chave Local'}
                </button>
            </div>
        </div>
    );
}

// ─── Prospection settings section ────────────────────────────────────────────
function ProspectionSettings() {
    const settings = useQuery(api.campaigns.getAllSettings);
    const setSetting = useMutation(api.campaigns.setSetting);

    const [autoScrape, setAutoScrape] = useState(true);
    const [sendDelay, setSendDelay] = useState(30);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (settings) {
            setAutoScrape(settings.autoScrapeEmails !== 'false');
            setSendDelay(parseInt(settings.sendDelaySeconds ?? '30', 10));
        }
    }, [settings]);

    const handleSave = async () => {
        setSaving(true);
        await Promise.all([
            setSetting({ key: 'autoScrapeEmails', value: autoScrape ? 'true' : 'false' }),
            setSetting({ key: 'sendDelaySeconds', value: String(Math.max(sendDelay, 5)) }),
        ]);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="space-y-5">
            {/* Auto scrape toggle */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
                <div>
                    <p className="font-semibold text-slate-800 text-sm">Extração automática de e-mails</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Após cada busca de leads, extrai e-mails dos sites automaticamente.
                    </p>
                </div>
                <button
                    onClick={() => setAutoScrape(!autoScrape)}
                    className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
                >
                    {autoScrape
                        ? <><ToggleRight className="w-8 h-8 text-green-500" /><span className="text-green-600">Ativado</span></>
                        : <><ToggleLeft className="w-8 h-8 text-slate-400" /><span className="text-slate-500">Manual</span></>
                    }
                </button>
            </div>

            {/* Send delay */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Intervalo entre envios de e-mail (segundos)
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min={5}
                        max={300}
                        step={5}
                        value={sendDelay}
                        onChange={(e) => setSendDelay(Number(e.target.value))}
                        className="flex-1 accent-violet-600"
                    />
                    <span className="text-lg font-bold text-violet-700 w-16 text-right">{sendDelay}s</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Mínimo: 5s. Recomendado: 30–60s para evitar bloqueios.</p>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-all disabled:opacity-60"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Salvo!' : 'Salvar Configurações'}
                </button>
            </div>
        </div>
    );
}

// ─── Resend accounts section ─────────────────────────────────────────────────
function ResendAccountsSection() {
    const accounts = useQuery(api.resendAccounts.listAccounts) as ResendAccount[] | undefined;
    const addAccount = useMutation(api.resendAccounts.addAccount);
    const updateAccount = useMutation(api.resendAccounts.updateAccount);
    const removeAccount = useMutation(api.resendAccounts.removeAccount);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ label: '', apiKey: '', fromEmail: '', fromName: '', dailyCap: 80 });
    const [showKey, setShowKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.label || !form.apiKey || !form.fromEmail) {
            setFormError('Label, API Key e From Email são obrigatórios.');
            return;
        }
        setSaving(true);
        setFormError(null);
        try {
            await addAccount({
                label: form.label,
                apiKey: form.apiKey,
                fromEmail: form.fromEmail,
                fromName: form.fromName || undefined,
                dailyCap: Math.max(form.dailyCap, 1),
            });
            setForm({ label: '', apiKey: '', fromEmail: '', fromName: '', dailyCap: 80 });
            setShowForm(false);
        } catch (err: any) {
            setFormError(err?.message ?? 'Erro ao adicionar conta.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (account: ResendAccount) => {
        await updateAccount({ id: account._id, isActive: !account.isActive });
    };

    const handleDelete = async (account: ResendAccount) => {
        if (!confirm(`Remover conta "${account.label}"?`)) return;
        await removeAccount({ id: account._id });
    };

    const handleCapChange = async (account: ResendAccount, cap: number) => {
        await updateAccount({ id: account._id, dailyCap: Math.max(cap, 1) });
    };

    return (
        <div className="space-y-4">
            {/* Existing accounts */}
            {accounts === undefined ? (
                <div className="text-center py-4 text-slate-400 text-sm"><Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Carregando...</div>
            ) : accounts.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">Nenhuma conta Resend cadastrada.</p>
            ) : (
                <div className="space-y-3">
                    {accounts.map((acc) => (
                        <div key={acc._id} className={`border rounded-xl p-4 transition-all ${acc.isActive ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-slate-800 text-sm">{acc.label}</p>
                                        {!acc.isActive && <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">Inativa</span>}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{acc.fromEmail}</p>
                                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                                        {acc.apiKey.slice(0, 8)}{'•'.repeat(12)}
                                    </p>
                                </div>
                                {/* Daily cap + sent counter */}
                                <div className="text-center min-w-20">
                                    <p className="text-xs text-slate-500 mb-1">Hoje</p>
                                    <p className="text-sm font-bold text-slate-700">{acc.dailySentCount} / {acc.dailyCap}</p>
                                    <div className="h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${acc.dailySentCount >= acc.dailyCap ? 'bg-red-400' : 'bg-violet-400'}`}
                                            style={{ width: `${Math.min((acc.dailySentCount / acc.dailyCap) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <div className="mt-2">
                                        <label className="text-xs text-slate-400">Cap/dia</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={500}
                                            value={acc.dailyCap}
                                            onChange={(e) => handleCapChange(acc, Number(e.target.value))}
                                            className="w-full px-2 py-1 text-center text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                                        />
                                    </div>
                                </div>
                                {/* Actions */}
                                <div className="flex flex-col gap-1.5">
                                    <button
                                        onClick={() => handleToggle(acc)}
                                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                        title={acc.isActive ? 'Desativar' : 'Ativar'}
                                    >
                                        {acc.isActive
                                            ? <ToggleRight className="w-5 h-5 text-green-500" />
                                            : <ToggleLeft className="w-5 h-5 text-slate-400" />
                                        }
                                    </button>
                                    <button
                                        onClick={() => handleDelete(acc)}
                                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                        title="Remover"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add account button / form */}
            {!showForm ? (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl hover:border-violet-300 hover:text-violet-600 transition-all font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar Conta Resend
                </button>
            ) : (
                <form onSubmit={handleAdd} className="border border-violet-200 bg-violet-50/50 rounded-xl p-5 space-y-3">
                    <p className="font-semibold text-violet-800 text-sm mb-1">Nova Conta Resend</p>
                    {formError && (
                        <div className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />{formError}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-slate-600 font-medium mb-1 block">Label *</label>
                            <input
                                type="text" placeholder="Ex: Conta Victor"
                                value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-600 font-medium mb-1 block">From Email *</label>
                            <input
                                type="email" placeholder="outreach@dominio.com"
                                value={form.fromEmail} onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-600 font-medium mb-1 block">From Name</label>
                            <input
                                type="text" placeholder="Victor | Agência"
                                value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-600 font-medium mb-1 block">Limite/dia</label>
                            <input
                                type="number" min={1} max={500}
                                value={form.dailyCap} onChange={(e) => setForm({ ...form, dailyCap: Number(e.target.value) })}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-600 font-medium mb-1 block">Resend API Key *</label>
                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                placeholder="re_xxxxxxxxxxxxxxxxxx"
                                value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                                className="w-full px-3 py-2 pr-10 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <button type="button" onClick={() => setShowKey(!showKey)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button type="button" onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-white transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 text-sm bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60">
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            Adicionar
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

// ─── Main Settings component ──────────────────────────────────────────────────
export function Settings() {
    return (
        <div className="max-w-2xl mx-auto mt-8 space-y-6 pb-12">

            {/* Google Maps API Key */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <SectionHeader icon={Key} title="Chave de API Google Maps" subtitle="Configure sua chave do Google Places" />
                <GoogleApiSection />
            </div>

            {/* Prospection settings */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <SectionHeader icon={Settings2} title="Configurações de Prospecção" subtitle="Controle o comportamento do scraper e dos disparos" />
                <ProspectionSettings />
            </div>

            {/* Resend accounts */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <SectionHeader icon={Mail} title="Contas Resend" subtitle="Gerencie as contas de disparo de e-mail" />
                <ResendAccountsSection />
            </div>
        </div>
    );
}
