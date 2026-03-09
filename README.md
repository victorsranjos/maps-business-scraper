# 🗺️ Google Maps Business Scraper & CRM

Uma aplicação "full-stack" em formato **Monorepo** construída para extrair, armazenar em tempo real e gerenciar *leads* corporativos através de dados públicos da plataforma [Google Maps Places API (New)](https://developers.google.com/maps/documentation/places/web-service/op-overview).

Este projeto é dividido entre uma API Backend de orquestração de buscas rodando em Fastify (Node.js) e um Frontend veloz em React (Vite), conectados em tempo real através do banco de dados Serverless [Convex](https://www.convex.dev/).

---

## 🎯 Principais Funcionalidades

- **Extração Rápida de Leads:** Digite um "Nicho" e uma "Cidade". O sistema consulta diretamente a infraestrutura oficial do Google Places em background, trazendo dezenas de estabelecimentos com Website, Telefone e Redes Sociais.
- **Armazenamento 100% Offline (Local):** Os dados são isolados num banco de dados Convex que roda diretamente na sua própria máquina (`127.0.0.1:3210`).
- **Real-Time Data (Tempo Real):** Enquanto o Node.js faz os requests na API do Google, a tela em React desenha os leads brotando na base de dados instantaneamente sem precisar usar F5 (Reload).
- **CRM Completo de Vendas:** O sistema inclui um Funil Comercial de ponta-a-ponta. Altere o *Status* de seus contatos livremente (Ex: *Novo Lead*, *Contatado*, *Reunião Agendada*, *Cliente Ganho*, etc.).
- **Filtros Avançados:** Filtros na tela "Meus Leads" populados dinamicamente baseados nas suas cidades raspadas, nichos extraídos, nomes e em cada estágio comercial (Status).
- **Chave Dinâmica do Google (API Key):** Não é preciso programar para adicionar a chave de buscador. Caso queira, basta a pessoa acessar a aba `Configurações` da interface e injetar sua chave particular; ela será criptografada no armazenamento local (cache).

---

## 🏗️ Arquitetura (Monorepo)

O diretório base se divide nessas estruturas principais:

```
maps-business-scraper/
├── .env.local                  # Armazena variáveis sensíveis e URLs
├── apps/
│   ├── api/                    # Backend Node.js de scraping e endpoints
│   └── web/                    # Frontend UI em React (Vite)
├── convex/                     # Schema, Tabelas e Mutações do Banco (TS)
├── package.json                # Declara os workspaces e root dep.
└── README.md                   # Esta documentação
```

---

## 🚀 Como Iniciar o Projeto Localmente

Você precisará iniciar três processos (`3 sub-servidores`) para a aplicação alcançar a funcionalidade conjunta completa. 

Abra o diretório raiz `/maps-business-scraper` em **três painéis de terminal diferentes**:

#### 1. Inicie o Banco de Dados Convex (Terminal 1)
O Convex fará o papel de Servidor Local armazenando e despachando suas tabelas.

```bash
npx convex dev
```
*(Nota: Não feche ou cancele este terminal. Ele garantirá que os esquemas estejam montados e prontos em `127.0.0.1:3210`)*

#### 2. Inicie o Backend (Terminal 2)
Ele rodará a Rest API Node em `http://localhost:3001` aguardando as chamadas para comunicar com o Google.

```bash
npm run dev --workspace=apps/api
```

#### 3. Inicie o Frontend (Terminal 3)
Abre o Vite Server contendo a Interface Visual (React).

```bash
npm run dev --workspace=apps/web
```
*(Ele avisará uma porta URL para acessar no navegador, em regra `http://localhost:5173` ou similar)*

---

## 🔑 Configuração de Autenticação / Google Maps API Key

O núcleo desse scraper necessita do acesso a **Nova API "Places API (New)"** da nuvem da Google Cloud Engine.

Para habilitar que nosso servidor possa conversar com eles:

### Método 1 (Para Teste Individual via Frontend):
1. Com a UI React Front-end aberta na sua tela (Ex: `localhost:5173`), acesse o terceiro botão do menu superior na tela (**Configurações ⚙️**).
2. Adicione ou sobrescreva a barra contendo sua Google Maps API Key `(Geração "AIzaSy...")`. A interface salvará ela no Storage. Use com segurança.

### Método 2 (No lado do Servidor / Variável Root):
1. Verifique se existe um arquivo `.env.local` criado na raiz do seu projeto `maps-business-scraper/`.
2. Troque o valor entre aspas da variável `GOOGLE_MAPS_API_KEY`:

```env
# Exemplo do arquivo
GOOGLE_MAPS_API_KEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

*(Se o frontend não tiver fornecido sua própria cache pessoal na configuração, a API priorizará recorrer ao acesso inserido aqui).*

---

## 📊 Acesso ao Painel do Administrador (Dashboard)

Sua banco de dados Convex possui um "Painel de Comando (Dashboard)" maravilhoso oficial que pode ser acessado em forma de UI visual em qualquer momento. Caso você queira visualizar os *Logs* panteleiros ou editar/deletar tabelas manualmente fora do seu aplictivo, mande num novo terminal o seguinte comando:

```bash
npx convex dashboard
```
*(O próprio Convex abrirá e montará a visualização rica e detalhista na aba do seu web Browser para as bases instanciadas nessa máquina local)*
