# 🎫 Sistema de Cupons - Documentação Completa

Documentação completa do sistema de cupons para desenvolvedores.

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Conceitos e Funcionalidades](#conceitos-e-funcionalidades)
3. [Estrutura Técnica](#estrutura-técnica)
4. [Como Testar](#como-testar)
5. [Exemplos Práticos](#exemplos-práticos)

---

## 🎯 Visão Geral

O sistema de cupons permite criar e gerenciar cupons de desconto para lojas. Cada cupom pode ser:
- **Percentual**: Desconto em porcentagem (ex: 10% de desconto)
- **Valor Fixo**: Desconto em valor fixo em centavos (ex: R$ 10,00)

### Características Principais

- ✅ Multi-tenant (cada loja tem seus próprios cupons)
- ✅ Código único por loja
- ✅ Limite de usos configurável
- ✅ Validade por data de expiração
- ✅ Valor mínimo do pedido
- ✅ Soft delete (desativação, não remove do banco)
- ✅ Histórico de uso

---

## 📚 Conceitos e Funcionalidades

### Tipos de Cupom

#### 1. Cupom Percentual (`type: "percent"`)
- Desconto calculado em porcentagem sobre o valor do pedido
- Exemplo: `value: 10` = 10% de desconto
- Limite: máximo 100%

**Cálculo:**
```
desconto = Math.floor(orderTotal * (value / 100))
```

**Exemplo:**
- Pedido: R$ 100,00 (10000 centavos)
- Cupom: 10%
- Desconto: R$ 10,00 (1000 centavos)
- Total final: R$ 90,00 (9000 centavos)

#### 2. Cupom Valor Fixo (`type: "fixed"`)
- Desconto em valor fixo (em centavos)
- Exemplo: `value: 1000` = R$ 10,00 de desconto
- Não pode exceder o valor do pedido

**Cálculo:**
```
desconto = Math.min(orderTotal, value)
```

**Exemplo:**
- Pedido: R$ 50,00 (5000 centavos)
- Cupom: R$ 10,00 (1000 centavos)
- Desconto: R$ 10,00 (1000 centavos)
- Total final: R$ 40,00 (4000 centavos)

### Campos do Cupom

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `code` | string | ✅ | Código do cupom (único por loja, normalizado para UPPERCASE) |
| `type` | `"percent" \| "fixed"` | ✅ | Tipo de desconto |
| `value` | number | ✅ | Valor do desconto (porcentagem ou centavos) |
| `min_value` | number | ❌ | Valor mínimo do pedido para usar o cupom (em centavos) |
| `max_uses` | number | ❌ | Limite máximo de usos do cupom |
| `expires_at` | string (ISO) | ❌ | Data de expiração do cupom |
| `active` | boolean | ✅ | Se o cupom está ativo (gerenciado automaticamente) |

### Validações

O sistema valida automaticamente:

1. ✅ **Cupom existe** - Código deve existir na loja
2. ✅ **Cupom ativo** - Deve estar com `active: true`
3. ✅ **Não expirado** - `expires_at` deve ser no futuro (se definido)
4. ✅ **Limite de usos** - `used_count` deve ser menor que `max_uses` (se definido)
5. ✅ **Valor mínimo** - `orderTotal` deve ser maior ou igual a `min_value` (se definido)

---

## 🏗️ Estrutura Técnica

### Arquitetura

```
domain/
  └── coupons/
      └── coupon-types.ts          # Tipos e interfaces

application/
  └── coupons/
      └── use-cases/
          ├── create-coupon.ts
          ├── update-coupon.ts
          ├── delete-coupon.ts
          ├── list-coupons.ts
          └── validate-coupon-for-checkout.ts

infra/
  └── db/
      └── repositories/
          ├── coupon-repository.ts
          └── coupon-usage-repository.ts

presentation/
  └── http/
      ├── admin/
      │   ├── coupon-controller.ts
      │   └── coupon-routes.ts
      └── checkout/
          ├── checkout-controller.ts
          └── checkout-routes.ts
```

### Rotas Disponíveis

#### Rotas Admin (Protegidas)
- `GET /admin/coupons` - Listar cupons
- `POST /admin/coupons` - Criar cupom
- `PUT /admin/coupons/:id` - Atualizar cupom
- `DELETE /admin/coupons/:id` - Desativar cupom (soft delete)

#### Rotas Públicas
- `POST /checkout/validate-coupon` - Validar cupom para checkout

### Permissões

| Rota | Permissão Necessária |
|------|---------------------|
| `GET /admin/coupons` | `admin` ou `operador` |
| `POST /admin/coupons` | `admin` |
| `PUT /admin/coupons/:id` | `admin` |
| `DELETE /admin/coupons/:id` | `admin` |
| `POST /checkout/validate-coupon` | Pública (apenas `tenantMiddleware`) |

---

## 🧪 Como Testar

### Pré-requisitos

1. **Rodar migrations:**
   ```bash
   pnpm db:migrate
   ```

2. **Iniciar servidor:**
   ```bash
   pnpm dev
   ```

3. **Obter Store ID:**
   ```bash
   pnpm test:store-id
   ```

### Passo 1: Autenticação

**POST** `http://localhost:3333/auth/login`

**Headers:**
```
Content-Type: application/json
x-store-id: <SEU_STORE_ID>
```

**Body:**
```json
{
  "email": "admin@teste.com",
  "password": "admin123"
}
```

**Resposta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

💾 **Guarde o `accessToken`!**

---

### Passo 2: Criar Cupom

**POST** `http://localhost:3333/admin/coupons`

**Headers:**
```
Content-Type: application/json
x-store-id: <SEU_STORE_ID>
Authorization: Bearer <SEU_ACCESS_TOKEN>
```

**Body - Cupom Percentual:**
```json
{
  "code": "DESCONTO10",
  "type": "percent",
  "value": 10,
  "min_value": 5000,
  "max_uses": 100
}
```

**Body - Cupom Valor Fixo:**
```json
{
  "code": "FRETE10",
  "type": "fixed",
  "value": 1000,
  "min_value": 2000
}
```

**Resposta (201):**
```json
{
  "coupon": {
    "id": "...",
    "code": "DESCONTO10",
    "type": "percent",
    "value": "10.00",
    "active": true,
    ...
  }
}
```

---

### Passo 3: Listar Cupons

**GET** `http://localhost:3333/admin/coupons?active=true`

**Headers:**
```
x-store-id: <SEU_STORE_ID>
Authorization: Bearer <SEU_ACCESS_TOKEN>
```

**Query params:**
- `?active=true` - Apenas ativos
- `?active=false` - Apenas inativos
- Sem query - Todos

**Resposta (200):**
```json
{
  "coupons": [
    {
      "id": "...",
      "code": "DESCONTO10",
      "type": "percent",
      "value": "10.00",
      "active": true,
      ...
    }
  ]
}
```

---

### Passo 4: Atualizar Cupom

**PUT** `http://localhost:3333/admin/coupons/:id`

**Headers:**
```
Content-Type: application/json
x-store-id: <SEU_STORE_ID>
Authorization: Bearer <SEU_ACCESS_TOKEN>
```

**Body (campos opcionais):**
```json
{
  "value": 15,
  "active": false,
  "expires_at": "2026-01-31T23:59:59Z"
}
```

**Resposta (200):**
```json
{
  "coupon": {
    "id": "...",
    "value": "15.00",
    "active": false,
    ...
  }
}
```

---

### Passo 5: Desativar Cupom (Soft Delete)

**DELETE** `http://localhost:3333/admin/coupons/:id`

**Headers:**
```
x-store-id: <SEU_STORE_ID>
Authorization: Bearer <SEU_ACCESS_TOKEN>
```

**Resposta (204):** Sem body

⚠️ **Importante:** O cupom não é removido do banco, apenas marcado como `active: false`

---

### Passo 6: Validar Cupom (Público)

**POST** `http://localhost:3333/checkout/validate-coupon`

**Headers:**
```
Content-Type: application/json
x-store-id: <SEU_STORE_ID>
```

**Body:**
```json
{
  "code": "DESCONTO10",
  "orderTotal": 10000
}
```

**Resposta - Válido (200):**
```json
{
  "valid": true,
  "discountType": "percent",
  "discountValue": 1000,
  "finalPrice": 9000,
  "message": "Cupom aplicado com sucesso."
}
```

**Resposta - Inválido (200):**
```json
{
  "valid": false,
  "message": "Cupom não encontrado."
}
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Cupom de 20% de Desconto

**Criar:**
```json
{
  "code": "PROMO20",
  "type": "percent",
  "value": 20,
  "min_value": 10000,
  "max_uses": 50
}
```

**Validar com pedido de R$ 100,00:**
```json
{
  "code": "PROMO20",
  "orderTotal": 10000
}
```

**Resultado:**
- Desconto: R$ 20,00 (2000 centavos)
- Total final: R$ 80,00 (8000 centavos)

---

### Exemplo 2: Cupom de Frete Grátis (R$ 15,00)

**Criar:**
```json
{
  "code": "FRETEGRATIS",
  "type": "fixed",
  "value": 1500,
  "min_value": 5000
}
```

**Validar com pedido de R$ 50,00:**
```json
{
  "code": "FRETEGRATIS",
  "orderTotal": 5000
}
```

**Resultado:**
- Desconto: R$ 15,00 (1500 centavos)
- Total final: R$ 35,00 (3500 centavos)

---

### Exemplo 3: Cupom Expirado

**Criar:**
```json
{
  "code": "EXPIRED",
  "type": "percent",
  "value": 10,
  "expires_at": "2020-01-01T00:00:00Z"
}
```

**Validar:**
```json
{
  "code": "EXPIRED",
  "orderTotal": 10000
}
```

**Resultado:**
```json
{
  "valid": false,
  "message": "Cupom expirado."
}
```

---

## 🔍 Troubleshooting

### Erro 401 (Unauthorized)
- Token inválido ou expirado
- Faça login novamente

### Erro 403 (Forbidden)
- Usuário não tem permissão
- Verifique a role do usuário (admin para criar/editar/deletar)

### Erro 404 (Not Found)
- Cupom não existe
- Verifique se o ID está correto
- Verifique se o cupom pertence à loja do `x-store-id`

### Erro 409 (Conflict)
- Código de cupom já existe
- Use um código diferente

### Cupom não encontrado na validação
- Código deve estar em UPPERCASE (é normalizado automaticamente)
- Verifique se o `x-store-id` está correto
- Verifique se o cupom está ativo (`active: true`)

---

## 📝 Notas Importantes

1. **Valores em Centavos:** Todos os valores monetários são em centavos (ex: R$ 10,00 = 1000)

2. **Código Normalizado:** Códigos são automaticamente convertidos para UPPERCASE

3. **Soft Delete:** Deletar um cupom não remove do banco, apenas marca `active: false`

4. **Multi-tenant:** Cada loja tem seus próprios cupons isolados

5. **Unicidade:** Código deve ser único por loja, mas pode repetir em lojas diferentes

6. **Validação Pública:** A rota de validação não precisa de autenticação, apenas do `x-store-id`

---

## 🚀 Próximos Passos

Funcionalidades futuras que podem ser implementadas:

- [ ] Integração com criação de pedidos (incrementar `used_count`)
- [ ] Histórico de uso detalhado
- [ ] Cupons por categoria de produto
- [ ] Cupons por cliente (uso único por cliente)
- [ ] Dashboard de analytics de cupons

