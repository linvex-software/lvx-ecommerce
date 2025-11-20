# 🏗️ Estrutura do Projeto - Guia Completo

Documentação completa da estrutura, organização e arquitetura do projeto White Label Ecommerce para desenvolvedores.

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Pastas](#estrutura-de-pastas)
3. [Aplicações (Apps)](#aplicações-apps)
4. [Pacotes Compartilhados (Packages)](#pacotes-compartilhados-packages)
5. [Arquitetura da API](#arquitetura-da-api)
6. [Fluxo de Dados](#fluxo-de-dados)
7. [Padrões e Convenções](#padrões-e-convenções)
8. [Como Adicionar Novas Funcionalidades](#como-adicionar-novas-funcionalidades)

---

## 🎯 Visão Geral

### O que é White Label E-commerce?

Este projeto é uma **plataforma white-label de e-commerce**, o que significa que é uma solução completa e personalizável que pode ser licenciada para múltiplas lojas/empresas. Cada loja (tenant) tem:

- ✅ **Isolamento completo de dados** - Cada loja vê apenas seus próprios dados
- ✅ **Personalização de marca** - Cada loja pode ter sua própria identidade visual
- ✅ **Múltiplos canais de venda** - Loja online, PDV físico e painel administrativo
- ✅ **Gestão independente** - Cada loja gerencia seus produtos, pedidos, cupons, etc.
- ✅ **Multi-tenant nativo** - Arquitetura projetada desde o início para suportar múltiplas lojas

### Casos de Uso

- **Marketplace de e-commerce** - Plataforma que oferece lojas virtuais para clientes
- **Franchising digital** - Sistema para franquias gerenciarem suas lojas online
- **SaaS de e-commerce** - Software como serviço para pequenas e médias empresas
- **White-label para agências** - Agências criam lojas personalizadas para seus clientes

### Tecnologias e Arquitetura

Este é um **monorepo** que utiliza:
- **Turborepo** - Build system e cache para monorepos
- **pnpm workspaces** - Gerenciamento de dependências compartilhadas
- **Clean Architecture** - Separação de responsabilidades em camadas
- **TypeScript** - 100% do código tipado
- **Multi-tenant** - Isolamento de dados por `store_id` em todas as operações

### Organização Geral

```
white-label-ecommerce/
├── apps/              # Aplicações (frontend e backend)
│   ├── api/           # API REST (backend único para todas as lojas)
│   ├── web/           # Loja pública (frontend para clientes)
│   ├── admin/         # Painel administrativo (gestão da loja)
│   └── pdv/           # Ponto de venda (vendas presenciais)
├── packages/          # Pacotes compartilhados
│   ├── db/            # Schemas e cliente do banco de dados
│   ├── ui/            # Design system (componentes React)
│   ├── types/         # Tipos TypeScript compartilhados
│   └── shared/        # Utilitários compartilhados
├── infra/             # Infraestrutura (Docker, Terraform)
├── scripts/           # Scripts utilitários
├── docs/              # Documentação
└── [config files]     # Configurações do monorepo
```

---

## 📁 Estrutura de Pastas

### Raiz do Projeto

| Arquivo/Pasta | Descrição |
|---------------|-----------|
| `apps/` | Todas as aplicações (API, Web, Admin, PDV) |
| `packages/` | Pacotes compartilhados entre apps |
| `infra/` | Configurações de infraestrutura |
| `scripts/` | Scripts utilitários (setup, testes, etc) |
| `docs/` | Documentação do projeto |
| `package.json` | Configuração raiz do monorepo |
| `turbo.json` | Configuração do Turborepo |
| `pnpm-workspace.yaml` | Definição dos workspaces |
| `tsconfig.base.json` | TypeScript base compartilhado |

---

## 📱 Aplicações (Apps)

### Visão Geral das Aplicações

O sistema é composto por **4 aplicações principais**, todas compartilhando a mesma API backend:

1. **API** - Backend único que serve todas as lojas (multi-tenant)
2. **Web** - Loja pública onde clientes compram produtos
3. **Admin** - Painel administrativo para gestão da loja
4. **PDV** - Sistema de ponto de venda para lojas físicas

Todas as aplicações são **multi-tenant**, ou seja, uma única instalação serve múltiplas lojas, com isolamento completo de dados.

---

### `apps/api/` - API REST Backend

**Tecnologia:** Fastify + TypeScript

**Características:**
- ✅ **Multi-tenant nativo** - Todas as rotas isolam dados por `store_id`
- ✅ **Autenticação JWT** - Tokens de acesso e refresh
- ✅ **RBAC** - Controle de acesso baseado em roles (admin, operador, vendedor)
- ✅ **Validação de assinatura** - Webhooks com validação HMAC
- ✅ **Swagger/OpenAPI** - Documentação automática da API

**Estrutura:**
```
apps/api/
├── src/
│   ├── domain/              # Camada de domínio (regras de negócio puras)
│   │   ├── auth/           # Tipos e helpers de autenticação
│   │   ├── coupons/        # Tipos de cupons
│   │   ├── users/          # Tipos de usuários
│   │   └── webhooks/       # Tipos de webhooks
│   │
│   ├── application/         # Camada de aplicação (casos de uso)
│   │   ├── auth/
│   │   │   └── use-cases/   # Login, logout, refresh-token
│   │   ├── coupons/
│   │   │   └── use-cases/   # CRUD de cupons, validação
│   │   └── webhooks/
│   │       └── use-cases/   # Processar e retry de webhooks
│   │
│   ├── infra/               # Camada de infraestrutura
│   │   ├── db/
│   │   │   └── repositories/  # Implementações de repositórios
│   │   └── http/
│   │       ├── middlewares/    # Middlewares (auth, tenant, etc)
│   │       └── types/          # Tipos customizados (Fastify)
│   │
│   ├── presentation/         # Camada de apresentação
│   │   └── http/
│   │       ├── admin/        # Rotas admin (cupons, etc)
│   │       ├── auth/         # Rotas de autenticação
│   │       ├── checkout/     # Rotas de checkout
│   │       └── webhooks/     # Rotas de webhooks
│   │
│   └── server.ts            # Ponto de entrada da API
│
└── package.json
```

**Porta:** `3333`

**Responsabilidades:**
- Receber requisições HTTP de todas as aplicações frontend
- Validar autenticação e autorização (JWT + RBAC)
- Isolar dados por loja (multi-tenant)
- Processar casos de uso de negócio
- Persistir dados no banco de dados
- Retornar respostas JSON padronizadas
- Receber e processar webhooks de provedores externos

---

### `apps/web/` - Loja Pública (Frontend)

**Tecnologia:** Next.js 16 (App Router) + React 18

**Características:**
- ✅ **Multi-tenant** - Cada loja pode ter seu próprio domínio/subdomínio
- ✅ **Personalização de tema** - Cada loja pode ter sua identidade visual
- ✅ **SSR/SSG** - Renderização no servidor para SEO

**Estrutura:**
```
apps/web/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Layout principal
│   ├── page.tsx             # Página inicial
│   └── globals.css          # Estilos globais
├── package.json
└── [config files]
```

**Porta:** `3000`

**Responsabilidades:**
- Interface pública para clientes finais
- Catálogo de produtos da loja
- Carrinho de compras
- Checkout e finalização de pedidos
- Área do cliente (pedidos, perfil)
- Páginas de produto, categoria, busca

**Dependências:**
- `@white-label/ui` - Componentes do design system
- `@white-label/types` - Tipos compartilhados
- `zustand` - Gerenciamento de estado
- `@tanstack/react-query` - Data fetching

---

### `apps/admin/` - Painel Administrativo

**Tecnologia:** Next.js 16 (App Router) + React 18

**Características:**
- ✅ **Acesso restrito** - Apenas usuários com role `admin` ou `operador`
- ✅ **Dashboard completo** - Visão geral da loja
- ✅ **Gestão completa** - CRUD de todas as entidades da loja

**Estrutura:**
```
apps/admin/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Layout principal
│   ├── page.tsx             # Dashboard
│   └── globals.css          # Estilos globais
├── package.json
└── [config files]
```

**Porta:** `3001`

**Responsabilidades:**
- Dashboard com métricas e estatísticas
- Gestão de produtos (criar, editar, deletar)
- Gestão de pedidos (visualizar, atualizar status)
- Gestão de cupons (criar, editar, desativar)
- Gestão de clientes
- Relatórios e analytics
- Configurações da loja (tema, integrações, etc)
- Gestão de usuários e permissões

**Dependências:**
- `@white-label/ui` - Componentes do design system
- `@white-label/types` - Tipos compartilhados
- `zustand` - Gerenciamento de estado
- `@tanstack/react-query` - Data fetching

---

### `apps/pdv/` - Ponto de Venda (Loja Física)

**Tecnologia:** Next.js 16 (App Router) + React 18

**Características:**
- ✅ **Interface otimizada para touch** - Ideal para tablets e telas touch
- ✅ **Vendas offline** - Funciona mesmo sem internet (com sincronização posterior)
- ✅ **Integração com impressora** - Impressão de cupons fiscais e recibos

**Estrutura:**
```
apps/pdv/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Layout principal
│   ├── page.tsx             # Tela principal do PDV
│   └── globals.css          # Estilos globais
├── package.json
└── [config files]
```

**Porta:** `3002`

**Responsabilidades:**
- Interface para vendedores em lojas físicas
- Vendas presenciais (carrinho, checkout, pagamento)
- Gestão de estoque físico (entrada, saída, ajustes)
- Impressão de cupons fiscais e recibos
- Sincronização com estoque online
- Relatórios de vendas do dia

**Dependências:**
- `@white-label/ui` - Componentes do design system
- `@white-label/types` - Tipos compartilhados
- `zustand` - Gerenciamento de estado
- `@tanstack/react-query` - Data fetching

---

## 📦 Pacotes Compartilhados (Packages)

Os pacotes compartilhados permitem que todas as aplicações usem o mesmo código, garantindo consistência e evitando duplicação.

### `packages/db/` - Banco de Dados

**Tecnologia:** Drizzle ORM + PostgreSQL

**Características:**
- ✅ **Type-safe** - Tipos TypeScript gerados automaticamente
- ✅ **Multi-tenant** - Todos os schemas incluem `store_id` para isolamento
- ✅ **Migrations** - Versionamento de schema com Drizzle Kit

**Estrutura:**
```
packages/db/
├── src/
│   ├── client.ts            # Cliente Drizzle configurado
│   ├── index.ts             # Exports principais
│   └── schema/              # Schemas Drizzle
│       ├── core.ts          # Stores, users, etc
│       ├── auth.ts          # Sessões de autenticação
│       ├── catalog.ts       # Produtos, categorias
│       ├── coupons.ts       # Cupons
│       ├── orders.ts        # Pedidos
│       ├── webhook-events.ts # Eventos de webhook
│       └── [outros schemas]
├── drizzle/                 # Migrations geradas
├── drizzle.config.ts        # Configuração do Drizzle
└── package.json
```

**Uso:**
```typescript
import { db, schema } from '@white-label/db'

// Query
const stores = await db.select().from(schema.stores)

// Insert
await db.insert(schema.users).values({ ... })
```

**Comandos:**
- `pnpm db:generate` - Gerar migrations
- `pnpm db:migrate` - Aplicar migrations

---

### `packages/ui/` - Design System

**Tecnologia:** React + Tailwind CSS

**Estrutura:**
```
packages/ui/
├── src/
│   ├── button.tsx           # Componente Button
│   ├── cn.ts                # Utilitário para classes Tailwind
│   └── index.ts             # Exports
└── package.json
```

**Uso:**
```typescript
import { Button } from '@white-label/ui'

<Button variant="primary">Clique aqui</Button>
```

**Responsabilidades:**
- Componentes React reutilizáveis
- Design system consistente
- Utilitários de estilização

---

### `packages/types/` - Tipos Compartilhados

**Tecnologia:** TypeScript + Zod

**Estrutura:**
```
packages/types/
├── src/
│   ├── auth.ts              # Tipos e schemas de autenticação
│   └── index.ts             # Exports
└── package.json
```

**Uso:**
```typescript
import { loginSchema, type LoginInput } from '@white-label/types'
```

**Responsabilidades:**
- Tipos TypeScript compartilhados
- Schemas Zod para validação
- Interfaces comuns entre apps

---

### `packages/shared/` - Utilitários Compartilhados

**Tecnologia:** TypeScript

**Estrutura:**
```
packages/shared/
├── src/
│   └── index.ts             # Funções utilitárias
└── package.json
```

**Uso:**
```typescript
import { assertUnreachable } from '@white-label/shared'
```

**Responsabilidades:**
- Funções utilitárias
- Helpers comuns
- Constantes compartilhadas

---

### `packages/config/` - Configurações Compartilhadas

**Tecnologia:** TypeScript

**Estrutura:**
```
packages/config/
├── src/
│   └── index.ts             # Configurações (ESLint, etc)
└── package.json
```

**Responsabilidades:**
- Configurações compartilhadas
- Regras de lint
- Configurações de build

---

## 🏛️ Arquitetura da API

A API segue **Clean Architecture** com 4 camadas principais:

### 1. Domain (Domínio)

**Localização:** `apps/api/src/domain/`

**Responsabilidades:**
- Entidades e tipos de domínio
- Regras de negócio puras
- Helpers e funções utilitárias
- **NÃO** conhece banco de dados, frameworks ou HTTP

**Exemplo:**
```typescript
// domain/coupons/coupon-types.ts
export interface Coupon {
  id: string
  store_id: string
  code: string
  type: 'percent' | 'fixed'
  // ...
}
```

---

### 2. Application (Aplicação)

**Localização:** `apps/api/src/application/`

**Responsabilidades:**
- Casos de uso (use-cases)
- Orquestração de lógica de negócio
- Validação de entrada (Zod)
- **NÃO** conhece HTTP, apenas recebe dados e retorna resultados

**Estrutura:**
```
application/
└── [feature]/
    └── use-cases/
        ├── create-[feature].ts
        ├── update-[feature].ts
        └── [outros casos de uso]
```

**Exemplo:**
```typescript
// application/coupons/use-cases/create-coupon.ts
export async function createCouponUseCase(
  input: CreateCouponInput,
  storeId: string,
  dependencies: Dependencies
): Promise<Coupon> {
  // Lógica de negócio
}
```

---

### 3. Infra (Infraestrutura)

**Localização:** `apps/api/src/infra/`

**Responsabilidades:**
- Implementações concretas de repositórios
- Middlewares HTTP
- Integrações externas
- Acesso a banco de dados

**Estrutura:**
```
infra/
├── db/
│   └── repositories/        # Implementações de repositórios
└── http/
    ├── middlewares/          # Auth, tenant, etc
    └── types/                # Tipos customizados
```

**Exemplo:**
```typescript
// infra/db/repositories/coupon-repository.ts
export class CouponRepository {
  async create(data: CreateCouponInput): Promise<Coupon> {
    // Implementação com Drizzle
  }
}
```

---

### 4. Presentation (Apresentação)

**Localização:** `apps/api/src/presentation/`

**Responsabilidades:**
- Controllers HTTP
- Rotas Fastify
- Validação de entrada HTTP
- Formatação de respostas

**Estrutura:**
```
presentation/
└── http/
    ├── admin/                # Rotas admin
    ├── auth/                 # Rotas de autenticação
    └── [outras rotas]/
        ├── [feature]-controller.ts
        └── [feature]-routes.ts
```

**Exemplo:**
```typescript
// presentation/http/admin/coupon-controller.ts
export class CouponController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    // Chama use case
    const coupon = await createCouponUseCase(...)
    // Retorna resposta HTTP
  }
}
```

---

## 🔄 Fluxo de Dados

### Fluxo de uma Requisição HTTP

```
1. Cliente HTTP
   ↓
2. Fastify Server (server.ts)
   ↓
3. Middlewares (tenant, auth, etc)
   ↓
4. Route Handler (presentation/http/*/routes.ts)
   ↓
5. Controller (presentation/http/*/controller.ts)
   ↓
6. Use Case (application/*/use-cases/*.ts)
   ↓
7. Repository (infra/db/repositories/*.ts)
   ↓
8. Database (PostgreSQL via Drizzle)
```

### Exemplo: Criar Cupom

```
POST /admin/coupons
  ↓
tenantMiddleware (valida store_id)
  ↓
requireAuth (valida JWT)
  ↓
requireRole(['admin']) (valida permissão)
  ↓
CouponController.create()
  ↓
createCouponUseCase()
  ↓
CouponRepository.create()
  ↓
Database INSERT
  ↓
Resposta HTTP 201
```

---

## 📐 Padrões e Convenções

### Nomeação de Arquivos

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Arquivos | `kebab-case` | `create-coupon.ts` |
| Componentes React | `PascalCase.tsx` | `Button.tsx` |
| Classes | `PascalCase` | `CouponRepository` |
| Funções | `camelCase` | `createCoupon` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_RETRIES` |
| Colunas DB | `snake_case` | `store_id` |

### Estrutura de Pastas por Feature

Quando adicionar uma nova funcionalidade, siga esta estrutura:

```
domain/
  └── [feature]/
      └── [feature]-types.ts

application/
  └── [feature]/
      └── use-cases/
          ├── create-[feature].ts
          ├── update-[feature].ts
          └── [outros].ts

infra/
  └── db/
      └── repositories/
          └── [feature]-repository.ts

presentation/
  └── http/
      └── [rota]/
          ├── [feature]-controller.ts
          └── [feature]-routes.ts
```

### Imports

**Ordem de imports:**
1. Bibliotecas externas
2. Pacotes do workspace (`@white-label/*`)
3. Imports relativos

**Exemplo:**
```typescript
import { z } from 'zod'
import { db, schema } from '@white-label/db'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
```

---

## 🚀 Como Adicionar Novas Funcionalidades

### Passo 1: Criar Schema no Banco

```typescript
// packages/db/src/schema/[feature].ts
export const [feature] = pgTable('[feature]', {
  id: uuid('id').primaryKey().defaultRandom(),
  // ...
})
```

**Gerar migration:**
```bash
pnpm db:generate
pnpm db:migrate
```

---

### Passo 2: Criar Tipos de Domínio

```typescript
// apps/api/src/domain/[feature]/[feature]-types.ts
export interface [Feature] {
  id: string
  // ...
}
```

---

### Passo 3: Criar Repository

```typescript
// apps/api/src/infra/db/repositories/[feature]-repository.ts
export class [Feature]Repository {
  async create(data: Create[Feature]Input): Promise<[Feature]> {
    // Implementação
  }
}
```

---

### Passo 4: Criar Use Cases

```typescript
// apps/api/src/application/[feature]/use-cases/create-[feature].ts
export async function create[Feature]UseCase(
  input: Create[Feature]Input,
  storeId: string,
  dependencies: Dependencies
): Promise<[Feature]> {
  // Lógica de negócio
}
```

---

### Passo 5: Criar Controller e Rotas

```typescript
// apps/api/src/presentation/http/[rota]/[feature]-controller.ts
export class [Feature]Controller {
  async create(request: FastifyRequest, reply: FastifyReply) {
    // Chama use case
  }
}

// apps/api/src/presentation/http/[rota]/[feature]-routes.ts
export async function register[Feature]Routes(app: FastifyInstance) {
  app.post('/[rota]/[feature]', {
    onRequest: [tenantMiddleware, requireAuth],
    preHandler: [requireRole(['admin'])]
  }, async (request, reply) => {
    await controller.create(request, reply)
  })
}
```

---

### Passo 6: Registrar Rotas no Server

```typescript
// apps/api/src/server.ts
import { register[Feature]Routes } from './presentation/http/[rota]/[feature]-routes'

await register[Feature]Routes(app)
```

---

## 🔐 Segurança e Multi-tenant

### Conceito de Multi-tenant

O sistema é **multi-tenant**, o que significa que uma única instalação serve múltiplas lojas (tenants). Cada loja tem:

- **Isolamento completo de dados** - Loja A não vê dados da Loja B
- **Configurações independentes** - Cada loja pode ter suas próprias configurações
- **Usuários isolados** - Usuários pertencem a uma única loja
- **Identidade visual própria** - Cada loja pode ter seu tema e marca

### Como Funciona o Isolamento

1. **Identificação da Loja:**
   - Header `x-store-id` em todas as requisições
   - Ou subdomínio/domínio customizado (ex: `loja1.seudominio.com`)

2. **Filtro Automático:**
   - Todas as queries incluem `WHERE store_id = ?`
   - Repositórios sempre recebem `storeId` como parâmetro
   - Impossível acessar dados de outra loja

3. **Validação:**
   - `tenantMiddleware` valida que a loja existe e está ativa
   - Usuários só podem acessar dados da sua própria loja

### Tenant Middleware

Todas as rotas (exceto públicas) devem usar `tenantMiddleware`:

```typescript
{
  onRequest: [tenantMiddleware]
}
```

Isso garante:
- Extração do `store_id` do header `x-store-id` ou hostname
- Validação de que a loja existe e está ativa
- Isolamento de dados por loja
- Prevenção de acesso não autorizado a dados de outras lojas

### Autenticação

```typescript
{
  onRequest: [tenantMiddleware, requireAuth]
}
```

Valida:
- Token JWT válido
- Usuário existe e pertence à loja

### Autorização (Roles)

```typescript
{
  preHandler: [requireRole(['admin', 'operador'])]
}
```

Valida:
- Usuário tem uma das roles necessárias

---

## 📚 Documentação Adicional

- **`docs/COUPONS.md`** - Documentação do sistema de cupons
- **`docs/WEBHOOKS.md`** - Documentação do sistema de webhooks
- **`README.md`** - Visão geral e quick start

---

## 🎯 Princípios Importantes

1. **Separation of Concerns** - Cada camada tem responsabilidade única
2. **Dependency Rule** - `domain` nunca importa de `infra` ou `presentation`
3. **Repository Pattern** - Abstração de acesso a dados
4. **Use Cases** - Lógica de negócio isolada e testável
5. **Multi-tenant** - Todos os dados isolados por `store_id`
6. **Type Safety** - TypeScript em 100% do código
7. **Clean Code** - Funções pequenas, nomes descritivos, sem `any`

---

## 🛠️ Ferramentas e Comandos

### Desenvolvimento

```bash
# Iniciar todos os apps
pnpm dev

# Iniciar apenas API
cd apps/api && pnpm dev

# Gerar migrations
pnpm db:generate

# Aplicar migrations
pnpm db:migrate
```

### Build

```bash
# Build de todos os projetos
pnpm build

# Build de um projeto específico
cd apps/api && pnpm build
```

### Testes

```bash
# Rodar todos os testes
pnpm test

# Rodar testes de um projeto
cd apps/api && pnpm test
```

---