import { useState, useMemo } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { LeadList, Lead } from "./LeadList";
import { Search, Filter, MapPin, Briefcase, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportLeadsToCsv } from '../lib/exportCsv';

const PAGE_SIZE = 20;

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
    const [currentPage, setCurrentPage] = useState(1);

    const resetPage = () => setCurrentPage(1);

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
            const searchLower = searchTerm.toLowerCase();
            const matchesText = lead.name.toLowerCase().includes(searchLower);
            const matchesStatus = statusFilter === 'all' || lead.status === statusFilter || (!lead.status && statusFilter === 'NOVO');
            const matchesCity = cityFilter === 'all' || lead.city === cityFilter;
            const matchesNiche = nicheFilter === 'all' || lead.niche === nicheFilter;
            return matchesText && matchesStatus && matchesCity && matchesNiche;
        });
    }, [allLeads, searchTerm, statusFilter, cityFilter, nicheFilter]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pagedLeads = filteredLeads.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setter(e.target.value);
        resetPage();
    };

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
                        onChange={handleFilterChange(setSearchTerm)}
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
                            onChange={handleFilterChange(setCityFilter)}
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
                            onChange={handleFilterChange(setNicheFilter)}
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
                            onChange={handleFilterChange(setStatusFilter)}
                            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none bg-white"
                        >
                            {CRM_STATUSES.map(status => (
                                <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Results Summary + Export */}
            {allLeads && (
                <div className="mb-4 flex items-center justify-between px-1">
                    <span className="text-sm text-gray-500 font-medium">
                        {filteredLeads.length} leads encontrados — página {safePage} de {totalPages}
                    </span>
                    <button
                        onClick={() => exportLeadsToCsv(filteredLeads as Lead[], `leads-${nicheFilter !== 'all' ? nicheFilter + '-' : ''}${cityFilter !== 'all' ? cityFilter + '-' : ''}${new Date().toISOString().slice(0, 10)}.csv`)}
                        disabled={filteredLeads.length === 0}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Exportar CSV ({filteredLeads.length})
                    </button>
                </div>
            )}

            <LeadList leads={pagedLeads as Lead[]} loading={allLeads === undefined} />

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        className="flex items-center gap-1 px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
                            .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((item, idx) =>
                                item === '...' ? (
                                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                                ) : (
                                    <button
                                        key={item}
                                        onClick={() => setCurrentPage(item as number)}
                                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${safePage === item
                                            ? 'bg-blue-600 text-white shadow'
                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        {item}
                                    </button>
                                )
                            )}
                    </div>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        className="flex items-center gap-1 px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Próxima <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

