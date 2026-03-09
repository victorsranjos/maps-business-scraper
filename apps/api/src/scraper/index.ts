import { log } from 'crawlee';
import { saveLead } from '../db/index.js';
import axios from 'axios';

log.setLevel(log.LEVELS.INFO);

/**
 * Inicia a busca usando a API oficial do Google Places (New)
 */
export async function startCrawler(city: string, niche: string, limit: number = 20, apiKeyOverride?: string) {
    log.info(`Iniciando Google Places API (New) para ${niche} em ${city} (Limite max: ${limit})...`);
    const query = `${niche} em ${city}`;

    // Priority for the user-provided API key from the frontend
    const apiKey = apiKeyOverride || process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        log.error("GOOGLE_MAPS_API_KEY não foi provida (nem pelo config, nem pelo ambiente)! A busca usando API foi cancelada.");
        return;
    }

    let pageToken: string | undefined = undefined;
    let pageCount = 0;
    let totalSaved = 0;
    const maxPages = 10; // Para evitar loops infinitos acidentais ou alto custo
    const searchUrl = `https://places.googleapis.com/v1/places:searchText`;

    try {
        log.info('Chamando Google Places API (New) text search...');

        while (pageCount < maxPages && totalSaved < limit) {
            pageCount++;
            log.info(`Buscando Página ${pageCount}...`);

            const requestBody: any = {
                textQuery: query
            };

            if (pageToken) {
                requestBody.pageToken = pageToken;
            }

            const searchResponse = await axios.post(searchUrl, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    // O FieldMask determina o que você quer de volta, economizando a busca adicional de "details"
                    'X-Goog-FieldMask': 'places.displayName,places.nationalPhoneNumber,places.websiteUri,nextPageToken'
                }
            });

            const places = searchResponse.data.places || [];
            log.info(`Achados ${places.length} negócios na Página ${pageCount}.`);

            for (let i = 0; i < places.length; i++) {
                if (totalSaved >= limit) {
                    log.info(`Limite definido pelo usuário de ${limit} leads foi alcançado.`);
                    break;
                }

                const place = places[i];

                const name = place.displayName?.text || query;
                const phone = place.nationalPhoneNumber || '';
                const website = place.websiteUri || '';

                log.info(`Lead extraído: ${name} | ${website} | ${phone}`);

                let email = undefined;
                let instagram = undefined;
                let facebook = undefined;

                try {
                    // Salva no banco em "stream/tempo real"
                    await saveLead({
                        name,
                        niche,
                        city,
                        phone: phone || undefined,
                        website: website || undefined,
                        email,
                        instagram,
                        facebook
                    });
                    totalSaved++;
                } catch (err) {
                    log.error(`Erro buscando detalhes para o local ${name}`, err as any);
                }
            }

            if (totalSaved >= limit) {
                break;
            }

            // Atualiza o token para a próxima página
            pageToken = searchResponse.data.nextPageToken;

            if (!pageToken) {
                log.info(`Não há mais páginas (nextPageToken vazio). Encerrando buscas.`);
                break;
            } else {
                log.info(`Próxima página identificada. Aguardando 2s antes da próxima chamada...`);
                // O Google Places API requer que esperemos um curto período (geralmente 2s) antes que o nextPageToken torne-se válido.
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (pageCount >= maxPages) {
            log.warning(`Limite interno de segurança atingido (${maxPages} páginas). Buscas interrompidas.`);
        }

    } catch (e: any) {
        if (e.response && e.response.data) {
            log.error('Erro detalhado da Google Places API:', e.response.data);
        } else {
            log.error('Erro processando chamadas para a Google Places API:', e);
        }
    }

    log.info(`Buscas finalizadas para: ${query} ! Total extraído: ${totalSaved}`);
}
