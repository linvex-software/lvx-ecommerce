# 🛍️ White Label Ecommerce

Monorepo de e-commerce white label construído com Clean Architecture, TypeScript e tecnologias modernas.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Como Começar](#como-começar)
- [Apps](#apps)
- [Packages](#packages)
- [Arquitetura](#arquitetura)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Convenções e Padrões](#convenções-e-padrões)

## 🎯 Visão Geral

Este projeto é um monorepo que utiliza **Turborepo** e **pnpm workspaces** para gerenciar múltiplas aplicações e pacotes compartilhados. A arquitetura segue os princípios de **Clean Architecture**, garantindo separação de responsabilidades e testabilidade.

### Principais Características

- ✅ Monorepo com Turborepo
- ✅ Clean Architecture
- ✅ TypeScript em 100% do código
- ✅ Workspaces com pnpm
- ✅ Design System compartilhado
- ✅ Banco de dados com Drizzle ORM
- ✅ API REST com Fastify
- ✅ Frontend com Next.js 16 (App Router)

## 🛠️ Tecnologias

### Core
- **TypeScript** - Linguagem principal
- **pnpm** - Gerenciador de pacotes
- **Turborepo** - Build system para monorepos

### Backend
- **Fastify** - Framework web rápido
- **Drizzle ORM** - ORM type-safe
- **PostgreSQL** - Banco de dados
- **Zod** - Validação de schemas

### Frontend
- **Next.js 16** - Framework React com App Router
- **React 18** - Biblioteca UI
- **Tailwind CSS** - Estilização
- **Zustand** - Gerenciamento de estado
- **TanStack Query** - Data fetching

### Ferramentas
- **ESLint** - Linter
- **Prettier** - Formatador de código
- **Vitest** - Framework de testes

## 📁 Estrutura do Projeto

```
white-label-ecommerce/
├── apps/                    # Aplicações
│   ├── api/                 # API REST (Fastify)
│   ├── web/                 # Loja pública (Next.js)
│   ├── admin/               # Painel administrativo (Next.js)
│   └── pdv/                 # PDV loja física (Next.js)
│
├── packages/                # Pacotes compartilhados
│   ├── config/              # Configurações compartilhadas
│   ├── types/               # Tipos e schemas Zod
│   ├── shared/              # Utilitários compartilhados
│   ├── ui/                  # Design System (componentes React)
│   └── db/                  # Drizzle ORM (schemas e client)
│
├── infra/                   # Infraestrutura
│   ├── docker/              # Configurações Docker
│   ├── terraform/           # IaC com Terraform
│   └── scripts/             # Scripts de deploy/automation
│
├── package.json             # Configuração raiz do monorepo
├── turbo.json               # Configuração do Turborepo
├── pnpm-workspace.yaml      # Configuração dos workspaces
└── tsconfig.base.json       # TypeScript base compartilhado
```

## 🚀 Como Começar

### Pré-requisitos

- Node.js 20.x ou superior
- pnpm 9.x
- PostgreSQL (para desenvolvimento local)

### Instalação

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd white-label-ecommerce
   ```

2. **Instale as dependências**
   ```bash
   pnpm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   # Edite o .env com suas configurações
   ```

4. **Inicie todos os apps em modo desenvolvimento**
   ```bash
   pnpm dev
   ```

   Isso iniciará:
   - API: `http://localhost:3333`
   - Web: `http://localhost:3000`
   - Admin: `http://localhost:3001`
   - PDV: `http://localhost:3002`

### Comandos Individuais

Para iniciar apenas um app específico:

```bash
# API
cd apps/api
pnpm dev

# Web
cd apps/web
pnpm dev

# Admin
cd apps/admin
pnpm dev

# PDV
cd apps/pdv
pnpm dev
```

## 📱 Apps

### `apps/api`

API REST construída com Fastify.

**Tecnologias:**
- Fastify 4.x
- Drizzle ORM
- JWT (opcional)
- Swagger/OpenAPI

**Endpoints:**
- `GET /health` - Health check

**Porta:** 3333

### `apps/web`

Loja pública para clientes finais.

**Tecnologias:**
- Next.js 16 (App Router)
- React 18
- Tailwind CSS
- Zustand
- TanStack Query

**Porta:** 3000

### `apps/admin`

Painel administrativo para gestão da loja.

**Tecnologias:**
- Next.js 16 (App Router)
- React 18
- Tailwind CSS
- Zustand
- TanStack Query

**Porta:** 3001

### `apps/pdv`

Sistema de PDV (Ponto de Venda) para lojas físicas.

**Tecnologias:**
- Next.js 16 (App Router)
- React 18
- Tailwind CSS
- Zustand
- TanStack Query

**Porta:** 3002

## 📦 Packages

### `packages/config`

Configurações compartilhadas entre projetos (ESLint, etc).

### `packages/types`

Tipos TypeScript e schemas Zod compartilhados.

**Exemplo:**
```typescript
import { loginSchema, type LoginInput } from '@white-label/types'
```

### `packages/shared`

Utilitários e funções auxiliares compartilhadas.

**Exemplo:**
```typescript
import { assertUnreachable } from '@white-label/shared'
```

### `packages/ui`

Design System com componentes React reutilizáveis.

**Exemplo:**
```typescript
import { Button } from '@white-label/ui'
```

**Componentes disponíveis:**
- `Button` - Botão com variantes
- `cn()` - Utilitário para classes Tailwind

### `packages/db`

Configuração do Drizzle ORM com schemas e client do banco.

**Uso:**
```typescript
import { db, schema } from '@white-label/db'
```

**Comandos:**
```bash
# Gerar migrations
pnpm db:generate

# Aplicar migrations
pnpm db:migrate
```

## 🏗️ Arquitetura

O projeto segue os princípios de **Clean Architecture**, organizando o código em camadas:

### Estrutura por Camadas

```
domain/          # Entidades, tipos, regras de negócio puras
application/     # DTOs, services, orquestração, validadores
infra/           # Repositórios concretos, gateways, HTTP clients
presentation/    # Controllers, rotas, view-models, front-end
```

### Princípios

1. **Repository Pattern**: Interfaces em `domain/repositories/`, implementações em `infra/repositories/`
2. **Service Layer**: Regras de negócio complexas em `application/services/`
3. **Dependency Rule**: `domain` nunca importa de `infra` ou `presentation`
4. **Separation of Concerns**: Cada camada tem responsabilidade única

## 📜 Scripts Disponíveis

### Na raiz do projeto

```bash
# Desenvolvimento (inicia todos os apps)
pnpm dev

# Build de todos os projetos
pnpm build

# Lint em todos os projetos
pnpm lint

# Testes em todos os projetos
pnpm test

# Gerar migrations do Drizzle
pnpm db:generate

# Aplicar migrations do Drizzle
pnpm db:migrate
```

### Scripts individuais

Cada app/package tem seus próprios scripts definidos em seu `package.json`.

## 📝 Convenções e Padrões

### Nomeação

- **Funções**: `camelCase`
- **Classes/Interfaces**: `PascalCase`
- **Arquivos**: `kebab-case`
- **Constantes**: `UPPER_SNAKE_CASE`
- **Colunas de banco**: `snake_case`

### Código

- ✅ TypeScript em 100% do código novo
- ✅ Funções puras quando possível
- ✅ ES Modules (`import/export`)
- ✅ Funções com até ~20 linhas
- ✅ Classes com responsabilidade única
- ✅ Sem `console.log` em produção
- ✅ Sem `any` (tipar explicitamente)

### Testes

- Testes obrigatórios para `domain`, `services` e repositórios mockados
- Evitar testes frágeis

### Git

- Commits descritivos
- Pull Requests com descrição clara
- Código revisado antes de merge

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz com:

```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/white_label

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# S3 (opcional)
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_REGION=
S3_BUCKET=

# API
NEXT_PUBLIC_API_URL=http://localhost:3333

# Pagamentos (opcional)
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=

# Frete (opcional)
FRETE_API_KEY=

# Licença
STORE_LICENSE_KEY=
```