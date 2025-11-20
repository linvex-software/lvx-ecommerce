# Admin Frontend — Documentação Técnica

## 📋 Visão Geral

O **Admin Frontend** é a aplicação web responsável pelo painel administrativo do sistema white-label e-commerce. Construído com **Next.js 15 App Router**, oferece uma interface premium para gerenciamento completo da loja.

**Localização:** `apps/admin`

---

## 🎯 Objetivo

Fornecer uma interface administrativa completa, elegante e profissional para lojistas gerenciarem:
- Dashboard com métricas e visão geral
- Catálogo de produtos (CRUD completo)
- Personalização visual da loja (tema, cores, banners)
- Gestão de cupons e campanhas
- Configurações gerais

---

## 🛠️ Stack Tecnológica

### Core
- **Next.js 15** — Framework React com App Router
- **TypeScript** — Tipagem estática estrita (sem `any`)
- **React 18.3.1** — Biblioteca UI
- **Tailwind CSS** — Estilização utility-first

### UI Components
- **shadcn/ui** — Componentes reutilizáveis premium
- **lucide-react** — Ícones modernos
- **Recharts** — Gráficos e visualizações

### Estado e Dados
- **Zustand** — Gerenciamento de estado global (autenticação)
- **React Query (@tanstack/react-query)** — Cache, sincronização e mutations
- **React Hook Form** — Formulários performáticos
- **Zod** — Validação de schemas

### HTTP Client
- **Axios** — Cliente HTTP com interceptors

---

## 📁 Estrutura de Diretórios

```
apps/admin/
├── app/                          # App Router (Next.js 15)
│   ├── (auth)/                   # Rotas públicas (grupo)
│   │   └── login/
│   │       └── page.tsx         # Tela de login
│   ├── (admin)/                  # Rotas protegidas (grupo)
│   │   ├── layout.tsx            # Layout com proteção de rota
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard principal
│   │   ├── products/             # CRUD de produtos
│   │   │   ├── page.tsx          # Listagem
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # Criar produto
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Editar produto
│   │   └── theme/
│   │       └── page.tsx           # Personalização visual
│   ├── unauthorized/
│   │   └── page.tsx               # Página de acesso negado
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Home (redireciona)
│
├── components/
│   ├── layout/                    # Componentes de layout
│   │   ├── admin-shell.tsx        # Shell principal (sidebar + header + content)
│   │   ├── sidebar.tsx            # Navegação lateral
│   │   └── header.tsx             # Cabeçalho com título dinâmico
│   ├── auth/
│   │   └── login-form.tsx         # Formulário de login
│   ├── dashboard/                 # Componentes do dashboard
│   │   ├── dashboard-content.tsx  # Orquestrador principal
│   │   ├── summary-cards.tsx      # Cards de KPIs
│   │   ├── sales-chart.tsx        # Gráfico de vendas
│   │   ├── top-products.tsx       # Lista de produtos em destaque
│   │   └── operations-card.tsx    # Status operacional
│   ├── products/                  # Componentes de produtos
│   │   ├── product-table.tsx      # Tabela de listagem
│   │   ├── product-filters.tsx   # Filtros de busca
│   │   ├── product-form.tsx       # Formulário (criar/editar)
│   │   └── image-upload.tsx       # Upload de imagens
│   ├── theme/                     # Componentes de tema
│   │   ├── theme-form.tsx         # Formulário de tema
│   │   ├── color-picker.tsx       # Seletor de cores
│   │   ├── banner-manager.tsx     # Gerenciador de banners
│   │   └── live-preview.tsx       # Preview ao vivo da loja
│   ├── ui/                        # Componentes shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── switch.tsx
│   │   └── ...
│   └── providers/
│       └── query-provider.tsx     # Provider do React Query
│
├── lib/
│   ├── api-client.ts              # Cliente Axios configurado
│   └── hooks/                     # Custom hooks React Query
│       ├── use-products.ts       # Hooks de produtos
│       └── use-theme.ts           # Hooks de tema
│
├── store/
│   └── auth-store.ts              # Store Zustand (autenticação)
│
└── app/globals.css                # Estilos globais
```

