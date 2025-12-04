# 🧪 Guia de Testes - Checkout e Pedidos Online

Guia completo para testar a funcionalidade de checkout e criação de pedidos.

## 📋 Pré-requisitos

1. ✅ Banco de dados configurado e migrations aplicadas
   ```bash
   pnpm db:migrate
   ```

2. ✅ Servidor da API rodando
   ```bash
   pnpm dev
   ```

3. ✅ Ter um produto ativo com estoque
   - Acesse o admin panel: `http://localhost:3001`
   - Crie um produto
   - Adicione estoque (via página de estoque)

4. ✅ Obter Store ID
   ```bash
   pnpm test:store-id
   ```

## 🚀 Testes Automatizados

### Executar script de teste completo

```bash
# 1. Configure o STORE_ID no .env ou exporte
export TEST_STORE_ID="seu-store-id-aqui"

# 2. Execute o script
pnpm tsx scripts/test-checkout-orders.ts
```

## 📝 Testes Manuais via HTTP

### 1. Testar Cálculo de Frete

**Endpoint**: `POST http://localhost:3333/shipping/calculate`

**Headers**:
```
Content-Type: application/json
x-store-id: <STORE_ID>
```

**Body**:
```json
{
  "destination_zip_code": "01310100",
  "items": [
    {
      "quantity": 1,
      "weight": 0.5,
      "height": 10,
      "width": 15,
      "length": 20
    }
  ]
}
```

**Resposta esperada** (200):
```json
{
  "quotes": [
    {
      "id": 1,
      "name": "PAC",
      "price": "15.00",
      "delivery_time": 5,
      "company": {
        "name": "Correios"
      }
    }
  ]
}
```

### 2. Criar Pedido (Checkout)

**Endpoint**: `POST http://localhost:3333/orders`

**Headers**:
```
Content-Type: application/json
x-store-id: <STORE_ID>
```

**Body**:
```json
{
  "items": [
    {
      "product_id": "<PRODUCT_ID>",
      "variant_id": null,
      "quantity": 1,
      "price": 10000
    }
  ],
  "shipping_cost": 1000,
  "coupon_code": null,
  "shipping_address": {
    "zip_code": "01310100",
    "street": "Avenida Paulista",
    "number": "1000",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "country": "BR"
  }
}
```

**Resposta esperada** (201):
```json
{
  "order": {
    "id": "uuid-do-pedido",
    "store_id": "...",
    "total": "11000",
    "status": "pending",
    "payment_status": "pending",
    "shipping_cost": "1000",
    "items": [...]
  }
}
```

### 3. Validar Cupom

**Endpoint**: `POST http://localhost:3333/checkout/validate-coupon`

**Headers**:
```
Content-Type: application/json
x-store-id: <STORE_ID>
```

**Body**:
```json
{
  "code": "DESCONTO10",
  "orderTotal": 10000
}
```

**Resposta esperada** (200):
```json
{
  "valid": true,
  "discountType": "percent",
  "discountValue": 1000,
  "finalPrice": 9000,
  "message": "Cupom aplicado com sucesso."
}
```

### 4. Listar Pedidos (Admin - Requer Autenticação)

**Endpoint**: `GET http://localhost:3333/admin/orders`

**Headers**:
```
Authorization: Bearer <TOKEN>
x-store-id: <STORE_ID>
```

**Query Params** (opcional):
```
?status=pending
?payment_status=paid
?customer_id=<ID>
```

### 5. Atualizar Status do Pedido (Admin)

**Endpoint**: `PUT http://localhost:3333/admin/orders/:id`

**Headers**:
```
Authorization: Bearer <TOKEN>
Content-Type: application/json
x-store-id: <STORE_ID>
```

**Body**:
```json
{
  "status": "processing",
  "payment_status": "paid",
  "tracking_code": "BR123456789BR"
}
```

## 🧪 Testes via Frontend

### 1. Testar Checkout Completo

1. Acesse a loja: `http://localhost:3000`
2. Adicione produtos ao carrinho
3. Vá para o checkout: `http://localhost:3000/checkout`
4. Preencha o formulário
5. Calcule o frete (preenchendo CEP)
6. Clique em "Finalizar Pedido"
7. Verifique a mensagem de sucesso

### 2. Verificar Pedido no Admin

1. Acesse o admin: `http://localhost:3001`
2. Faça login
3. Vá em "Pedidos" (se existir menu) ou `http://localhost:3001/orders`
4. Verifique se o pedido criado aparece na lista

## ✅ Checklist de Verificações

Após criar um pedido, verifique:

- [ ] Pedido foi criado no banco (`orders` table)
- [ ] Itens do pedido foram salvos (`order_items` table)
- [ ] Endereço de entrega foi salvo (`shipping_addresses` table)
- [ ] Movimentação de estoque foi criada (`stock_movements` com `origin='order'`)
- [ ] Estoque do produto foi reduzido
- [ ] Cupom foi incrementado (se aplicado)
- [ ] Carrinho foi marcado como `converted` (se tinha cart_id)

### Verificar no Banco de Dados

```sql
-- Verificar pedido criado
SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;

-- Verificar itens do pedido
SELECT * FROM order_items WHERE order_id = '<ORDER_ID>';

-- Verificar endereço de entrega
SELECT * FROM shipping_addresses WHERE order_id = '<ORDER_ID>';

-- Verificar movimentação de estoque
SELECT * FROM stock_movements 
WHERE origin = 'order' 
ORDER BY created_at DESC LIMIT 5;

-- Verificar estoque atual
SELECT * FROM stock_movements 
WHERE product_id = '<PRODUCT_ID>'
ORDER BY created_at DESC;
```

## 🔍 Troubleshooting

### Erro: "Product not found"
- Verifique se o `product_id` existe
- Verifique se o produto pertence à loja (`store_id`)

### Erro: "Insufficient stock"
- Adicione estoque ao produto via admin panel
- Ou crie movimentação de entrada manualmente

### Erro: "Store ID is required"
- Verifique se o header `x-store-id` está sendo enviado
- Verifique se o `STORE_ID` está correto

### Pedido criado mas sem itens
- Verifique se os itens estão sendo enviados no body
- Verifique logs da API para erros

### Estoque não foi reduzido
- Verifique se a movimentação foi criada com `origin='venda_online'`
- Verifique se o `stock_movements` tem o `order_id` na `reason`

## 📊 Exemplo Completo (cURL)

```bash
# 1. Calcular frete
curl -X POST http://localhost:3333/shipping/calculate \
  -H "Content-Type: application/json" \
  -H "x-store-id: seu-store-id" \
  -d '{
    "destination_zip_code": "01310100",
    "items": [{"quantity": 1, "weight": 0.5, "height": 10, "width": 15, "length": 20}]
  }'

# 2. Criar pedido
curl -X POST http://localhost:3333/orders \
  -H "Content-Type: application/json" \
  -H "x-store-id: seu-store-id" \
  -d '{
    "items": [{"product_id": "produto-id", "quantity": 1, "price": 10000}],
    "shipping_cost": 1000,
    "shipping_address": {"zip_code": "01310100", "street": "Rua Teste", "city": "São Paulo", "state": "SP"}
  }'
```

## 🎯 Próximos Passos

Após verificar que tudo funciona:
1. Teste com múltiplos produtos
2. Teste com cupom de desconto
3. Teste validação de estoque (tente criar pedido sem estoque)
4. Teste atualização de status via admin
5. Teste geração de etiqueta de frete

