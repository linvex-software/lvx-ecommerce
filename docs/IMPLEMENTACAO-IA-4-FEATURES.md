# Guia de Implementação – 4 Features com IA (Sequência Sugerida)

Este documento detalha **como implementar** as quatro primeiras features com IA na ordem sugerida: pré-requisitos, o que já existe no projeto, passos técnicos e checklist por feature.

---

## Pré-requisitos gerais (todas as features)

### 0. FAQ e página FAQ (já existem – não duplicar)

O projeto **já tem** uma página de Perguntas Frequentes (FAQ) e o componente FAQ:

- **Página:** slug `faq`, criada via script `scripts/create-institutional-pages.ts` ou no Admin → Editor → Páginas. Conteúdo em **`landing_pages.content_json`** (Craft.js).
- **Componente FAQ:** `apps/admin/components/store/faq.tsx` e `apps/web/components/store/faq.tsx` (props: `title`, `items` = array de `{ question, answer }`).
- **Links:** Footer e navbar já apontam para `/faq`. Ver `docs/INSTITUCIONAL-PAGES.md`.

Para o **Chatbot (Feature 4)**, não criar nova tabela de FAQ nem tela admin de “perguntas e respostas do chat”. O chatbot deve **extrair** as perguntas/respostas do `content_json` da página com slug `faq` (LandingRepository.findBySlug).

---

### 1. Provedor de IA: Google Gemini

O projeto usa **Google Gemini** (API de IA do Google). É mais barato que OpenAI em muitos casos e tem free tier generoso.

#### Como obter a API Key do Gemini

