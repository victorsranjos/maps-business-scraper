# apps/api

## Purpose
Backend local em Node.js (via Fastify ou Express) projetado primariamente como um "Gerenciador de Tarefas" (Task Manager) e "Crawl Worker". Ele expõe uma API RESTful para o frontend disparar scrapes e usa o Playwright/Crawlee para buscar dados exaustivos no Google Maps e websites. Ele salva os dados terminados usando a biblioteca Node do Convex.

## Contents
- `src/routes/`: Controladores de rotas HTTP.
- `src/scraper/`: Orquestração pesada do browser, Crawlers.
- `src/db/`: Interação com a API Node do Convex (para chamar mutações).

## Conventions
- Códigos assíncronos intensos devem possuir blocos `try/catch` robustos pra não crashar o processo Node.
- Não deixe navegadores Playwright órfãos suspensos na memória; sempre chame `.close()`.
- Exponha rotas que respondam rapidamente com 202 Accepted, desativando o job do Scraper pro background.

## Dependencies
- `fastify` ou `express`, `cors`, `dotenv`
- `crawlee` / `playwright`
- `convex` (Node Client para Mutations em ambientes serveless ou locais)

## Quality Gates
- Nenhum acesso a variaveis de ambiente perdido no meio do código (use um arquivo `config.ts` no `src`).

## Example
```typescript
import { FastifyInstance } from 'fastify';
import { startCrawler } from '../scraper/index';

export default async function routes(app: FastifyInstance) {
    app.post('/api/scrape', async (req, reply) => {
        const { city, niche } = req.body as any;
        
        // Non-blocking: we start the process in background
        startCrawler(city, niche).catch(console.error);

        return reply.status(202).send({ message: "Job accept and started." });
    });
}
```
