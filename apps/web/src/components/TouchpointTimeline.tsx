import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import {
    MessageSquare, Phone, Mail, Instagram, Linkedin,
    ArrowUpRight, ArrowDownLeft, Trash2, ChevronDown, ChevronUp,
    Plus, Send, MessageCircle,
} from 'lucide-react';
import { AddTouchpointForm } from './AddTouchpointForm';

interface TouchpointTimelineProps {
    leadId: Id<'leads'>;
}

const CHANNEL_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    WHATSAPP:  { label: 'WhatsApp',  icon: MessageSquare, color: 'text-green-600' },
    EMAIL:     { label: 'E-mail',    icon: Mail,          color: 'text-blue-600' },
    INSTAGRAM: { label: 'Instagram', icon: Instagram,     color: 'text-pink-600' },
    TELEFONE:  { label: 'Telefone',  icon: Phone,         color: 'text-purple-600' },
    LINKEDIN:  { label: 'LinkedIn',  icon: Linkedin,      color: 'text-blue-800' },
    OUTRO:     { label: 'Outro',     icon: MessageCircle, color: 'text-gray-500' },
};

const STATUS_META: Record<string, { label: string; class: string }> = {
    ENVIADO:      { label: 'Enviado',       class: 'bg-blue-50 text-blue-700' },
    RESPONDIDO:   { label: 'Respondido',    class: 'bg-green-50 text-green-700' },
    SEM_RESPOSTA: { label: 'Sem Resposta',  class: 'bg-red-50 text-red-600' },
};

function formatDate(ts: number) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    }).format(new Date(ts));
}

export function TouchpointTimeline({ leadId }: TouchpointTimelineProps) {
    const touchpoints = useQuery(api.touchpoints.getByLead, { leadId });
    const removeTouchpoint = useMutation(api.touchpoints.remove);
    const [showForm, setShowForm] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <div className="flex flex-col gap-3">
            {/* Botão adicionar */}
            <button
                onClick={() => setShowForm(v => !v)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold rounded-lg border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all"
            >
                <Plus className="w-4 h-4" />
                Registrar novo contato
            </button>

            {/* Formulário inline */}
            {showForm && (
                <AddTouchpointForm
                    leadId={leadId}
                    onDone={() => setShowForm(false)}
                />
            )}

            {/* Carregando */}
            {touchpoints === undefined && (
                <div className="flex justify-center py-6">
                    <div className="animate-spin h-5 w-5 rounded-full border-b-2 border-blue-400" />
                </div>
            )}

            {/* Vazio */}
            {touchpoints && touchpoints.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-400">
                    <Send className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Nenhum contato registrado ainda.
                </div>
            )}

            {/* Timeline */}
            {touchpoints && touchpoints.length > 0 && (
                <div className="relative flex flex-col gap-3 before:absolute before:left-5 before:top-4 before:bottom-4 before:w-px before:bg-gray-200">
                    {touchpoints.map((tp) => {
                        const ch = CHANNEL_META[tp.channel] ?? CHANNEL_META.OUTRO;
                        const Icon = ch.icon;
                        const st = STATUS_META[tp.status];
                        const isExpanded = expandedId === tp._id;
                        const hasBody = tp.message || tp.notes;

                        return (
                            <div key={tp._id} className="relative flex gap-3">
                                {/* Ícone na linha do tempo */}
                                <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center`}>
                                    <Icon className={`w-4 h-4 ${ch.color}`} />
                                </div>

                                {/* Conteúdo */}
                                <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    {/* Header */}
                                    <div
                                        className={`flex items-center gap-2 px-3 py-2.5 ${hasBody ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                                        onClick={() => hasBody && setExpandedId(isExpanded ? null : tp._id)}
                                    >
                                        {/* Direção */}
                                        {tp.direction === 'OUTBOUND'
                                            ? <ArrowUpRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                            : <ArrowDownLeft className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                        }

                                        <span className="text-sm font-semibold text-gray-800 flex-1 truncate">
                                            {ch.label}
                                        </span>

                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.class}`}>
                                            {st.label}
                                        </span>

                                        <span className="text-xs text-gray-400 hidden sm:block">
                                            {formatDate(tp.contactedAt)}
                                        </span>

                                        {hasBody && (
                                            isExpanded
                                                ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                                                : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                        )}

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeTouchpoint({ touchpointId: tp._id as Id<'touchpoints'> });
                                            }}
                                            className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors ml-1"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Data no mobile */}
                                    <div className="px-3 pb-1 text-xs text-gray-400 sm:hidden">
                                        {formatDate(tp.contactedAt)}
                                    </div>

                                    {/* Corpo expandível */}
                                    {isExpanded && hasBody && (
                                        <div className="border-t border-gray-100 px-3 py-3 space-y-3">
                                            {tp.message && (
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                                        Mensagem Enviada
                                                    </p>
                                                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-200">
                                                        {tp.message}
                                                    </div>
                                                </div>
                                            )}
                                            {tp.notes && (
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                                        Anotações
                                                    </p>
                                                    <p className="text-sm text-gray-600 italic leading-relaxed">
                                                        {tp.notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
