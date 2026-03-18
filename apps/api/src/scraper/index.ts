import { log } from 'crawlee';
import { saveLead } from '../db/index.js';
import axios from 'axios';

log.setLevel(log.LEVELS.INFO);

/**
 * Gera variações de query para tentar superar o limite de ~60 resultados por busca da Places API.
 * Ex: "Advogado em São Paulo", "Escritório de Advogado em São Paulo", "Advogado empresarial em São Paulo", etc.
 */
function buildQueryVariations(niche: string, city: string): string[] {
    const base = `${niche} em ${city}`;
    const synonymPrefixes = ['Escritório de', 'Empresa de', 'Serviços de', 'Studio de'];
    const adjectives = [
        'empresarial', 'trabalhista', 'civil', 'criminal', 'tributário',
        'familiar', 'imobiliário', 'digital', 'internacional', 'consultivo',
    ];

    const queries: string[] = [base];

    // "Escritório de Advogado em SP"
    for (const prefix of synonymPrefixes) {
        queries.push(`${prefix} ${niche} em ${city}`);
    }

    // "Advogado empresarial em SP"
    for (const adj of adjectives) {
        queries.push(`${niche} ${adj} em ${city}`);
    }

    return queries;
}

/**
 * Busca uma única query na Places API e retorna os resultados de TODAS as páginas disponíveis.
 */
async function fetchAllPagesForQuery(
    query: string,
    apiKey: string,
    maxToFetch: number
): Promise<{ name: string; phone: string; website: string }[]> {
    const searchUrl = `https://places.googleapis.com/v1/places:searchText`;
    const results: { name: string; phone: string; website: string }[] = [];
    let pageToken: string | undefined = undefined;

    while (results.length < maxToFetch) {
        const requestBody: any = { textQuery: query };
        if (pageToken) requestBody.pageToken = pageToken;

        const response = await axios.post(searchUrl, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'places.displayName,places.nationalPhoneNumber,places.websiteUri,nextPageToken',
            },
        });

        const places = response.data.places || [];
        for (const place of places) {
            if (results.length >= maxToFetch) break;
            results.push({
                name: place.displayName?.text || query,
                phone: place.nationalPhoneNumber || '',
                website: place.websiteUri || '',
            });
        }

        pageToken = response.data.nextPageToken;
        if (!pageToken || places.length === 0) break;

        // Google requires a short pause before the nextPageToken becomes valid
        await new Promise(r => setTimeout(r, 2000));
    }

    return results;
}

/**
 * Inicia a busca usando a API oficial do Google Places (New).
 * Usa múltiplas variações de query para superar os ~60 resultados por busca.
 */
export async function startCrawler(city: string, niche: string, limit: number = 20, apiKeyOverride?: string) {
    log.info(`Iniciando Google Places API (New) para ${niche} em ${city} (Limite max: ${limit})...`);

    const apiKey = apiKeyOverride || process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        log.error('GOOGLE_MAPS_API_KEY não foi provida! A busca foi cancelada.');
        return;
    }

    const queries = buildQueryVariations(niche, city);
    log.info(`Estratégia: ${queries.length} variações de query para atingir ${limit} leads.`);

    const seenNames = new Set<string>();
    let totalSaved = 0;

    for (const query of queries) {
        if (totalSaved >= limit) break;

        log.info(`Rodando query: "${query}"...`);

        try {
            const remaining = limit - totalSaved;
            const batch = await fetchAllPagesForQuery(query, apiKey, remaining);

            log.info(`Query retornou ${batch.length} resultados brutos.`);

            for (const { name, phone, website } of batch) {
                if (totalSaved >= limit) break;

                // Deduplication: normalise name (lower, trim) to avoid saving the same place twice
                const nameKey = name.toLowerCase().trim();
                if (seenNames.has(nameKey)) {
                    log.info(`Duplicado ignorado: ${name}`);
                    continue;
                }
                seenNames.add(nameKey);

                log.info(`Lead extraído: ${name} | ${website} | ${phone}`);

                try {
                    await saveLead({
                        name,
                        niche,
                        city,
                        phone: phone || undefined,
                        website: website || undefined,
                    });
                    totalSaved++;
                } catch (err) {
                    log.error(`Erro ao salvar ${name}`, err as any);
                }
            }
        } catch (e: any) {
            if (e.response?.data) {
                log.error(`Erro na query "${query}":`, e.response.data);
            } else {
                log.error(`Erro na query "${query}":`, e);
            }
        }
    }

    log.info(`Buscas finalizadas! Total extraído: ${totalSaved} / ${limit}`);
}
