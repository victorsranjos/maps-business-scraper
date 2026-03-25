import { useState } from 'react';
import { MapPin, Phone, Globe, Mail, Instagram, Facebook, Linkedin, X } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { Lead } from './LeadList';
import { TouchpointTimeline } from './TouchpointTimeline';

interface LeadKanbanCardProps {
    lead: Lead;
    onDragStart: (e: React.DragEvent, leadId: string) => void;
}

export function LeadKanbanCard({ lead, onDragStart }: LeadKanbanCardProps) {
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'contatos' | 'sequencia'>('contatos');
    const updateLeadStatus = useMutation(api.business.updateLeadStatus);

    const socials = [
        { icon: Instagram, value: lead.instagram, color: 'text-pink-500', label: 'Instagram' },
        { icon: Facebook, value: lead.facebook, color: 'text-blue-600', label: 'Facebook' },
        { icon: Linkedin, value: lead.linkedin, color: 'text-blue-700', label: 'LinkedIn' },
    ].filter(s => s.value);

    return (
        <>
            {/* Card */}
            <div
                draggable
                onDragStart={(e) => onDragStart(e, lead._id)}
                onClick={() => setShowModal(true)}
                className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 transition-all duration-150 select-none group"
            >
                <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors leading-tight truncate">
                    {lead.name}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full truncate max-w-[120px]">
                        {lead.niche}
                    </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{lead.city}</span>
                </div>
                {lead.phone && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{lead.phone}</span>
                    </div>
                )}
                {socials.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                        {socials.map(({ icon: Icon, color, label }) => (
                            <Icon key={label} className={`w-3.5 h-3.5 ${color}`} />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Detalhes */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header do Modal */}
                        <div className="flex items-start justify-between p-5 border-b border-gray-100">
                            <div className="flex-1 pr-4">
                                <h2 className="text-lg font-bold text-gray-900">{lead.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                                        {lead.niche}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />{lead.city}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Abas */}
                        <div className="flex border-b border-gray-100">
                            {(['contatos', 'sequencia'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-2.5 text-sm font-semibold transition-colors
                                        ${activeTab === tab
                                            ? 'text-blue-600 border-b-2 border-blue-500 -mb-px'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab === 'contatos' ? 'Contatos' : '📋 Sequência'}
                                </button>
                            ))}
                        </div>

                        {/* Corpo do Modal */}
                        <div className="p-5 max-h-[60vh] overflow-y-auto">
                        {activeTab === 'sequencia' ? (
                            <TouchpointTimeline leadId={lead._id as Id<'leads'>} />
                        ) : (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Informações de Contato</h3>
                            <div className="space-y-3">
                                {[
                                    { icon: Globe, label: 'Website', value: lead.website, isLink: true },
                                    { icon: Phone, label: 'Telefone', value: lead.phone, isLink: false },
                                    { icon: Mail, label: 'E-mail', value: lead.email, isLink: false },
                                    { icon: Instagram, label: 'Instagram', value: lead.instagram, isLink: false, iconColor: 'text-pink-500' },
                                    { icon: Facebook, label: 'Facebook', value: lead.facebook, isLink: false, iconColor: 'text-blue-600' },
                                    { icon: Linkedin, label: 'LinkedIn', value: lead.linkedin, isLink: false, iconColor: 'text-blue-700' },
                                ].map(({ icon: Icon, label, value, isLink, iconColor }) => (
                                    <div key={label} className="flex items-start gap-3">
                                        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor || 'text-gray-400'}`} />
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">{label}</p>
                                            {value ? (
                                                isLink ? (
                                                    <a href={value} target="_blank" rel="noreferrer"
                                                        className="text-sm text-blue-600 hover:underline break-all">{value}</a>
                                                ) : (
                                                    <p className="text-sm text-gray-800 break-all">{value}</p>
                                                )
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">Não disponível</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Mover de status */}
                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mover para</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {PIPELINE_STAGES.map(stage => (
                                        <button
                                            key={stage.value}
                                            disabled={lead.status === stage.value || (!lead.status && stage.value === 'NOVO')}
                                            onClick={() => {
                                                updateLeadStatus({
                                                    leadId: lead._id as Id<'leads'>,
                                                    status: stage.value as any
                                                });
                                                setShowModal(false);
                                            }}
                                            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors
                                                ${lead.status === stage.value || (!lead.status && stage.value === 'NOVO')
                                                    ? stage.activeBg + ' opacity-60 cursor-default'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {stage.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export const PIPELINE_STAGES = [
    { value: 'NOVO', label: 'Novo Lead', color: 'border-t-gray-400', headerBg: 'bg-gray-100', activeBg: 'bg-gray-200 text-gray-700', dot: 'bg-gray-400' },
    { value: 'CONTATADO', label: 'Contatado', color: 'border-t-yellow-400', headerBg: 'bg-yellow-50', activeBg: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400' },
    { value: 'EM_NUTRICAO', label: 'Em Nutrição', color: 'border-t-blue-400', headerBg: 'bg-blue-50', activeBg: 'bg-blue-100 text-blue-800', dot: 'bg-blue-400' },
    { value: 'RESPOSTA_RECEBIDA', label: 'Resposta Recebida', color: 'border-t-purple-400', headerBg: 'bg-purple-50', activeBg: 'bg-purple-100 text-purple-800', dot: 'bg-purple-400' },
    { value: 'REUNIAO_AGENDADA', label: 'Reunião Agendada', color: 'border-t-indigo-500', headerBg: 'bg-indigo-50', activeBg: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
    { value: 'PROPOSTA_ENVIADA', label: 'Proposta Enviada', color: 'border-t-orange-400', headerBg: 'bg-orange-50', activeBg: 'bg-orange-100 text-orange-800', dot: 'bg-orange-400' },
    { value: 'NEGOCIACAO', label: 'Em Negociação', color: 'border-t-teal-500', headerBg: 'bg-teal-50', activeBg: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500' },
    { value: 'CLIENTE_GANHO', label: '🏆 Cliente Ganho', color: 'border-t-green-500', headerBg: 'bg-green-50', activeBg: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
    { value: 'CLIENTE_PERDIDO', label: 'Cliente Perdido', color: 'border-t-red-400', headerBg: 'bg-red-50', activeBg: 'bg-red-100 text-red-800', dot: 'bg-red-400' },
    { value: 'DESCARTADO', label: 'Descartado', color: 'border-t-gray-300', headerBg: 'bg-gray-50', activeBg: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300' },
] as const;
