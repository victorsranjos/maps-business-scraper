# Maps Business Scraper — Project Root

## Project Overview
O Maps Business Scraper é uma aplicação monorepo composta por uma interface React focada na experiência do usuário para buscar contatos comerciais e uma API Node.js robusta que orquestra automação de navegador (Playwright/Crawlee) para extração de dados públicos (nome, website, nicho, telefones e redes sociais). A aplicação utiliza o servidor Convex para armazenamento de dados centralizado e atualizações em tempo real no frontend.

## Tech Stack
| Layer | Technology | Rationale |
|---|---|---|
| Gerenciador de Pacotes | `npm` (Workspaces) | Suporte nativo e robusto para monorepos. |
| Backend API | Node.js + Fastify | Fastify oferece processamento rápido e baixo overhead. |
| Web Scraper | Playwright / Crawlee | Extração de páginas dinâmicas. |
| Frontend Web | React (Vite) + Tailwind CSS | Performance e padronização. |
| Database / Realtime | Convex | Armazenamento persistente e dados realtime. |

## How The Codebase Is Organized
- `apps/web/`: Frontend em React/Vite responsável por receber a "cidade" e "nicho", e listar leads salvos.
- `apps/api/`: Backend em Node.js/Fastify, recebe solicitações para iniciar a esteira do web scraper.
- `packages/config/`: Configurações compartilhadas JSON/JS do monorepo.
- `convex/`: Esquemas de tabelas, actions e queries do backend Serverless Convex.

## AI Agent Ground Rules
1. Sempre verifique o `ARCHITECTURE.md` na raiz para entender o fluxo de dados.
2. Todas as chaves da API devem vir das variáveis de ambiente usando `dotenv` na API ou `import.meta.env` no Vite.
3. Use o `npm run dev` nos workspaces para testar seu código, mas inicie sempre os *dois*: Frontend e API.
4. Mutações e Queries para dados *sempre* passam pelo banco de dados Convex. O backend de Node serve apenas como worker intenso de scraping.

## Entry Points
- Dev server (API): `npm run dev --workspace=apps/api`
- Dev server (Web): `npm run dev --workspace=apps/web`
- Scripts de raspagem rodarão via chamadas REST ou na inicialização do server.
