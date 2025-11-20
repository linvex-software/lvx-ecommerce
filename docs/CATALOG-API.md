# 📦 API de Catálogo - Documentação

Documentação completa da API de catálogo de produtos, estoque e movimentações.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Endpoints Admin](#endpoints-admin)
3. [Endpoints Públicos](#endpoints-públicos)
4. [Autenticação e Autorização](#autenticação-e-autorização)
5. [Exemplos de Requisições](#exemplos-de-requisições)
6. [Códigos de Erro](#códigos-de-erro)

---

## 🎯 Visão Geral

A API de catálogo permite gerenciar produtos, variantes, imagens, categorias, SEO, size charts, estoque e movimentações de estoque.

### Características

- ✅ **Multi-tenant**: Todos os endpoints isolam dados por `store_id`
- ✅ **Autenticação**: Endpoints admin requerem JWT
- ✅ **Autorização**: Controle de acesso por roles (admin, operador)
- ✅ **Validação**: Validação de entrada com Zod
- ✅ **Soft Delete**: Produtos são inativados, não deletados

---

## 🔐 Autenticação e Autorização

### Headers Obrigatórios

Todas as requisições devem incluir:

```
Authorization: Bearer <token>
x-store-id: <store-id>
```

### Roles

- **admin**: Acesso completo (criar, editar, deletar produtos)
- **operador**: Acesso de leitura e gestão de estoque
- **público**: Apenas leitura de produtos ativos

---

## 📍 Endpoints Admin

### 1. Listar Produtos

**GET** `/admin/products`

Lista produtos da loja com paginação e filtros.

**Permissões**: `admin` ou `operador`

**Query Parameters**:
- `q` (string, opcional): Busca por nome ou SKU
- `category_id` (uuid, opcional): Filtrar por categoria
- `status` (string, opcional): `draft`, `active` ou `inactive`
- `page` (number, opcional): Página (padrão: 1)
- `limit` (number, opcional): Itens por página (padrão: 20, máximo: 100)

**Resposta** (200):
```json
{
  "products": [
    {
      "id": "uuid",
      "store_id": "uuid",
      "name": "Produto Exemplo",
      "slug": "produto-exemplo",
      "description": "Descrição do produto",
      "base_price": "99.90",
      "sku": "PROD-001",
      "status": "active",
      "virtual_model_url": null,
      "virtual_provider": null,
      "virtual_config_json": null,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

---

### 2. Obter Detalhe do Produto

**GET** `/admin/products/:id`

Retorna detalhe completo do produto incluindo variantes, imagens, categorias, SEO e size chart.

**Permissões**: `admin` ou `operador`

**Resposta** (200):
```json
{
  "product": {
    "id": "uuid",
    "store_id": "uuid",
    "name": "Produto Exemplo",
    "slug": "produto-exemplo",
    "description": "Descrição do produto",
    "base_price": "99.90",
    "sku": "PROD-001",
    "status": "active",
    "virtual_model_url": null,
    "virtual_provider": null,
    "virtual_config_json": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "variants": [
      {
        "id": "uuid",
        "store_id": "uuid",
        "product_id": "uuid",
        "sku": "PROD-001-M",
        "size": "M",
        "color": "Azul",
        "barcode": "1234567890123",
        "price_override": null,
        "active": true
      }
    ],
    "images": [
      {
        "id": "uuid",
        "store_id": "uuid",
        "product_id": "uuid",
        "image_url": "https://example.com/image.jpg",
        "position": 0,
        "is_main": true
      }
    ],
    "categories": [
      {
        "id": "uuid",
        "name": "Categoria",
        "slug": "categoria"
      }
    ],
    "seo": {
      "id": "uuid",
      "store_id": "uuid",
      "product_id": "uuid",
      "meta_title": "Título SEO",
      "meta_description": "Descrição SEO",
      "meta_keywords": "palavras, chave",
      "open_graph_image": "https://example.com/og-image.jpg",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    "size_chart": {
      "id": "uuid",
      "store_id": "uuid",
      "product_id": "uuid",
      "name": "Tabela de Tamanhos",
      "chart_json": {
        "P": { "busto": "86", "cintura": "70" },
        "M": { "busto": "90", "cintura": "74" }
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

---

### 3. Criar Produto

**POST** `/admin/products`

Cria um novo produto com variantes, imagens, categorias, SEO e size chart.

**Permissões**: `admin`

**Body**:
```json
{
  "name": "Produto Exemplo",
  "slug": "produto-exemplo",
  "description": "Descrição do produto",
  "base_price": 99.90,
  "sku": "PROD-001",
  "status": "active",
  "virtual_model_url": null,
  "virtual_provider": null,
  "virtual_config_json": null,
  "variants": [
    {
      "sku": "PROD-001-M",
      "size": "M",
      "color": "Azul",
      "barcode": "1234567890123",
      "price_override": null,
      "active": true
    }
  ],
  "images": [
    {
      "image_url": "https://example.com/image.jpg",
      "position": 0,
      "is_main": true
    }
  ],
  "category_ids": ["uuid-categoria-1", "uuid-categoria-2"],
  "seo": {
    "meta_title": "Título SEO",
    "meta_description": "Descrição SEO",
    "meta_keywords": "palavras, chave",
    "open_graph_image": "https://example.com/og-image.jpg"
  },
  "size_chart": {
    "name": "Tabela de Tamanhos",
    "chart_json": {
      "P": { "busto": "86", "cintura": "70" },
      "M": { "busto": "90", "cintura": "74" }
    }
  }
}
```

**Resposta** (201):
```json
{
  "product": {
    "id": "uuid",
    "store_id": "uuid",
    "name": "Produto Exemplo",
    "slug": "produto-exemplo",
    "description": "Descrição do produto",
    "base_price": "99.90",
    "sku": "PROD-001",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Erros**:
- `400`: Erro de validação
- `409`: SKU ou slug já existe
- `500`: Erro interno

---

### 4. Atualizar Produto

**PUT** `/admin/products/:id`

Atualiza um produto existente. Campos não fornecidos não são alterados.

**Permissões**: `admin`

**Body**: Mesmo formato do criar produto, todos os campos opcionais.

**Resposta** (200): Mesmo formato do criar produto.

**Erros**:
- `400`: Erro de validação
- `404`: Produto não encontrado
- `409`: SKU ou slug já existe
- `500`: Erro interno

---

### 5. Deletar Produto

**DELETE** `/admin/products/:id`

Inativa um produto (soft delete). O produto não é removido do banco, apenas marcado como `inactive`.

**Permissões**: `admin`

**Resposta** (204): Sem conteúdo.

**Erros**:
- `404`: Produto não encontrado
- `500`: Erro interno

---

### 6. Consultar Estoque

**GET** `/admin/products/:id/stock`

Retorna o estoque atual do produto. Se `variant_id` não for fornecido, retorna todos os estoques (produto + variantes).

**Permissões**: `admin` ou `operador`

**Query Parameters**:
- `variant_id` (uuid, opcional): Filtrar por variante específica. Se vazio (`variant_id=`), retorna todos.

**Resposta** (200) - Estoque de uma variante:
```json
{
  "stock": {
    "product_id": "uuid",
    "variant_id": "uuid",
    "current_stock": 50,
    "last_movement_at": "2024-01-01T00:00:00Z"
  }
}
```

**Resposta** (200) - Todos os estoques:
```json
{
  "stocks": [
    {
      "product_id": "uuid",
      "variant_id": null,
      "current_stock": 100,
      "last_movement_at": "2024-01-01T00:00:00Z"
    },
    {
      "product_id": "uuid",
      "variant_id": "uuid-variante-1",
      "current_stock": 50,
      "last_movement_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Cálculo de Estoque**:
- `IN`: Adiciona `quantity` ao estoque
- `OUT`: Subtrai `quantity` do estoque
- `ADJUST`: Se `final_quantity` for fornecido, sobrescreve o cálculo anterior com esse valor. Caso contrário, trata como ajuste relativo.

---

### 7. Criar Movimento de Estoque

**POST** `/admin/products/:id/stock/movements`

Cria um movimento de estoque (entrada, saída ou ajuste).

**Permissões**: `admin` ou `operador`

**Body**:
```json
{
  "variant_id": "uuid-variante-1",
  "type": "IN",
  "origin": "manual",
  "quantity": 10,
  "reason": "Entrada de estoque",
  "final_quantity": null
}
```

**Campos**:
- `variant_id` (uuid, opcional): Variante específica. Se `null`, movimento no produto base.
- `type` (string, obrigatório): `IN`, `OUT` ou `ADJUST`
- `origin` (string, opcional): `manual`, `order`, `physical_sale`, `adjustment`, `return` (padrão: `manual`)
- `quantity` (number, obrigatório): Quantidade (sempre positiva)
- `reason` (string, opcional): Motivo do movimento
- `final_quantity` (number, opcional): Para `ADJUST`, saldo final desejado. Se fornecido, sobrescreve cálculo anterior.

**Resposta** (201):
```json
{
  "movement": {
    "id": "uuid",
    "store_id": "uuid",
    "product_id": "uuid",
    "variant_id": "uuid-variante-1",
    "type": "IN",
    "origin": "manual",
    "quantity": 10,
    "reason": "Entrada de estoque",
    "final_quantity": null,
    "created_by": "uuid-usuario",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Erros**:
- `400`: Erro de validação
- `500`: Erro interno

---

## 🌐 Endpoints Públicos

### 1. Listar Produtos Públicos

**GET** `/products`

Lista apenas produtos com `status = active` da loja.

**Autenticação**: Não requer (apenas `x-store-id`)

**Query Parameters**: Mesmos do endpoint admin (exceto `status`, que é sempre `active`)

**Resposta**: Mesmo formato do endpoint admin.

---

### 2. Obter Produto por Slug

**GET** `/products/:slug`

Retorna detalhe completo do produto por slug (apenas se `status = active`).

**Autenticação**: Não requer (apenas `x-store-id`)

**Resposta**: Mesmo formato do endpoint admin de detalhe.

**Erros**:
- `404`: Produto não encontrado ou inativo

---

## 📝 Exemplos de Requisições

### Criar Produto Completo

```bash
curl -X POST http://localhost:3333/admin/products \
  -H "Authorization: Bearer <token>" \
  -H "x-store-id: <store-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Blazer Essential",
    "slug": "blazer-essential",
    "description": "Blazer clássico em tecido premium",
    "base_price": 299.90,
    "sku": "BLZ-001",
    "status": "active",
    "variants": [
      {
        "size": "P",
        "color": "Preto",
        "barcode": "1234567890123",
        "active": true
      },
      {
        "size": "M",
        "color": "Preto",
        "barcode": "1234567890124",
        "active": true
      }
    ],
    "images": [
      {
        "image_url": "https://example.com/blazer-1.jpg",
        "position": 0,
        "is_main": true
      },
      {
        "image_url": "https://example.com/blazer-2.jpg",
        "position": 1,
        "is_main": false
      }
    ],
    "category_ids": ["uuid-categoria-alfaiataria"],
    "seo": {
      "meta_title": "Blazer Essential - Loja",
      "meta_description": "Blazer clássico em tecido premium. Perfeito para o dia a dia.",
      "meta_keywords": "blazer, alfaiataria, moda masculina"
    }
  }'
```

### Criar Movimento de Estoque

```bash
curl -X POST http://localhost:3333/admin/products/<product-id>/stock/movements \
  -H "Authorization: Bearer <token>" \
  -H "x-store-id: <store-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "variant_id": "uuid-variante-1",
    "type": "IN",
    "origin": "manual",
    "quantity": 50,
    "reason": "Entrada de estoque inicial"
  }'
```

### Ajustar Estoque

```bash
curl -X POST http://localhost:3333/admin/products/<product-id>/stock/movements \
  -H "Authorization: Bearer <token>" \
  -H "x-store-id: <store-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "variant_id": "uuid-variante-1",
    "type": "ADJUST",
    "origin": "adjustment",
    "quantity": 0,
    "final_quantity": 30,
    "reason": "Ajuste de inventário físico"
  }'
```

---

## ⚠️ Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `400` | Erro de validação (payload inválido) |
| `401` | Não autenticado (token inválido ou ausente) |
| `403` | Não autorizado (role insuficiente) |
| `404` | Recurso não encontrado |
| `409` | Conflito (SKU ou slug já existe) |
| `500` | Erro interno do servidor |

---

## 🔄 Fluxo de Estoque

### Regras de Cálculo

1. **IN**: Adiciona `quantity` ao estoque atual
2. **OUT**: Subtrai `quantity` do estoque atual
3. **ADJUST com `final_quantity`**: Define o estoque como `final_quantity` (sobrescreve cálculo anterior)
4. **ADJUST sem `final_quantity`**: Trata como ajuste relativo (adiciona `quantity`)

### Exemplo

```
Estoque inicial: 0

Movimento 1: IN, quantity=50
  → Estoque: 50

Movimento 2: OUT, quantity=10
  → Estoque: 40

Movimento 3: ADJUST, final_quantity=30
  → Estoque: 30 (sobrescreve)

Movimento 4: OUT, quantity=5
  → Estoque: 25
```

---

## 📌 Notas Importantes

1. **Slug**: Deve ser único por loja e seguir padrão `[a-z0-9-]+`
2. **SKU**: Deve ser único por loja
3. **Status**: `draft` (rascunho), `active` (ativo), `inactive` (inativo)
4. **Soft Delete**: Produtos deletados são marcados como `inactive`, não removidos
5. **Multi-tenant**: Todos os dados são isolados por `store_id`
6. **Estoque Negativo**: Não permitido (sempre retorna mínimo 0)

---

## 🚀 Próximos Passos

- [ ] Integração com Redis para cache
- [ ] Integração com Meilisearch para busca
- [ ] Upload de imagens
- [ ] Histórico de movimentações
- [ ] Alertas de estoque baixo

