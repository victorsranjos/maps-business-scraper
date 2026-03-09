import { useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SearchForm } from "./components/SearchForm";
import { LeadList, Lead } from "./components/LeadList";
import { SavedLeads } from "./components/SavedLeads";
import { Settings } from "./components/Settings";
import { Search, ListChecks, Settings as SettingsIcon } from 'lucide-react';

function App() {
    const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'settings'>('search');
    const [searchParams, setSearchParams] = useState<{ city?: string; niche?: string }>({});
    const [isSearching, setIsSearching] = useState(false);

    // Use Convex query to get real-time data based on current search params
    const leadsData = useQuery(api.business.getLeads, {
        city: searchParams.city,
        niche: searchParams.niche
    });

    const handleSearch = async (data: { city: string; niche: string; limit: number }) => {
        setIsSearching(true);
        setSearchParams({ city: data.city, niche: data.niche });

        const localApiKey = localStorage.getItem('google_maps_api_key') || undefined;

        try {
            // Trigger the backend to start scraping
            await fetch('http://localhost:3001/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, apiKey: localApiKey })
            });
            // Muda para a aba "Meus Leads" para o usuário ver os resultados chegando em tempo real
            setActiveTab('saved');
        } catch (e) {
            console.error("Failed to trigger scraper API:", e);
            alert("Falha ao comunicar com a API do scraper.");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="min-h-screen pb-12 bg-gray-50">
            <header className="bg-white shadow-sm border-b p-6 text-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Y&V Maps Outreach Tool
                </h1>
                <p className="mt-2 text-gray-500">
                    Encontre negócios locais, extraia contatos e gerencie clientes.
                </p>

                {/* Tabs Navigation */}
                <div className="flex justify-center mt-8 space-x-4">
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all ${activeTab === 'search'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-blue-300'
                            }`}
                    >
                        <Search className="w-4 h-4" /> Nova Busca
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all ${activeTab === 'saved'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-indigo-300'
                            }`}
                    >
                        <ListChecks className="w-5 h-5" /> Meus Leads
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all ${activeTab === 'settings'
                            ? 'bg-slate-700 text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-slate-300'
                            }`}
                    >
                        <SettingsIcon className="w-5 h-5" /> Configurações
                    </button>
                </div>
            </header>

            <main className="px-4">
                {activeTab === 'search' ? (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        <SearchForm onSubmit={handleSearch} />

                        <div className="mt-8">
                            {isSearching ? (
                                <div className="text-center text-blue-600 animate-pulse py-12">Enviando requisição de busca...</div>
                            ) : (
                                <LeadList leads={leadsData as Lead[]} loading={leadsData === undefined} />
                            )}
                        </div>
                    </div>
                ) : activeTab === 'saved' ? (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        <SavedLeads initialSearch={searchParams.city || ''} />
                    </div>
                ) : (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        <Settings />
                    </div>
                )}
            </main>
        </div>
    )
}

export default App;
