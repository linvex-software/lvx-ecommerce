# 🗄️ Documentação do Banco de Dados

Documentação técnica sobre a estrutura do banco de dados, relacionamentos, convenções e como trabalhar com o Drizzle ORM neste projeto.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura Multi-Tenant](#arquitetura-multi-tenant)
- [Estrutura de Schemas](#estrutura-de-schemas)
- [Relacionamentos](#relacionamentos)
- [Convenções](#convenções)
- [Trabalhando com o Banco](#trabalhando-com-o-banco)
- [Exemplos Práticos](#exemplos-práticos)

## 🎯 Visão Geral

O projeto utiliza **PostgreSQL** como banco de dados e **Drizzle ORM** para gerenciamento de schemas e migrations. A arquitetura é **multi-tenant**, onde cada loja (`store`) possui seus próprios dados isolados.

### Tecnologias

- **PostgreSQL** - Banco de dados relacional
- **Drizzle ORM** - ORM type-safe em TypeScript
- **Drizzle Kit** - Ferramenta para gerar e executar migrations

### Localização dos Schemas

Todos os schemas estão em `packages/db/src/schema/`, organizados por domínio:

```
packages/db/src/schema/
├── core.ts              # Lojas, usuários, configurações
├── catalog.ts           # Produtos, categorias, variantes
├── stock.ts             # Movimentações de estoque
├── orders.ts            # Pedidos e vendas
├── customers.ts         # Clientes e endereços
├── coupons.ts           # Cupons de desconto
├── theme.ts             # Configurações de tema
├── landing.ts           # Landing pages
├── shipping.ts          # Frete e logística
├── payments.ts          # Pagamentos e transações
├── webhooks.ts          # Webhooks e logs
├── integrations.ts      # Integrações externas
├── analytics.ts         # Eventos de analytics
├── logs.ts              # Logs do sistema
├── seo.ts               # Metadados SEO
├── virtual-tryon.ts     # Sessões de provador virtual
├── finance.ts           # Taxas e pagamentos
├── security.ts          # Chaves de API
└── index.ts             # Re-exporta tudo
```

## 🏢 Arquitetura Multi-Tenant

### Conceito

O sistema é **multi-tenant**, onde cada loja (`store`) possui seus próprios dados completamente isolados. Isso permite que múltiplas lojas compartilhem a mesma instância do banco de dados.

### Como Funciona

Todas as tabelas relacionadas a uma loja possuem a coluna `store_id` como chave estrangeira para `stores.id`. Quando uma loja é deletada, todos os seus dados relacionados são removidos em cascata.

### Tabela Base: `stores`

```typescript
stores {
  id: uuid (PK)
  name: text
  domain: text (unique)
  active: boolean
  created_at: timestamp
}
```

### Exemplo de Isolamento

```sql
-- Buscar produtos apenas da loja específica
SELECT * FROM products WHERE store_id = 'uuid-da-loja';

-- Buscar pedidos apenas da loja específica
SELECT * FROM orders WHERE store_id = 'uuid-da-loja';
```

## 📊 Estrutura de Schemas

### 1. Core (`core.ts`)

Tabelas fundamentais do sistema:

- **`stores`** - Lojas cadastradas
- **`users`** - Usuários internos (admin, operador, vendedor)
- **`user_roles`** - Perfis de permissão por loja
- **`store_settings`** - Configurações gerais da loja

**Características:**
- `stores.domain` é único (cada loja tem um domínio único)
- `users.email` é único por loja (`store_id` + `email`)
- `store_settings` tem apenas 1 registro por loja

### 2. Catalog (`catalog.ts`)

Estrutura de produtos e catálogo:

- **`products`** - Produtos cadastrados
- **`product_variants`** - Variantes (tamanho, cor, etc.)
- **`product_images`** - Imagens dos produtos
- **`categories`** - Categorias de produtos
- **`product_category`** - Relação N:N produto ↔ categoria

**Características:**
- `products.sku` é único por loja
- `categories.slug` é único por loja
- Um produto pode ter múltiplas variantes
- Um produto pode estar em múltiplas categorias

### 3. Stock (`stock.ts`)

Controle de estoque:

- **`stock_movements`** - Histórico de movimentações

**Tipos de movimentação:**
- `in` - Entrada
- `out` - Saída
- `adjustment` - Ajuste manual
- `sale` - Venda
- `return` - Devolução

### 4. Orders (`orders.ts`)

Pedidos e vendas:

- **`orders`** - Pedidos de clientes
- **`order_items`** - Itens de cada pedido
- **`physical_sales`** - Vendas presenciais (PDV)

**Status de pedido:**
- `pending` - Pendente
- `paid` - Pago
- `shipped` - Enviado
- `cancelled` - Cancelado

**Status de pagamento:**
- `pending` - Pendente
- `paid` - Pago
- `refunded` - Reembolsado

### 5. Customers (`customers.ts`)

Clientes:

- **`customers`** - Dados dos clientes
- **`customer_addresses`** - Endereços dos clientes

### 6. Coupons (`coupons.ts`)

Cupons de desconto:

- **`coupons`** - Cupons disponíveis

**Tipos:**
- `percent` - Desconto percentual
- `fixed` - Desconto fixo

### 7. Theme (`theme.ts`)

Personalização visual:

- **`store_theme_config`** - Configurações de tema (cores, logo)
- **`theme_sections`** - Seções da página inicial

### 8. Landing (`landing.ts`)

Landing pages customizadas:

- **`landing_pages`** - Páginas criadas
- **`landing_page_blocks`** - Blocos de cada página

### 9. Shipping (`shipping.ts`)

Frete e logística:

- **`shipping_providers`** - Provedores de frete (Melhor Envio, Correios, etc.)
- **`shipping_cache`** - Cache de cotações de frete

### 10. Payments (`payments.ts`)

Pagamentos:

- **`payment_methods`** - Métodos de pagamento configurados
- **`transactions`** - Transações realizadas

**Provedores:**
- `stripe`
- `pagarme`
- `mercado_pago`

### 11. Webhooks (`webhooks.ts`)

Webhooks e logs:

- **`webhooks`** - Webhooks configurados
- **`webhook_logs`** - Histórico de chamadas

### 12. Integrations (`integrations.ts`)

Integrações externas:

- **`integrations`** - Integrações (ERP, CRM, WhatsApp, etc.)

### 13. Analytics (`analytics.ts`)

Analytics e métricas:

- **`analytics_events`** - Eventos rastreados

**Tipos de eventos:**
- `page_view`
- `add_to_cart`
- `purchase`

### 14. Logs (`logs.ts`)

Logs do sistema:

- **`system_logs`** - Logs de ações do sistema

### 15. SEO (`seo.ts`)

Metadados SEO:

- **`seo_meta`** - Metadados por página

### 16. Virtual Try-On (`virtual-tryon.ts`)

Provador virtual:

- **`virtual_tryon_sessions`** - Sessões de provador virtual

### 17. Finance (`finance.ts`)

Financeiro:

- **`store_fees`** - Taxas da loja
- **`payouts`** - Pagamentos para lojistas

### 18. Security (`security.ts`)

Segurança:

- **`api_keys`** - Chaves de API

## 🔗 Relacionamentos

### Hierarquia Principal

```
stores (1)
  ├── users (N)
  ├── user_roles (N)
  ├── store_settings (1)
  ├── products (N)
  │   ├── product_variants (N)
  │   ├── product_images (N)
  │   └── product_category (N) → categories (N)
  ├── categories (N)
  ├── customers (N)
  │   └── customer_addresses (N)
  ├── orders (N)
  │   ├── order_items (N) → products
  │   └── transactions (N) → payment_methods
  ├── physical_sales (N) → products
  ├── stock_movements (N) → products
  ├── coupons (N)
  ├── store_theme_config (1)
  ├── theme_sections (N)
  ├── landing_pages (N)
  │   └── landing_page_blocks (N)
  ├── shipping_providers (N)
  ├── shipping_cache (N)
  ├── payment_methods (N)
  ├── webhooks (N)
  │   └── webhook_logs (N)
  ├── integrations (N)
  ├── analytics_events (N)
  ├── system_logs (N)
  ├── seo_meta (N)
  ├── virtual_tryon_sessions (N) → products
  ├── store_fees (N)
  ├── payouts (N)
  └── api_keys (N)
```

### Relacionamentos Importantes

1. **Store → Products → Variants**
   - Uma loja tem muitos produtos
   - Um produto tem muitas variantes

2. **Store → Orders → Order Items**
   - Uma loja tem muitos pedidos
   - Um pedido tem muitos itens
   - Cada item referencia um produto

3. **Store → Customers → Addresses**
   - Uma loja tem muitos clientes
   - Um cliente tem muitos endereços

4. **Products ↔ Categories (N:N)**
   - Um produto pode estar em múltiplas categorias
   - Uma categoria pode ter múltiplos produtos

## 📝 Convenções

### Nomenclatura

- **Tabelas**: `snake_case` (ex: `product_variants`)
- **Colunas**: `snake_case` (ex: `store_id`, `created_at`)
- **IDs**: Sempre `uuid` com `defaultRandom()`
- **Datas**: `created_at`, `updated_at`, `expires_at`
- **Booleanos**: `active`, `published`, `is_default`

### Tipos de Dados

- **IDs**: `uuid().primaryKey().defaultRandom()`
- **Texto**: `text()` ou `text().notNull()`
- **Números monetários**: `numeric(12, 2)` (12 dígitos, 2 decimais)
- **Números inteiros**: `integer()` ou `integer().default(0)`
- **Booleanos**: `boolean().notNull().default(true)`
- **Datas**: `timestamp('created_at', { withTimezone: true }).defaultNow().notNull()`
- **JSON**: `jsonb().$type<Record<string, unknown>>()`

### Foreign Keys

- **Cascade**: Quando a entidade pai é deletada, filhos são deletados
  - Ex: `stores` → `products` (se deletar loja, deleta produtos)
- **Restrict**: Não permite deletar se houver referências
  - Ex: `products` → `order_items` (não pode deletar produto com pedidos)
- **Set Null**: Define como null quando pai é deletado
  - Ex: `customers` → `orders.customer_id` (pedido fica sem cliente)

### Índices

- **Unique**: Campos que devem ser únicos
  - `stores.domain`
  - `products.sku` (por loja)
  - `categories.slug` (por loja)
- **Index**: Campos frequentemente consultados
  - `store_id` + `created_at` (para ordenação)
  - `store_id` + `status` (para filtros)

## 🛠️ Trabalhando com o Banco

### Gerar Migrations

Após alterar os schemas:

```bash
# Na raiz do projeto
pnpm db:generate

# Ou com nome customizado
cd packages/db
pnpm drizzle-kit generate --name nome_da_migration
```

### Aplicar Migrations

```bash
# Na raiz do projeto
pnpm db:migrate
```

**Importante**: Certifique-se de que o `.env` na raiz tem `DATABASE_URL` configurado.

### Usar o Client do Banco

```typescript
import { db, schema } from '@white-label/db'

// Buscar produtos de uma loja
const products = await db
  .select()
  .from(schema.products)
  .where(eq(schema.products.store_id, storeId))

// Criar um produto
await db.insert(schema.products).values({
  store_id: storeId,
  name: 'Produto Exemplo',
  price: '99.99',
  sku: 'PROD-001',
  active: true
})
```

### Estrutura de Pastas no App

Quando trabalhar com o banco nos apps, siga a Clean Architecture:

```
apps/api/src/
├── domain/
│   ├── entities/          # Entidades de domínio
│   └── repositories/      # Interfaces de repositório
├── application/
│   └── services/          # Lógica de negócio
└── infra/
    └── repositories/      # Implementações com Drizzle
```

## 💡 Exemplos Práticos

### Buscar Produtos com Variantes

```typescript
import { db, schema } from '@white-label/db'
import { eq } from 'drizzle-orm'

const productsWithVariants = await db
  .select({
    product: schema.products,
    variant: schema.productVariants
  })
  .from(schema.products)
  .leftJoin(
    schema.productVariants,
    eq(schema.products.id, schema.productVariants.product_id)
  )
  .where(eq(schema.products.store_id, storeId))
```

### Criar Pedido Completo

```typescript
import { db, schema } from '@white-label/db'

// 1. Criar o pedido
const [order] = await db
  .insert(schema.orders)
  .values({
    store_id: storeId,
    customer_id: customerId,
    total: '199.98',
    status: 'pending',
    payment_status: 'pending',
    shipping_cost: '15.00'
  })
  .returning()

// 2. Adicionar itens
await db.insert(schema.orderItems).values([
  {
    order_id: order.id,
    product_id: productId1,
    quantity: 2,
    price: '99.99'
  },
  {
    order_id: order.id,
    product_id: productId2,
    quantity: 1,
    price: '49.99'
  }
])
```

### Buscar Estoque Atual

```typescript
import { db, schema } from '@white-label/db'
import { eq, sum } from 'drizzle-orm'

// Estoque total de um produto (todas as variantes)
const stock = await db
  .select({
    total: sum(schema.productVariants.stock)
  })
  .from(schema.productVariants)
  .where(eq(schema.productVariants.product_id, productId))
```

### Registrar Movimentação de Estoque

```typescript
import { db, schema } from '@white-label/db'

await db.insert(schema.stockMovements).values({
  store_id: storeId,
  product_id: productId,
  variant_id: variantId,
  type: 'sale',
  origin: 'order',
  quantity: -2 // Negativo para saída
})
```

## 🔍 Queries Comuns

### Buscar Pedidos com Cliente

```typescript
const ordersWithCustomer = await db
  .select({
    order: schema.orders,
    customer: schema.customers
  })
  .from(schema.orders)
  .leftJoin(
    schema.customers,
    eq(schema.orders.customer_id, schema.customers.id)
  )
  .where(eq(schema.orders.store_id, storeId))
```

### Buscar Produtos por Categoria

```typescript
const productsInCategory = await db
  .select({
    product: schema.products,
    category: schema.categories
  })
  .from(schema.productCategory)
  .innerJoin(
    schema.products,
    eq(schema.productCategory.product_id, schema.products.id)
  )
  .innerJoin(
    schema.categories,
    eq(schema.productCategory.category_id, schema.categories.id)
  )
  .where(eq(schema.categories.id, categoryId))
```

## ⚠️ Boas Práticas

1. **Sempre filtre por `store_id`** quando buscar dados de uma loja
2. **Use transações** para operações que envolvem múltiplas tabelas
3. **Valide dados** antes de inserir (use Zod schemas)
4. **Use índices** para queries frequentes
5. **Não delete dados** diretamente, use soft delete quando possível
6. **Mantenha histórico** em tabelas de logs quando necessário
