import React, { useState } from 'react';

interface SearchFormProps {
    onSubmit: (data: { city: string; niche: string; limit: number }) => void;
}

export function SearchForm({ onSubmit }: SearchFormProps) {
    const [city, setCity] = useState('');
    const [niche, setNiche] = useState('');
    const [limit, setLimit] = useState<number | ''>(20);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalLimit = limit === '' ? 20 : Number(limit);
        const safeLimit = Math.min(Math.max(finalLimit, 1), 200);
        onSubmit({ city, niche, limit: safeLimit });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 p-4 bg-white shadow rounded-lg max-w-3xl mx-auto mt-8 items-center">
            <input
                type="text"
                placeholder="Cidade (ex: São Paulo)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="flex-[2] border p-2 rounded min-w-[150px]"
                required
            />
            <input
                type="text"
                placeholder="Nicho (ex: Restaurantes)"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="flex-[2] border p-2 rounded min-w-[150px]"
                required
            />
            <div className="flex-[1] flex items-center min-w-[120px]">
                <input
                    type="number"
                    placeholder="Qtd Máx."
                    value={limit}
                    onChange={(e) => setLimit(e.target.value ? Number(e.target.value) : '')}
                    className="w-full border p-2 rounded"
                    list="limit-options"
                    min="1"
                    max="200"
                    title="Limite de leads a extrair (máx 200)"
                />
                <datalist id="limit-options">
                    <option value="20" />
                    <option value="40" />
                    <option value="60" />
                    <option value="80" />
                    <option value="100" />
                    <option value="150" />
                    <option value="200" />
                </datalist>
            </div>
            <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition-colors"
            >
                Buscar
            </button>
        </form>
    );
}