---

## 🔐 Autenticação e Proteção de Rotas

### Fluxo de Autenticação

1. **Login** (`app/(auth)/login/page.tsx`)
   - Formulário com React Hook Form + Zod
   - Chama `POST /auth/login`
   - Salva `user` + `accessToken` no Zustand (com persist)
   - Redireciona para `/dashboard`

2. **Persistência** (`store/auth-store.ts`)
   - Zustand com middleware `persist`
   - Dados salvos em `localStorage`
   - Sincroniza com `api-client` para interceptors

3. **Proteção de Rotas** (`app/(admin)/layout.tsx`)
   - Verifica autenticação antes de renderizar
   - Verifica role (`admin` ou `operador` permitidos)
   - Redireciona para `/login` se não autenticado
   - Redireciona para `/unauthorized` se role inválida
   - Aguarda hidratação do Zustand (evita redirecionamento após F5)

### Roles e Permissões

```typescript
// Roles permitidas no admin
const ALLOWED_ROLES = ['admin', 'operador']

// 'vendedor' → redirecionado para /unauthorized
```

---

## 🎨 Design System

### Princípios de UI/UX

- **Visual Premium**: Inspirado em e-commerce de moda de alto padrão
- **Clean & Minimalista**: Muito espaço em branco, tipografia elegante
- **Paleta Neutra**: Cinzas quentes, branco, preto + cor primária do tema
- **Componentes Elegantes**: shadcn/ui customizado, não boilerplate genérico

### Tipografia

- **Títulos**: Font sem serifa, peso médio/semibold
- **Textos**: Tamanho confortável, boa legibilidade
- **Hierarquia**: Clara e bem definida

### Espaçamento

- Cards bem separados (`gap-6`, `space-y-6`)
- Padding generoso (`p-6`, `px-8 py-8`)
- Margens amplas

### Componentes Visuais

- **Bordas**: Arredondadas (`rounded-xl`, `rounded-2xl`)
- **Sombras**: Suaves (`shadow-sm`, `shadow-lg`)
- **Transições**: Suaves (`transition-colors`, `transition-all`)

---

## 📊 Dashboard

### Estrutura

**Página:** `app/(admin)/dashboard/page.tsx`

**Componentes:**
- `DashboardContent` — Orquestrador principal
- `SummaryCards` — 4 cards de KPIs (vendas do dia, mês, pedidos, estoque)
- `SalesChart` — Gráfico de receita semanal (Recharts)
- `OperationsCard` — Status operacional (pedidos, expedição, estoque)
- `TopProducts` — Lista de produtos mais vendidos

### Dados

- **Atualmente**: Mocks gerados no cliente (baseados em `storeId` para consistência)
- **Futuro**: Substituir por chamadas à API real
- **Multi-tenant**: Todos os dados filtrados por `storeId` do usuário autenticado

---

## 📦 CRUD de Produtos

### Rotas

- `GET /admin/products` — Listagem com filtros
- `GET /admin/products/:id` — Detalhes
- `POST /admin/products` — Criar
- `PUT /admin/products/:id` — Atualizar
- `DELETE /admin/products/:id` — Deletar (soft delete)
- `PATCH /admin/products/:id/status` — Ativar/desativar

### Componentes

**Listagem** (`app/(admin)/products/page.tsx`)
- Tabela premium com colunas: imagem, nome, categoria, preço, estoque, status, ações
- Filtros por nome, categoria, status
- Paginação simples
- Loading states elegantes

**Formulário** (`components/products/product-form.tsx`)
- Validação com Zod + React Hook Form
- Layout em 2 colunas (dados principais + imagem/status)
- Upload de imagem com preview
- Geração automática de slug

**Hooks** (`lib/hooks/use-products.ts`)
- `useProducts(filters)` — Listagem
- `useProduct(id)` — Detalhes
- `useCreateProduct()` — Criar
- `useUpdateProduct()` — Atualizar
- `useDeleteProduct()` — Deletar
- `useToggleProductStatus()` — Ativar/desativar

---

## 🎨 Sistema de Tema / Personalização

