# apps/web

## Purpose
Frontend em React usando Vite. Este aplicativo provê a interface do usuário para submeter pesquisas (cidade e nicho) e exibe os resultados salvos no banco de dados Convex em tempo real, além de um mapa interativo. Ele NÃO gerencia a raspagem, apenas solicita via REST pra API e desenha na tela a partir das subscriptions do Convex.

## Contents
- `src/components/`: Componentes visuais UI reusáveis (Botões, Inputs de busca, Tabelas de Resultados).
- `src/pages/`: Rotas/Telas (ex: `Home.tsx`).
- `src/lib/`: Instância do cliente do Convex e fetchers REST para o backend.

## Conventions
- Use `TailwindCSS` para toda estilização. 
- Use *absolute imports* se configurado, ou caminhos relativos de forma limpa.
- Todos os arquivos devem ser `tsx` caso contenham componentes React.

## Dependencies
- `@vitejs/plugin-react`, `tailwindcss`
- `convex` (React Client para Hooks)
- Opcional: `@react-google-maps/api` ou `react-leaflet` para desenho de mapas.

## Quality Gates
- O código deve compilar via `tsc` sem erros sob a configuração estrita.

## Example
```tsx
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function LeadList() {
  const leads = useQuery(api.business.getLeads);
  return <div>{leads?.map(l => <span key={l._id}>{l.name}</span>)}</div>;
}
```