1. **Acesse o Google AI Studio**  
   - Abra: [aistudio.google.com](https://aistudio.google.com)  
   - Faça login com sua conta Google.

2. **Obtenha a chave da API**  
   - No menu lateral (ou na página inicial), clique em **“Get API key”** / **“Obter chave de API”**.  
   - Clique em **“Create API key”** / **“Criar chave de API”**.  
   - Escolha um projeto do Google Cloud (ou crie um novo, se pedir).  
   - A chave será exibida uma vez (ex.: `AIza...`). **Copie e guarde** em local seguro.

3. **Configure no projeto**  
   - No `.env` na raiz do projeto, adicione:  
     `GEMINI_API_KEY=AIza...`  
   - **Nunca** commite a chave no Git; use apenas em servidor (API).

4. **Limites (free tier)**  
   - O Gemini tem cota gratuita por minuto/dia (consulte [ai.google.dev](https://ai.google.dev) → Pricing / Rate limits).  
   - Para uso além do free tier, é preciso ativar cobrança no Google Cloud; mesmo assim o custo por token costuma ser menor que o da OpenAI.

- **Abstração no código:** criar um **cliente de IA** na API (ex.: `apps/api/src/infra/ai/gemini-client.ts`) que chama a API do Gemini. Os use cases dependem de uma interface (ex.: `IAProvider.generateText(prompt)`), sem acoplar ao provedor.

### 2. Onde colocar a lógica de IA na API

- **Camada de aplicação:** use cases que montam o prompt e interpretam a resposta (ex.: `application/ai/use-cases/generate-product-description.ts`).  
- **Camada de infra:** cliente que faz a chamada à API do Gemini (ex.: `infra/ai/gemini-client.ts`).  
- **Regra:** domain e application **não** importam detalhes do provedor; o use case depende de uma interface (ex.: `IAProvider.generateText(prompt)`).

### 3. Variáveis de ambiente (exemplo)

```env
# .env na raiz (já existente; adicionar)
GEMINI_API_KEY=AIza...
# Opcional: limite por loja/mês para custo
AI_MAX_REQUESTS_PER_STORE_PER_MONTH=500
```

### 4. Pacotes necessários (API)

- Para **Gemini**: pacote `@google/generative-ai` (npm/pnpm).  
  - Instalar em `apps/api`: `pnpm add @google/generative-ai`  
- Documentação: [ai.google.dev](https://ai.google.dev) → Get started with the Gemini API.

---

## O que já existe no projeto (resumo geral)

Para não duplicar trabalho, abaixo está o que **já existe** e pode ser reutilizado nas 4 features.

### FAQ e página FAQ (Feature 4 – Chatbot)

- Página institucional com slug `faq` em **`landing_pages`** (`content_json` Craft.js).
- Componente FAQ em `apps/admin/components/store/faq.tsx` e `apps/web/components/store/faq.tsx` (props: `title`, `items`).
- Links para `/faq` no Footer e navbar. Ver secção “0. FAQ” acima.

### Produtos relacionados por categoria (Feature 3 – Recomendações)

- **Web PDP:** componente **`RelatedProducts`** em `apps/web/app/products/[slug]/page.tsx` – chama `GET /products?category_id=${categoryId}&limit=4`, filtra o produto atual e exibe “Você também pode gostar”.
- **API:** `GET /products` já aceita `category_id` e `limit`; `ProductRepository` já lista por categoria.
- **Conclusão:** “Produtos da mesma categoria” já existe. A **Feature 3** adiciona **“Quem comprou isso também comprou”** (co-compra via `order_items`) – pode ser um bloco adicional na PDP ou um endpoint `/products/:id/recommendations` que retorna por co-compra (e opcionalmente fallback por categoria).

### Reviews (Feature 2 – Respostas a reviews)

- **Banco:** `product_reviews` (rating, product_id, order_item_id, customer_id, tags). **Não** existe hoje campo `comment` (texto do cliente) nem `reply` (resposta da loja) – precisam de migration.
- **API:** `list-reviews` por produto, `update-visibility` (ocultar/exibir), `create-review` (catalog). Rotas admin em `review-routes.ts` (PATCH visibility).
- **Admin:** não há tela dedicada de listagem de reviews (apenas rota PATCH). Ao implementar Feature 2, definir onde o lojista vê as reviews (ex.: dentro do produto no admin, ou página “Avaliações”) e aí colocar “Sugerir resposta” e “Resposta da loja”.

### Config da loja e chat (Feature 4 – Chatbot)

- **`store_settings`** existe em `packages/db` com **`config_json`** (Record&lt;string, unknown&gt;). Pode guardar `chat_enabled` e `chat_human_link` (ou e-mail) **sem nova tabela** – desde que haja (ou se crie) um repositório/use case que leia e escreva esse JSON.
- **`get-store-general-settings`** lê da tabela **`stores`** (nome, whatsapp, email, etc.), não de `store_settings`. Se quiser “chat ativado” em config da loja, usar `store_settings.config_json` ou um campo em `stores`/outra config existente.

### Analytics e eventos (Feature 3 – opcional)

- **`analytics_events`** existe (store_id, session_id, event_type, metadata_json). Se no futuro a web enviar eventos de visualização de produto (ex.: `page_view` com product_id), a recomendação “Você pode gostar” pode usar esse histórico; por enquanto a Feature 3 pode usar só **co-compra** (order_items).

### Virtual try-on e “recomendação”

- Existe algoritmo de **recomendação de tamanho** (provador virtual) em `apps/web/components/virtual-tryon/algorithm.ts` – é **recomendação de tamanho** (medidas → tamanho sugerido), **não** recomendação de produtos. Não conflita com a Feature 3.

---

## Feature 1 – Geração de descrições de produtos

### Objetivo
Botão no formulário de produto (admin) que chama a IA para gerar a “Descrição curta” a partir de nome, categoria e atributos; o lojista pode usar ou editar.

### O que já existe no projeto

- **Banco:** `products.description` (text, opcional) – já existe.  
- **Admin:** `apps/admin/components/products/product-form.tsx` – campo “Descrição curta” (`description`) no formulário.  
- **API:** `PUT /admin/products/:id` e `POST /admin/products` – já recebem `description`.  
- **Use cases:** `create-product`, `update-product` em `application/catalog/use-cases/`.

### O que precisa ser criado

| Onde | O quê |
|------|--------|
| `packages/db` | Nada (description já existe). |
| `apps/api` | Serviço de IA (infra), use case “gerar descrição”, endpoint, validação. |
| `apps/admin` | Botão “Gerar com IA” ao lado do campo Descrição, chamada à API, preenchimento do campo. |

### Passo a passo técnico

#### 1. API – Infra: cliente de IA (Gemini)

- Arquivo: `apps/api/src/infra/ai/gemini-client.ts` (ou `ai-provider.ts`).
- Função: receber um prompt (string) e retornar o texto gerado.
- Usar `GEMINI_API_KEY` de `process.env`.
- Usar o SDK `@google/generative-ai`: `GoogleGenerativeAI` com modelo ex.: `gemini-2.0-flash` ou `gemini-1.5-flash` (barato e rápido).
- Tratar erro (rede, limite, etc.) e lançar erro de domínio se falhar.

#### 2. API – Use case

- Arquivo: `apps/api/src/application/ai/use-cases/generate-product-description.ts`.
- Input: `{ name, categoryNames?, attributes? }` (nome do produto, categorias, atributos opcionais).
- Montar prompt em português, por exemplo: “Gere uma descrição curta de e-commerce para o produto: [nome]. Categorias: [X]. Seja persuasivo e objetivo, até 2–3 frases.”
- Chamar o cliente de IA; retornar `{ description: string }`.
- Não acessar banco; só geração de texto.

#### 3. API – Rota e controller

- Rota: `POST /admin/products/generate-description` (ou `POST /admin/ai/generate-product-description`).
- Body: `{ name: string, category_names?: string[], attributes?: Record<string, string> }`.
- Middlewares: `requireAuth`, `tenantMiddleware`, `requireRole(['admin','operador'])`.
- Controller chama o use case e devolve `{ description }` em JSON.
- Registrar a rota em `server.ts`.

#### 4. Admin – Formulário de produto

- Em `product-form.tsx`, ao lado do label “Descrição curta”, adicionar botão “Gerar com IA”.
- Ao clicar: chamar `POST /admin/products/generate-description` com nome (e, se já tiver, categorias do form).
- Ao receber resposta: preencher o campo `description` do formulário (ex.: `setValue('description', data.description)`).
- Estados: loading (botão desabilitado ou “Gerando…”), erro (toast ou mensagem abaixo do botão).

### Checklist Feature 1

- [ ] Variável `GEMINI_API_KEY` no `.env` e no ambiente de deploy (chave obtida em [aistudio.google.com](https://aistudio.google.com) → Get API key).
- [ ] Criar `infra/ai/gemini-client.ts` (ou abstração com interface).
- [ ] Instalar `@google/generative-ai` em `apps/api`.
- [ ] Criar use case `generate-product-description.ts`.
- [ ] Criar rota `POST /admin/products/generate-description` (ou `/admin/ai/...`) e registrar em `server.ts`.
- [ ] No admin: botão “Gerar com IA” no product form; preencher `description` com a resposta.
- [ ] Tratamento de erro (API indisponível, limite) e feedback na UI.
- [ ] Documentar no README ou em `docs/` que a feature usa Gemini e precisa da chave.

---

## Feature 2 – Respostas automáticas a reviews

### Objetivo
Para cada avaliação, o lojista pode clicar em “Sugerir resposta com IA” e a IA sugere um texto (agradecimento ou pedido de desculpas + oferta de contato); o lojista edita e publica.

### O que já existe no projeto

- **Banco:** `product_reviews` com `rating`, `product_id`, `order_item_id`, `customer_id`. **Não** existe hoje campo de texto escrito pelo cliente (comentário) nem resposta da loja.
- **API:** `list-reviews` por produto, `update-visibility` (ocultar/exibir). Não há “resposta da loja” nem “comentário do cliente” no schema atual.
- **Admin:** Rotas de reviews em `review-routes.ts`; provavelmente uma tela de listagem de reviews por produto.

### O que precisa ser criado

| Onde | O quê |
|------|--------|
| `packages/db` | Colunas `comment` (texto do cliente) e `reply` (resposta da loja) em `product_reviews`; migration. |
| `apps/api` | Use case “sugerir resposta”, endpoint; use case “atualizar resposta” (salvar reply). |
| `apps/admin` | Na tela de reviews: exibir comentário e resposta; botão “Sugerir resposta com IA”; campo para editar e salvar a resposta. |

### Passo a passo técnico

#### 1. Banco – Novas colunas

- Em `packages/db/src/schema/reviews.ts`, na tabela `product_reviews`, adicionar:
  - `comment: text('comment')` – comentário opcional do cliente.
  - `reply: text('reply')` – resposta opcional da loja.
- Rodar `pnpm db:generate` e depois `pnpm db:migrate`.
- Atualizar tipos e repositório onde leem/escrevem review.

#### 2. API – Use case “sugerir resposta”

- Arquivo: `apps/api/src/application/ai/use-cases/suggest-review-reply.ts`.
- Input: `{ rating: number, comment?: string }` (1–5 e texto do cliente, se houver).
- Prompt: “O cliente deu nota [X] e comentário: [comment]. Gere uma resposta curta e profissional da loja: se positivo, agradecer; se negativo, pedir desculpas e oferecer contato. Máximo 2–3 frases.”
- Retornar `{ suggested_reply: string }`.

#### 3. API – Endpoints

- `POST /admin/products/:productId/reviews/:reviewId/suggest-reply`  
  - Body opcional: `{}`.  
  - Controller busca a review (rating + comment), chama o use case de sugestão e devolve `{ suggested_reply }`.  
  - Middlewares: auth + tenant + role admin.

- `PATCH /admin/products/:productId/reviews/:reviewId` (pode estender o existente)  
  - Body: `{ reply: string }` (e manter `is_hidden` se já existir).  
  - Use case ou método no repositório que atualiza `reply` e `updated_at`.

#### 4. API – Review repository e create-review

- No repositório de reviews: em `create` e em `listByProduct`, incluir `comment` e `reply`.
- No use case `create-review` (e no schema Zod do catalog/controller que cria review): aceitar `comment?: string` e persistir em `product_reviews.comment`. Assim, no futuro, o cliente pode escrever um comentário ao avaliar.

#### 5. Admin – UI de reviews

- Onde as reviews são listadas (por produto ou centralizada): para cada review, exibir `comment` (se houver) e `reply` (se houver).
- Botão “Sugerir resposta com IA”: chama `POST .../suggest-reply` e preenche o campo de resposta com `suggested_reply`.
- Campo de texto para “Resposta da loja” e botão “Salvar resposta” que chama `PATCH .../reviews/:reviewId` com `{ reply }`.
- Lembrete: botões dentro de modais devem ter `data-modal-button="true"` (regras do projeto).

### Checklist Feature 2

- [ ] Migration: adicionar `comment` e `reply` em `product_reviews`; rodar migrate.
- [ ] Atualizar `ReviewRepository` e tipos (create, list, update reply).
- [ ] Opcional: aceitar `comment` no create-review (catalog) para comentários dos clientes.
- [ ] Use case `suggest-review-reply.ts` e cliente de IA.
- [ ] Rota `POST .../reviews/:reviewId/suggest-reply` e `PATCH .../reviews/:reviewId` com `reply`.
- [ ] Admin: exibir comment/reply; botão “Sugerir resposta com IA”; campo e “Salvar resposta”.
- [ ] Tratamento de erro e loading na UI.

---

## Feature 3 – Recomendação de produtos (“Quem comprou isso também comprou”)

### Objetivo
Na loja (web), exibir um bloco **“Quem comprou isso também comprou”** usando **co-compra** (produtos que aparecem nos mesmos pedidos). **“Você também pode gostar” por categoria** já existe (ver secção “O que já existe no projeto” acima).

### O que já existe no projeto

- **Produtos relacionados por categoria:** na PDP já existe o componente **`RelatedProducts`** que chama `GET /products?category_id=X&limit=4` e exibe “Você também pode gostar”. **Não duplicar** – é por categoria.
- **Banco:** `orders`, `order_items` (product_id, order_id), `carts`, `cart_items`; `analytics_events` (event_type, metadata_json, session_id). Dá para fazer “quem comprou X também comprou Y” via `order_items`.
- **API:** listagem de produtos por loja (`GET /products` com `category_id`); **não** existe endpoint de “recomendações por co-compra” ainda.
- **Web:** PDP já tem `RelatedProducts` (por categoria). Falta um bloco ou componente para **recomendações por co-compra** (ou um único componente que mostre os dois: “Mesma categoria” + “Quem comprou também comprou”).

### O que precisa ser criado

| Onde | O quê |
|------|--------|
| `packages/db` | Nada (usar orders + order_items; opcionalmente analytics_events). |
| `apps/api` | Use case “recomendações” (lógica por co-compra ou regras), endpoint público. |
| `apps/web` | Componente “Produtos recomendados”; chamar API e exibir na PDP e/ou carrinho. |

### Passo a passo técnico

#### 1. API – Lógica de recomendação (sem IA pesada no início)

- **Fase 1 – Regras:**
  - “Quem comprou X também comprou”:  
    - Dado `product_id` e `store_id`, buscar em `order_items` outros `product_id` que aparecem nos mesmos pedidos (mesmo `order_id`).  
    - Contar co-ocorrências, ordenar por contagem, devolver top N (ex.: 8) produtos distintos (excluindo o próprio produto).
  - “Você pode gostar”:  
    - Se tiver `customer_id` ou `session_id`: produtos que esse cliente/sessão já viu ou colocou no carrinho (se tiver dados); senão, fallback para “mais vendidos” ou “mesma categoria” (usar `products` + `categories` / `order_items` para “mais vendidos”).

- **Fase 2 (opcional):** usar IA para ranquear ou filtrar (ex.: “dentre os 20 co-comprados, ranquear por relevância”). Pode vir depois.

#### 2. API – Use case e repositório

- Arquivo: `apps/api/src/application/recommendations/use-cases/get-product-recommendations.ts`.
- Input: `storeId`, `productId` (para “também comprou”), opcional `customerId` ou `sessionId` (para “pode gostar”), `limit`.
- Dependências: repositório que consulta `order_items` + `orders` (e, se usar, `cart_items` ou `analytics_events`). Queries com `store_id` em tudo (multi-tenant).
- Retorno: lista de produtos (id, name, slug, price, image, etc.) para não expor dados internos.

#### 3. API – Endpoint

- Rota: `GET /products/:productId/recommendations?limit=8` (ou `GET /store/products/recommendations?product_id=...&limit=8`).
- Header `x-store-id` obrigatório (rota pública da loja).
- Controller chama o use case e devolve `{ products: [...] }`.
- Não precisa de auth (é página pública).

#### 4. Web – Componente e dados

- Componente: ex.: `RecommendationsBlock` ou `ProductRecommendations` que recebe `productId` e `storeId` (ou pega do contexto da loja).
- Chamar `GET /products/:productId/recommendations` (usando a URL da API da loja e `x-store-id`).
- Exibir em grid/lista (reutilizar card de produto já existente na web).
- Colocar na PDP (abaixo do produto) e, se fizer sentido, no carrinho (“Completar compra com…”).

#### 5. Cache (recomendado)

- Recomendações por produto mudam pouco; cachear por `store_id` + `product_id` (ex.: 1 hora em Redis ou em memória) para não recalcular a cada page view.
- Se não tiver Redis, usar cache em memória com TTL (ex.: Map com timestamp de expiração).

### Checklist Feature 3

- [ ] Implementar repositório ou queries que retornem “produtos co-comprados” por `product_id` e `store_id`.
- [ ] Use case `get-product-recommendations.ts` com fallback (ex.: mais vendidos ou mesma categoria).
- [ ] Rota `GET /products/:productId/recommendations` (ou equivalente) com `x-store-id`; multi-tenant.
- [ ] Componente na web que chama a API e exibe os produtos na PDP (e opcionalmente no carrinho).
- [ ] Cache (memória ou Redis) para reduzir carga.
- [ ] Testes manuais: produto com muitas compras vs produto sem compras (fallback).

---

## Feature 4 – Chatbot (FAQ + produtos)

### Objetivo
Widget de chat na loja que responde perguntas sobre frete, troca, horário e produtos (nome, preço, link), usando a **página FAQ já existente** como base de conhecimento + IA.

---

### O que JÁ EXISTE no projeto (não duplicar)

#### Página FAQ e componente FAQ

- **Página FAQ:** Já existe uma página institucional com slug `faq` (“Perguntas Frequentes”), criada pelo script `scripts/create-institutional-pages.ts` ou manualmente no Admin → Editor → Páginas. O conteúdo é salvo em **`landing_pages`** (`content_json` em formato Craft.js).
- **Componente FAQ:** Existe em **admin** e **web** com a mesma interface:
  - `apps/admin/components/store/faq.tsx` – FAQ com Craft.js (FAQSettings, props: `title`, `items`).
  - `apps/web/components/store/faq.tsx` – FAQ idêntico para a loja.
- **Estrutura do conteúdo:** O `content_json` da página FAQ contém nós Craft.js; o bloco do FAQ tem `type.resolvedName: 'FAQ'` e `props.items` = array de `{ question, answer }`.
- **Links:** Footer e navbar já linkam para `/faq` (ver `Footer.tsx`, `navbar-controller.ts`).
- **Documentação:** `docs/INSTITUCIONAL-PAGES.md` descreve a página FAQ e como editar.
- **API de páginas:** `LandingRepository.findBySlug(slug, storeId)` já retorna a página com `contentJson`. Rota pública: `GET /store/dynamic-pages/:slug` (com `x-store-id`).

**Conclusão:** Não criar nova tabela de FAQ nem tela admin separada para “perguntas e respostas do chat”. O lojista já edita o FAQ no **Editor → Páginas → editar página FAQ**. O chatbot deve **extrair** as perguntas/respostas do `content_json` da página com slug `faq`.

---

### O que precisa ser criado (apenas chat + extração de FAQ)

| Onde | O quê |
|------|--------|
| `packages/db` | Apenas tabelas: `chat_sessions`, `chat_messages`. **Não** criar `store_knowledge_base` / `store_faq`. |
| `apps/api` | Função que extrai FAQ do `content_json` da página `faq`; use case de chat; endpoint `POST /chat`; opcional: config “chat ativado” em store_settings. |
| `apps/admin` | Apenas: toggle “Ativar chat na loja” (e opcional “Falar com humano” link/email). **Não** criar tela de CRUD de FAQ – o FAQ já é editado na página FAQ. Guardar em **`store_settings.config_json`** (tabela já existe) ex.: `{ chat_enabled: true, chat_human_link: "https://..." }`. |
| `apps/web` | Widget de chat (flutuante), histórico, input, chamada à API. |

### Passo a passo técnico

#### 1. Banco – Apenas tabelas de chat

- **chat_sessions**:
  - `id`, `store_id`, `session_id` (string, gerado no front), `created_at`, `updated_at`.
  - Índice (store_id, session_id).

- **chat_messages**:
  - `id`, `chat_session_id`, `role` (enum: 'user' | 'assistant'), `content` (text), `created_at`.

- **Não criar** tabela `store_knowledge_base` / `store_faq` – o FAQ vem da página `landing_pages` (slug `faq`).

- Migration: `pnpm db:generate` e `pnpm db:migrate`.

#### 2. API – Extrair FAQ da página FAQ existente

- Criar função/helper (ex.: em `application/chat/` ou `infra/`): **extrairFAQFromLandingPageContent(contentJson)**.
  - Entrada: `content_json` da página (objeto Craft.js com nós `ROOT`, `faq-component`, etc.).
  - Lógica: percorrer os nós; onde `type.resolvedName === 'FAQ'`, ler `props.items` (array de `{ question, answer }`). Pode haver mais de um bloco FAQ na página; concatenar todos os `items`.
  - Saída: `Array<{ question: string, answer: string }>`.
- No use case do chat: buscar a página com slug `faq` via `LandingRepository.findBySlug('faq', storeId)`. Se existir e tiver `contentJson`, chamar `extrairFAQFromLandingPageContent(page.contentJson)` e usar o resultado no prompt da IA. Se não houver página FAQ, usar array vazio (chat ainda pode responder com produtos em destaque).

#### 3. API – Chat

- Use case: `chat-message.ts`.
  - Input: `storeId`, `sessionId`, `message`.
  - Buscar ou criar sessão em `chat_sessions`; buscar últimas N mensagens em `chat_messages`.
  - **Buscar FAQ:** `LandingRepository.findBySlug('faq', storeId)` → extrair FAQ do `contentJson` (helper acima).
  - Opcional: buscar produtos em destaque (top 5) para incluir no contexto.
  - Montar prompt: “Você é o atendente da loja. Base de conhecimento (FAQ): [perguntas e respostas extraídas]. Produtos em destaque: [lista]. Histórico: [mensagens]. Usuário: [message]. Responda de forma curta e útil.”
  - Chamar cliente de IA; salvar mensagem do usuário e do assistente em `chat_messages`; retornar `{ reply: string }`.

- Rota: `POST /chat` (ou `POST /store/chat`).
  - Body: `{ session_id: string, message: string }`.
  - Header: `x-store-id`.
  - Sem auth; validar loja e, se houver flag, “chat ativado”. Rate limit por session_id.

#### 4. Admin – Apenas config do chat (sem tela de FAQ)

- **Não criar** tela “CRUD de FAQ para o chat” – o FAQ já é a página FAQ editada no Editor.
- Criar apenas:
  - Toggle “Ativar chat na loja” e opcional “Falar com humano” (link ou e-mail).
  - Salvar em **`store_settings.config_json`** (tabela já existe em `packages/db`: `store_settings` com `config_json`). Ex.: `{ chat_enabled: true, chat_human_link: "https://..." }`. Se ainda não existir repositório/use case para ler/escrever `store_settings`, criar apenas o necessário para esses campos.
- Pode ser uma seção em Configurações da loja ou em uma página “Chat” que só tenha esses dois campos e um texto explicando que “O conteúdo do chat usa a página Perguntas Frequentes (/faq). Edite essa página no Editor → Páginas.”

#### 5. Web – Widget

- Igual ao planejado: `ChatWidget` flutuante, histórico, input, `POST /chat`, session_id persistido, “Falar com humano” no rodapé, exibir só se chat ativado.

#### 6. Limites e custo

- Igual: limite por sessão ou por loja; opcional limite mensal por plano.

### Checklist Feature 4

- [ ] Migration: apenas `chat_sessions` e `chat_messages`; rodar migrate.
- [ ] Função que extrai FAQ do `content_json` da página (nós com `resolvedName === 'FAQ'`, `props.items`).
- [ ] Use case `chat-message`: buscar página FAQ por slug `faq`, extrair FAQ, montar contexto (FAQ + produtos + histórico), chamar IA, persistir mensagens.
- [ ] Rota `POST /chat` com `x-store-id` e rate limit; multi-tenant.
- [ ] Admin: apenas toggle “Ativar chat” e opcional “Falar com humano”; **não** criar tela de CRUD de FAQ.
- [ ] Web: componente ChatWidget; session_id persistido; exibir apenas se chat ativado.
- [ ] Documentar que o chat usa a página FAQ existente (Editor → Páginas → FAQ) e limites de uso.

---

## Estimativa de custo com IA (por requisição) – Gemini

Os valores abaixo são **estimativas** com base em preços públicos do **Google Gemini** (podem mudar; consulte [ai.google.dev/pricing](https://ai.google.dev/pricing)). Cobrança é por **token** (entrada + saída).

### Preços de referência (Gemini, por 1 milhão de tokens)

| Modelo | Entrada (input) | Saída (output) | Uso sugerido |
|--------|------------------|-----------------|--------------|
| **Gemini 2.0 Flash** | US$ 0,10 | US$ 0,40 | Recomendado para as 4 features (barato e rápido) |
| **Gemini 1.5 Flash** | similar ou menor | similar | Alternativa; free tier generoso |
| **Gemini 2.5 Pro / 1.5 Pro** | ~US$ 1,25 | ~US$ 5–10 | Se precisar de respostas mais elaboradas |

*Valores aproximados; conferir na página de preços do Gemini.*

### Tokens por feature (estimativa por requisição)

| Feature | Input (tokens) | Output (tokens) | Total aprox. |
|---------|-----------------|-----------------|--------------|
| **1. Geração de descrição** | 200–400 (nome, categorias, prompt) | 100–200 (descrição 2–3 frases) | ~500 |
| **2. Sugestão de resposta a review** | 150–300 (rating, comentário, prompt) | 50–150 (resposta curta) | ~400 |
| **3. Recomendações** | 0 (sem IA na fase 1 – só regras) | 0 | 0 |
| **4. Chatbot (1 mensagem)** | 500–1.500 (FAQ + produtos + histórico) | 50–200 (resposta) | ~1.000 |

*Regra prática: em português, ~1 token ≈ 4 caracteres; 100 palavras ≈ 130–150 tokens.*

### Custo por requisição (US$) – usando **Gemini 2.0 Flash**

| Feature | Input | Output | Custo por requisição (aprox.) |
|---------|--------|--------|-------------------------------|
| **1. Geração de descrição** | 300 × US$0,10/1M | 150 × US$0,40/1M | **~US$ 0,00009** (≈ R$ 0,0005) |
| **2. Sugestão de resposta a review** | 250 × US$0,10/1M | 100 × US$0,40/1M | **~US$ 0,000065** (≈ R$ 0,0003) |
| **3. Recomendações** | – | – | **US$ 0** (sem IA na fase 1) |
| **4. Chatbot (1 mensagem)** | 1.000 × US$0,10/1M | 100 × US$0,40/1M | **~US$ 0,00014** (≈ R$ 0,0007) |

Ou seja: com **Gemini 2.0 Flash**, o custo por requisição costuma ser **menor** que com gpt-4o-mini (OpenAI). *Cotação USD: usar valor do dia.*

### Exemplo mensal (Gemini 2.0 Flash)

| Cenário | Feature 1 | Feature 2 | Feature 4 (chat) | Total aprox. (US$) |
|---------|------------|------------|-------------------|---------------------|
| **Loja pequena** | 50 descrições | 20 sugestões | 200 mensagens | ≈ **US$ 0,03** |
| **Loja média** | 200 descrições | 80 sugestões | 1.000 mensagens | ≈ **US$ 0,15** |
| **Loja grande** | 500 descrições | 200 sugestões | 3.000 mensagens | ≈ **US$ 0,45** |

Com **Gemini**, o custo das 4 features costuma ficar **abaixo de US$ 1/mês** por loja em uso moderado. O **free tier** do Gemini ainda pode cobrir parte do uso sem cobrança.

### Como controlar o gasto

1. **Limite por loja:** ex.: máximo de N gerações de descrição ou N mensagens de chat por mês (variável ou `store_settings.config_json`).
2. **Limite por requisição:** ex.: chat com no máximo 10 trocas por sessão; histórico com últimas 5 mensagens só.
3. **Google Cloud / AI Studio:** configurar alertas de uso e, se ativar cobrança, definir orçamento no Google Cloud Console.
4. **Monitorar uso:** usar o dashboard do Google AI Studio ou Google Cloud para ver tokens/requisições consumidos.

*Preços sujeitos a alteração pelo Google; conferir sempre a página oficial de pricing do Gemini.*

---

## Ordem sugerida de implementação

1. **Feature 1 – Geração de descrições**  
   - Poucos pontos de integração; resultado visível rápido no admin.  
   - Dá para usar o mesmo cliente de IA nas próximas.

2. **Feature 2 – Respostas a reviews**  
   - Depende de migration (comment/reply) e de um endpoint de sugestão + um de salvar resposta.  
   - Reaproveita o cliente de IA e o padrão de “prompt + resposta”.

3. **Feature 3 – Recomendações**  
   - Pode ser feita sem IA (regras de co-compra); depois dá para acrescentar IA para ranquear.  
   - Boa para valorizar a loja na web.

4. **Feature 4 – Chatbot**  
   - Novas tabelas apenas para chat (`chat_sessions`, `chat_messages`); **FAQ já existe** (página `/faq` no Editor).  
   - Admin: apenas toggle “Ativar chat” e opcional “Falar com humano”; **não** criar tela de FAQ.  
   - Usa o mesmo cliente de IA e extrai FAQ do `content_json` da página FAQ.

---

## Resumo do que você vai precisar

| Item | Onde / Como |
|------|-------------|
| API Key do Gemini | Obter em [aistudio.google.com](https://aistudio.google.com) → Get API key → Create API key. Variável `GEMINI_API_KEY` no `.env`; nunca no front. |
| Pacote `@google/generative-ai` | Apenas na API (`apps/api`): `pnpm add @google/generative-ai`. |
| Serviço/abstração de IA | `apps/api/src/infra/ai/gemini-client.ts` + use cases em `application/ai/`. |
| Migrations (reviews + chat) | `packages/db`: novas colunas em reviews; apenas `chat_sessions` e `chat_messages` (não criar tabela de FAQ). |
| Novas rotas | Registrar em `server.ts` após criar controllers/routes. |
| Admin | Botões e campos nos forms existentes (produto, reviews) + toggle “Ativar chat” (FAQ já é editado na página FAQ do Editor). |
| Web | Componentes de recomendação e widget de chat; chamadas à API com `x-store-id`. |
| FAQ para o chat | Reutilizar página FAQ existente: extrair FAQ do `content_json` da página com slug `faq` (LandingRepository.findBySlug). |
| Multi-tenant | Todas as queries e rotas filtradas por `store_id`. |
| Custos | Limites por loja ou por plano (variáveis ou tabela de config). |

Se quiser, na próxima etapa podemos detalhar um único fluxo ponta a ponta (por exemplo, Feature 1) com nomes exatos de arquivos e trechos de código adaptados ao seu projeto.
