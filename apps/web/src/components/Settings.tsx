import { useState, useEffect } from 'react';
import { Key, Save, AlertCircle } from 'lucide-react';

export function Settings() {
    const [apiKey, setApiKey] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const storedKey = localStorage.getItem('google_maps_api_key');
        if (storedKey) {
            setApiKey(storedKey);
        }
    }, []);

    const handleSave = () => {
        if (apiKey.trim()) {
            localStorage.setItem('google_maps_api_key', apiKey.trim());
        } else {
            localStorage.removeItem('google_maps_api_key');
        }
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="max-w-2xl mx-auto mt-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-slate-50 text-slate-600 rounded-lg">
                    <Key className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Chave de API</h2>
                    <p className="text-sm text-gray-500">Configure a sua própria chave do Google Places</p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                        Google Maps API Key (New Places API)
                    </label>
                    <input
                        id="apiKey"
                        type="password"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 font-mono text-sm"
                        placeholder="AIzaSy..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-sm text-gray-700">
                    <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-blue-800 mb-1">Armazenamento Local e Seguro</p>
                        <p>
                            A sua chave de API fica salva apenas localmente no seu cache do navegador (Local Storage) e não vai para o banco de dados.
                            Ela será enviada secretamente apenas do seu PC para a API na hora de extrair os leads.
                        </p>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        {isSaved ? 'Chave Salva Localmente!' : 'Salvar Chave Local'}
                    </button>
                </div>
            </div>
        </div>
    );
}