### Funcionalidades

1. **Identidade Visual**
   - Upload de logo
   - Seleção de família de fonte (sans/serif)

2. **Cores do Tema**
   - Cor primária (botões, links, destaques)
   - Cor secundária (elementos complementares)
   - Cor de fundo
   - Cor de texto

3. **Banners**
   - Tipos: Hero, Secundário, Promocional
   - Campos: imagem, link, título, subtítulo
   - Gerenciamento completo (adicionar/editar/remover)

4. **Dark Mode**
   - Toggle para ativar/desativar
   - Preview ao vivo com suporte completo
   - Aplicação na loja real (quando implementado)

5. **Exportar/Importar**
   - Exportar tema como JSON
   - Importar tema de arquivo JSON
   - Validação de formato

### Preview Ao Vivo

**Componente:** `components/theme/live-preview.tsx`

- Simula a home da loja em tempo real
- Aplica CSS variables dinamicamente
- Atualiza instantaneamente ao mudar cores/configurações
- Suporte completo a dark mode
- Layout responsivo (3 colunas de produtos)

### Persistência

- Salva em `store_theme_config` via API
- Endpoints: `GET /admin/store/theme` e `PUT /admin/store/theme`
- Hooks: `useTheme()` e `useUpdateTheme()`

---

## 🔄 Integração com API

### Cliente HTTP (`lib/api-client.ts`)

**Configuração:**
- Base URL: `process.env.NEXT_PUBLIC_API_URL`
- Cookies: `withCredentials: true` (para refresh token HttpOnly)

**Interceptors:**

1. **Request:**
   - Adiciona `Authorization: Bearer <token>` do localStorage
   - Adiciona `x-store-id` do localStorage

2. **Response:**
   - Se 401 (token expirado):
     - Chama `POST /auth/refresh` automaticamente
     - Atualiza token no localStorage
     - Repete requisição original

### Hooks React Query

**Padrão:**
```typescript
// Query (GET)
const { data, isLoading } = useProducts(filters)

// Mutation (POST/PUT/DELETE)
const createProduct = useCreateProduct()
await createProduct.mutateAsync(data)
```

**Cache:**
- Invalidação automática após mutations
- Stale time configurável
- Refetch automático em foco da janela

---

## 🎯 Padrões de Código

### TypeScript

- **Estrito**: Sempre tipado, sem `any`
- **Interfaces**: Para props de componentes
- **Types**: Para dados compartilhados
- **Tipos compartilhados**: `@white-label/types`

### Componentes

- **Functional Components**: Sempre
- **Client Components**: `'use client'` quando necessário
- **Server Components**: Padrão (quando possível)
- **Composição**: Componentes pequenos e reutilizáveis

### Estado

- **Local**: `useState` para estado simples
- **Global**: Zustand para autenticação
- **Server State**: React Query para dados da API
- **Form State**: React Hook Form

### Estilização

- **Tailwind CSS**: Utility-first
- **Classes condicionais**: `cn()` do shadcn
- **CSS Variables**: Para cores dinâmicas do tema
- **Responsivo**: Mobile-first (`sm:`, `md:`, `lg:`)

---

## 🚀 Fluxos Principais

### 1. Login

```
1. Usuário preenche formulário
2. Validação com Zod
3. POST /auth/login
4. Salva user + token no Zustand
5. Salva no localStorage (para api-client)
6. Redireciona para /dashboard
```

### 2. Navegação Protegida

```
1. Usuário acessa rota /admin/*
2. Layout verifica autenticação
3. Aguarda hidratação do Zustand
4. Verifica role permitida
5. Renderiza conteúdo ou redireciona
```

### 3. CRUD de Produto

```
1. Listagem: useProducts() → GET /admin/products
2. Criar: useCreateProduct() → POST /admin/products
3. Editar: useProduct(id) + useUpdateProduct()
4. Deletar: useDeleteProduct() → DELETE /admin/products/:id
5. React Query invalida cache automaticamente
```

### 4. Personalização de Tema

