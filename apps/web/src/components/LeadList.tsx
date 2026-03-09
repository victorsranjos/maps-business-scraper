import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Globe, Phone, Mail, Instagram, Facebook, Linkedin, CheckCircle, Circle } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

export interface Lead {
    _id: string;
    name: string;
    niche: string;
    city: string;
    email?: string;
    phone?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    status?: "NOVO" | "CONTATADO" | "EM_NUTRICAO" | "RESPOSTA_RECEBIDA" | "REUNIAO_AGENDADA" | "PROPOSTA_ENVIADA" | "NEGOCIACAO" | "CLIENTE_GANHO" | "CLIENTE_PERDIDO" | "DESCARTADO";
}

interface LeadListProps {
    leads: Lead[] | undefined;
    loading: boolean;
}

const CRM_STATUSES = [
    { value: 'NOVO', label: 'Novo Lead', color: 'bg-gray-100 text-gray-700' },
    { value: 'CONTATADO', label: 'Tentativa de Contato', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'EM_NUTRICAO', label: 'Em Nutrição / Follow-up', color: 'bg-blue-100 text-blue-800' },
    { value: 'RESPOSTA_RECEBIDA', label: 'Resposta Recebida', color: 'bg-purple-100 text-purple-800' },
    { value: 'REUNIAO_AGENDADA', label: 'Reunião Agendada', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'PROPOSTA_ENVIADA', label: 'Proposta Enviada', color: 'bg-orange-100 text-orange-800' },
    { value: 'NEGOCIACAO', label: 'Em Negociação', color: 'bg-teal-100 text-teal-800' },
    { value: 'CLIENTE_GANHO', label: 'Cliente Ganho (Won)', color: 'bg-green-100 text-green-800' },
    { value: 'CLIENTE_PERDIDO', label: 'Perdido (Lost)', color: 'bg-red-100 text-red-800' },
    { value: 'DESCARTADO', label: 'Descartado / NQ', color: 'bg-gray-200 text-gray-700' },
];

export function LeadList({ leads, loading }: LeadListProps) {
    const [expandedLead, setExpandedLead] = useState<string | null>(null);
    const updateLeadStatus = useMutation(api.business.updateLeadStatus);

    const toggleExpand = (id: string) => {
        setExpandedLead(expandedLead === id ? null : id);
    };

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, leadId: string) => {
        e.stopPropagation();
        await updateLeadStatus({
            leadId: leadId as Id<"leads">,
            status: e.target.value as any
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!leads || leads.length === 0) {
        return (
            <div className="text-center p-12 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-500 font-medium">Nenhum resultado encontrado.</p>
                <p className="text-sm text-gray-400 mt-2">Tente pesquisar por um nicho e cidade diferentes.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto mt-8 flex flex-col gap-4">
            {leads.map((lead) => {
                const isExpanded = expandedLead === lead._id;
                const statusConfig = CRM_STATUSES.find(s => s.value === (lead.status || 'NOVO'));
                const isWon = lead.status === 'CLIENTE_GANHO';

                return (
                    <div
                        key={lead._id}
                        className={`bg-white rounded-xl shadow-sm border transition-all duration-200 overflow-hidden ${isWon ? 'border-l-4 border-l-green-500 border-gray-200' :
                            isExpanded ? 'border-blue-400 ring-1 ring-blue-400' : 'border-gray-200 hover:border-gray-300 border-l-4 border-l-transparent'
                            }`}
                    >
                        {/* Cabecalho Clicavel */}
                        <div
                            className="p-5 flex items-center justify-between cursor-pointer select-none"
                            onClick={() => toggleExpand(lead._id)}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h3 className={`text-lg font-bold transition-colors ${isWon ? 'text-gray-400' : 'text-gray-900 group-hover:text-blue-600'}`}>
                                        {lead.name}
                                    </h3>
                                    <span className={`text-xs font-medium px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full`}>
                                        {lead.niche}
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusConfig?.color || ''}`}>
                                        {statusConfig?.label || lead.status}
                                    </span>
                                </div>

                                <div className="flex items-center mt-2 text-sm text-gray-500 gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span>{lead.city}</span>
                                    </div>
                                    {lead.phone && (
                                        <div className="flex items-center gap-1.5">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span>{lead.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <select
                                    className="text-sm font-medium bg-gray-50 border border-gray-300 text-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                    value={lead.status || 'NOVO'}
                                    onChange={(e) => handleStatusChange(e, lead._id)}
                                >
                                    {CRM_STATUSES.map((s) => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                                <div className="text-gray-400 p-2 rounded-full hover:bg-gray-100 transition-colors">
                                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </div>
                            </div>
                        </div>

                        {/* Corpo Expansivel (Detalhes) */}
                        {isExpanded && (
                            <div className="bg-gray-50 border-t border-gray-100 p-5 animate-in slide-in-from-top-2 duration-200">
                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Detalhes do Contato</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                    {/* Web Info */}
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">Website</p>
                                                {lead.website ? (
                                                    <a href={lead.website} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                                                        {lead.website}
                                                    </a>
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic">Não disponível</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">E-mail</p>
                                                <p className="text-sm text-gray-800">
                                                    {lead.email || <span className="text-gray-400 italic">Não extraído</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Social Info */}
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <Instagram className="w-5 h-5 text-pink-500 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">Instagram</p>
                                                <p className="text-sm text-gray-800">
                                                    {lead.instagram || <span className="text-gray-400 italic">Não extraído</span>}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <Facebook className="w-5 h-5 text-blue-600 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">Facebook</p>
                                                <p className="text-sm text-gray-800">
                                                    {lead.facebook || <span className="text-gray-400 italic">Não extraído</span>}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <Linkedin className="w-5 h-5 text-blue-700 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">LinkedIn</p>
                                                <p className="text-sm text-gray-800">
                                                    {lead.linkedin || <span className="text-gray-400 italic">Não extraído</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
