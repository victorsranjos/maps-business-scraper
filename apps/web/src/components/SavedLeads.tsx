import { useState, useMemo } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { LeadList, Lead } from "./LeadList";
import { Search, Filter, MapPin, Briefcase } from 'lucide-react';

const CRM_STATUSES = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'NOVO', label: 'Novo Lead' },
    { value: 'CONTATADO', label: 'Tentativa de Contato' },
    { value: 'EM_NUTRICAO', label: 'Em Nutrição' },
    { value: 'RESPOSTA_RECEBIDA', label: 'Resposta Recebida' },
    { value: 'REUNIAO_AGENDADA', label: 'Reunião Agendada' },
    { value: 'PROPOSTA_ENVIADA', label: 'Proposta Enviada' },
    { value: 'NEGOCIACAO', label: 'Em Negociação' },
    { value: 'CLIENTE_GANHO', label: 'Cliente Ganho' },
    { value: 'CLIENTE_PERDIDO', label: 'Cliente Perdido' },
    { value: 'DESCARTADO', label: 'Descartado' },
];

interface SavedLeadsProps {
    initialSearch?: string;
}

export function SavedLeads({ initialSearch = '' }: SavedLeadsProps) {
    const allLeads = useQuery(api.business.getAllLeads);
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [cityFilter, setCityFilter] = useState<string>('all');
    const [nicheFilter, setNicheFilter] = useState<string>('all');

    // Extract unique cities and niches
    const uniqueCities = useMemo(() => {
        if (!allLeads) return [];
        return Array.from(new Set(allLeads.map(l => l.city))).sort();
    }, [allLeads]);

    const uniqueNiches = useMemo(() => {
        if (!allLeads) return [];
        return Array.from(new Set(allLeads.map(l => l.niche))).sort();
    }, [allLeads]);

    // Filter logic
    const filteredLeads = useMemo(() => {
        if (!allLeads) return [];

        return allLeads.filter((lead: Lead) => {
            // 1. Text Search Filter (Name)
            const searchLower = searchTerm.toLowerCase();
            const matchesText = lead.name.toLowerCase().includes(searchLower);

            // 2. Status Filter
            const matchesStatus = statusFilter === 'all' || lead.status === statusFilter || (!lead.status && statusFilter === 'NOVO');

            // 3. City Filter
            const matchesCity = cityFilter === 'all' || lead.city === cityFilter;

            // 4. Niche Filter
            const matchesNiche = nicheFilter === 'all' || lead.niche === nicheFilter;

            return matchesText && matchesStatus && matchesCity && matchesNiche;
        });
    }, [allLeads, searchTerm, statusFilter, cityFilter, nicheFilter]);

    return (
        <div className="max-w-4xl mx-auto mt-8">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col gap-4">
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar negócio por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none bg-white"
                        >
                            <option value="all">Todas as Cidades</option>
                            {uniqueCities.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Briefcase className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                            value={nicheFilter}
                            onChange={(e) => setNicheFilter(e.target.value)}
                            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none bg-white"
                        >
                            <option value="all">Todos os Nichos</option>
                            {uniqueNiches.map(niche => (
                                <option key={niche} value={niche}>{niche}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none bg-white"
                        >
                            {CRM_STATUSES.map(status => (
                                <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Results Summary */}
            {allLeads && (
                <div className="mb-4 text-sm text-gray-500 px-1 font-medium">
                    Exibindo {filteredLeads.length} de {allLeads.length} leads salvos.
                </div>
            )}

            <LeadList leads={filteredLeads as Lead[]} loading={allLeads === undefined} />
        </div>
    );
}