```
1. Carregar: useTheme() → GET /admin/store/theme
2. Editar: Atualiza state local
3. Preview: LivePreview atualiza em tempo real
4. Salvar: useUpdateTheme() → PUT /admin/store/theme
5. Exportar: Download JSON
6. Importar: Upload JSON + validação
```

---

## 🔧 Configurações

### Variáveis de Ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```

### TypeScript

- `tsconfig.json` estende `tsconfig.base.json`
- Paths: `@/*` → `./*`
- JSX: `react-jsx`

### Tailwind

- Content: `./app/**/*.{ts,tsx}`, `./components/**/*.{ts,tsx}`
- Plugins: `tailwind-scrollbar` (custom scrollbar)

---

## 🎨 Design Tokens

### Cores

- **Background**: `bg-gray-50`, `bg-white`
- **Text**: `text-gray-900`, `text-gray-500`
- **Borders**: `border-gray-200`
- **Primary**: Dinâmico (do tema da loja)

### Espaçamento

- **Cards**: `p-6`, `px-8 py-8`
- **Gaps**: `gap-6`, `space-y-6`
- **Margins**: `mb-8`, `mt-10`

### Tipografia

- **Títulos**: `text-4xl`, `text-3xl`, `text-2xl`
- **Subtítulos**: `text-sm`, `text-xs`
- **Font weights**: `font-light`, `font-medium`, `font-semibold`

---

## 🧪 Estado Atual da Implementação

### ✅ Implementado

1. **Autenticação**
   - Login com validação
   - Persistência de sessão
   - Proteção de rotas
   - Verificação de roles
   - Refresh token automático

2. **Dashboard**
   - Layout completo
   - Cards de KPIs
   - Gráfico de vendas
   - Top produtos
   - Status operacional

3. **Produtos**
   - Listagem com filtros
   - Criar produto
   - Editar produto
   - Deletar produto (soft delete)
   - Ativar/desativar
   - Upload de imagem

4. **Tema**
   - Upload de logo
   - Seleção de cores (4 color pickers)
   - Seleção de fonte
   - Gerenciamento de banners
   - Preview ao vivo
   - Dark mode
   - Exportar/Importar tema

### 🚧 Pendente

1. **Cupons** (UI)
   - Listagem
   - Criar/editar cupom
   - Estatísticas

2. **Configurações**
   - Página de configurações gerais
   - Preferências da loja

3. **Responsividade Mobile**
   - Menu hambúrguer para sidebar
   - Drawer/Sheet para navegação

---

## 📚 Recursos Adicionais

### Documentação Relacionada

- `PROJECT-STRUCTURE.md` — Visão geral do monorepo
- `COUPONS.md` — Sistema de cupons (backend)
- `WEBHOOKS.md` — Sistema de webhooks (backend)

### Convenções

- **Nomenclatura**: kebab-case para arquivos, PascalCase para componentes
- **Imports**: Absolutos com `@/`
- **Exports**: Named exports (não default, exceto pages)
- **Comentários**: Apenas quando necessário explicar "porquê"

---

## 🎯 Próximos Passos

1. Implementar UI de cupons
2. Implementar página de configurações
3. Adicionar menu mobile responsivo
4. Integrar dados reais da API no dashboard
5. Adicionar testes (Jest + React Testing Library)
6. Implementar sistema de notificações/toasts
7. Adicionar modo escuro no próprio admin (opcional)

---

## 💡 Dicas para Desenvolvedores

### Adicionar Nova Rota

1. Criar página em `app/(admin)/nova-rota/page.tsx`
2. Adicionar item na sidebar (`components/layout/sidebar.tsx`)
3. Adicionar entrada no `routeDictionary` do header (`components/layout/header.tsx`)

### Criar Novo Hook React Query

```typescript
// lib/hooks/use-nova-feature.ts
export function useNovaFeature() {
  return useQuery({
    queryKey: ['nova-feature'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/nova-feature')
      return response.data
    }
  })
}
```

### Adicionar Novo Componente UI

1. Criar em `components/ui/nome-componente.tsx`
2. Seguir padrão shadcn/ui
3. Usar `cn()` para classes condicionais
4. Exportar tipos se necessário

---