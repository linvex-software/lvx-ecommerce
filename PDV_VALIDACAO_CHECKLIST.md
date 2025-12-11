# 📋 Validação do PDV - Checklist Completo

**Data:** 2024-12-19  
**Branch:** `feature/pdv-profissional`  
**Status:** Validação sem implementação

---

## ✅ Checklist Backend

### 1. Criar/atualizar carrinho PDV (add/remover/quantidade)
**Status:** ✅ **OK**

**Implementado:**
- ✅ `POST /physical-sales/cart/add-item` - Adiciona item ao carrinho
- ✅ `POST /physical-sales/cart/remove-item` - Remove item do carrinho
- ✅ `PUT /physical-sales/cart/update-quantity` - Atualiza quantidade
- ✅ `GET /physical-sales/cart/active` - Busca carrinho ativo
- ✅ Backend cria carrinho automaticamente se não existir
- ✅ Use cases: `add-item-to-pdv-cart.ts`, `remove-item-from-pdv-cart.ts`, `update-item-quantity-pdv-cart.ts`

**Arquivos:**
- `apps/api/src/application/physical-sales/use-cases/add-item-to-pdv-cart.ts`
- `apps/api/src/application/physical-sales/use-cases/remove-item-from-pdv-cart.ts`
- `apps/api/src/application/physical-sales/use-cases/update-item-quantity-pdv-cart.ts`
- `apps/api/src/presentation/http/physical-sales/physical-sales-controller.ts`
- `apps/api/src/presentation/http/physical-sales/physical-sales-routes.ts`

---

### 2. Associar cliente ao carrinho (buscar/criar)
**Status:** ✅ **OK**

**Implementado:**
- ✅ `POST /physical-sales/cart/associate-customer` - Associa cliente ao carrinho
- ✅ Validação de cliente existente
- ✅ Suporte a `customer_id` nullable
- ✅ Migration criada para `customer_id` na tabela `physical_sales_carts`

**Arquivos:**
- `apps/api/src/application/physical-sales/use-cases/associate-customer-to-pdv-cart.ts`
- `packages/db/drizzle/0018_add_pdv_cart_customer_fields.sql`

---

### 3. Aplicar desconto (item e pedido)
**Status:** ✅ **OK**

**Implementado:**
- ✅ `POST /physical-sales/cart/apply-discount` - Aplica desconto
- ✅ Suporte a cupom (coupon_code)
- ✅ Suporte a desconto manual (discount_amount)
- ✅ Desconto por item (campo `discount` em cada item)
- ✅ Desconto no pedido (campo `discount_amount` no carrinho)

**Arquivos:**
- `apps/api/src/application/physical-sales/use-cases/apply-discount-to-pdv-cart.ts`

---

### 4. Registrar vendedor, origem e comissão
**Status:** ⚠️ **PARCIAL**

**Implementado:**
- ✅ `POST /physical-sales/cart/set-seller` - Define vendedor
- ✅ `POST /physical-sales/cart/set-origin` - Define origem
- ✅ Campo `seller_user_id` no carrinho
- ✅ Campo `origin` no carrinho
- ✅ Campo `commission_rate` no schema (nullable)

**Faltando:**
- ⚠️ Cálculo automático de comissão baseado em regras de negócio (backend menciona que será calculado, mas não há implementação de regras)
- ⚠️ Endpoint para configurar regras de comissão

**Arquivos:**
- `apps/api/src/application/physical-sales/use-cases/set-cart-seller.ts`
- `apps/api/src/application/physical-sales/use-cases/set-cart-origin.ts`

---

### 5. Finalizar venda PDV → gerar pedido
**Status:** ✅ **OK**

**Implementado:**
- ✅ `POST /physical-sales/cart/finalize` - Finaliza venda e gera pedido
- ✅ Validação de estoque
- ✅ Criação de pedido com todos os dados
- ✅ Movimentação de estoque
- ✅ Atualização de carrinho para status "converted"
- ✅ Suporte a cupom e desconto

**Arquivos:**
- `apps/api/src/application/physical-sales/use-cases/finalize-pdv-sale.ts`

---

### 6. Gerar link de pagamento + retornar URL
**Status:** ✅ **OK**

**Implementado:**
- ✅ `POST /physical-sales/generate-payment-link` - Gera link de pagamento
- ✅ Suporte a PIX, cartão de crédito, cartão de débito
- ✅ Retorna `paymentUrl`, `qrCode`, `qrCodeBase64`, `ticketUrl`, `transactionId`
- ✅ Integração com Mercado Pago

**Arquivos:**
- `apps/api/src/application/physical-sales/use-cases/generate-payment-link.ts`
- `apps/api/src/infra/gateways/mercado-pago-gateway.ts`

---

### 7. Webhook/status de pagamento (Pendente/Pago/Falhou)
**Status:** ✅ **OK**

**Implementado:**
- ✅ `POST /webhooks/mercadopago` - Recebe webhooks do Mercado Pago
- ✅ Processamento de webhook atualiza status do pedido
- ✅ Mapeamento de status: `pending`, `paid`, `failed`
- ✅ Atualização de `payment_status` no pedido

**Arquivos:**
- `apps/api/src/application/payments/use-cases/process-payment-webhook.ts`
- `apps/api/src/application/webhooks/use-cases/process-webhook-event.ts`

---

### 8. Suporte a envio (dados básicos)
**Status:** ⚠️ **PARCIAL**

**Implementado:**
- ✅ Campo `shipping_address` no schema do carrinho (JSONB)
- ✅ Suporte a endereço de entrega no `finalize-pdv-sale`
- ✅ Estrutura de endereço completa (CEP, rua, número, etc.)

**Faltando:**
- ⚠️ Interface no frontend para cadastrar endereço de envio
- ⚠️ Cálculo de frete no PDV (existe no checkout web, mas não no PDV)

**Arquivos:**
- `apps/api/src/application/physical-sales/use-cases/finalize-pdv-sale.ts` (aceita shipping_address)

---

### 9. Endpoint para nota/recibo
**Status:** ✅ **OK**

**Implementado:**
- ✅ `GET /physical-sales/orders/:orderId/receipt` - Retorna dados do pedido para recibo
- ✅ Retorna pedido completo com itens, cliente, totais

**Arquivos:**
- `apps/api/src/presentation/http/physical-sales/physical-sales-controller.ts` (método `getOrderReceipt`)

---

### 10. Config de logo da loja para o PDV
**Status:** ✅ **OK**

**Implementado:**
- ✅ `GET /stores/theme/public` - Retorna tema da loja (incluindo logo)
- ✅ Hook `useStoreTheme()` no frontend
- ✅ Logo exibido no recibo

**Arquivos:**
- `apps/pdv/lib/hooks/use-store-theme.ts`
- `apps/pdv/app/receipt/[orderId]/page.tsx`

---

## ✅ Checklist Frontend

### 1. Tela PDV com carrinho + pesquisa de produtos
**Status:** ✅ **OK**

**Implementado:**
- ✅ Tela de Ações (Home) com 6 cards
- ✅ Tela de Carrinho (Cart View) completa
- ✅ Componente `ProductSearch` para buscar produtos
- ✅ Integração com `usePdvCart()` para estado do carrinho

**Arquivos:**
- `apps/pdv/app/page.tsx`
- `apps/pdv/components/pdv/actions-home.tsx`
- `apps/pdv/components/pdv/cart-view.tsx`
- `apps/pdv/components/pdv/product-search.tsx`

---

### 2. Seleção/criação rápida de cliente
**Status:** ✅ **OK**

**Implementado:**
- ✅ Componente `CustomerSearch` para buscar clientes
- ✅ Modal de seleção de cliente
- ✅ Criação rápida de cliente
- ✅ Associação de cliente ao carrinho
- ✅ Exibição de cliente no carrinho (nome, telefone, CPF formatado)

**Arquivos:**
- `apps/pdv/components/pdv/customer-search.tsx`
- `apps/pdv/lib/hooks/use-customers.ts`

---

### 3. Add/remover produtos + alterar quantidade
**Status:** ✅ **OK**

**Implementado:**
- ✅ Botões + e - para alterar quantidade
- ✅ Botão X para remover item
- ✅ Atualização em tempo real do carrinho
- ✅ Validação de quantidade mínima (>= 1)

**Arquivos:**
- `apps/pdv/components/pdv/cart-view.tsx`
- `apps/pdv/lib/hooks/use-pdv-cart.ts`

---

### 4. Aplicar desconto visualmente
**Status:** ✅ **OK**

**Implementado:**
- ✅ Modal para aplicar desconto (cupom ou valor)
- ✅ Exibição de desconto por item no carrinho
- ✅ Exibição de desconto total no resumo
- ✅ Cálculo correto de subtotal e total

**Arquivos:**
- `apps/pdv/app/page.tsx` (modal de desconto)
- `apps/pdv/components/pdv/cart-view.tsx` (exibição)

---

### 5. Selecionar vendedor + origem
**Status:** ✅ **OK**

**Implementado:**
- ✅ Dropdown de vendedores (busca usuários com role 'vendedor')
- ✅ Dropdown de origem (PDV, WhatsApp, Instagram, etc.)
- ✅ Atualização via endpoints dedicados

**Arquivos:**
- `apps/pdv/components/pdv/cart-view.tsx`
- `apps/pdv/lib/hooks/use-users.ts`
- `apps/pdv/lib/hooks/use-pdv-cart.ts` (hooks `useUpdateCartSeller`, `useUpdateCartOrigin`)

---

### 6. Mostrar comissão no resumo
**Status:** ❌ **QUEBRADO**

**Implementado:**
- ⚠️ Campo `commission_rate` existe no schema, mas não é exibido no frontend
- ⚠️ Comissão não é calculada/retornada pelo backend

**Faltando:**
- ❌ Exibição de comissão no resumo do carrinho
- ❌ Cálculo de valor da comissão

**Arquivos:**
- `apps/pdv/components/pdv/cart-view.tsx` (não exibe comissão)

---

### 7. Botão "Gerar link de pagamento" + copiar/compartilhar
**Status:** ⚠️ **PARCIAL**

**Implementado:**
- ✅ Hook `useGeneratePaymentLink()` existe
- ✅ Endpoint backend funcionando

**Faltando:**
- ❌ Botão no frontend para gerar link
- ❌ Funcionalidade de copiar/compartilhar link
- ❌ Exibição de QR Code (se PIX)

**Arquivos:**
- `apps/pdv/lib/hooks/use-pdv-cart.ts` (hook existe, mas não usado)

---

### 8. Atualizar status de pagamento em tempo real
**Status:** ⚠️ **PARCIAL**

**Implementado:**
- ✅ Hook `useOrderStatus()` existe
- ✅ Polling automático quando `payment_status === 'pending'`

**Faltando:**
- ❌ Integração no fluxo do PDV após finalizar venda
- ❌ Exibição visual do status de pagamento na tela de pagamento

**Arquivos:**
- `apps/pdv/lib/hooks/use-order-status.ts` (existe, mas não integrado)

---

### 9. Imprimir recibo/nota (HTML)
**Status:** ✅ **OK**

**Implementado:**
- ✅ Página de recibo `/receipt/[orderId]`
- ✅ Layout otimizado para impressão (CSS `print:`)
- ✅ Dados completos: cliente, itens, totais, desconto, origem
- ✅ Logo da loja no recibo

**Arquivos:**
- `apps/pdv/app/receipt/[orderId]/page.tsx`

---

### 10. Exibir logo da loja no topo
**Status:** ⚠️ **PARCIAL**

**Implementado:**
- ✅ Hook `useStoreTheme()` existe
- ✅ Logo exibido no recibo

**Faltando:**
- ❌ Logo não exibido no header/topo do PDV
- ❌ Logo não exibido na tela principal

**Arquivos:**
- `apps/pdv/app/layout.tsx` (header não mostra logo)
- `apps/pdv/app/receipt/[orderId]/page.tsx` (logo apenas no recibo)

---

## ✅ Checklist de Entrega

### 1. Fluxo completo testado: cliente → carrinho → desconto → vendedor → pagamento → pago
**Status:** ⚠️ **PARCIAL**

**Funcionando:**
- ✅ Selecionar cliente
- ✅ Adicionar produtos ao carrinho
- ✅ Alterar quantidade
- ✅ Aplicar desconto
- ✅ Selecionar vendedor e origem
- ✅ Ir para tela de pagamento
- ✅ Finalizar venda (gera pedido)

**Faltando/Quebrado:**
- ⚠️ Gerar link de pagamento (backend OK, frontend não integrado)
- ⚠️ Atualização automática de status após pagamento (hook existe, mas não integrado)
- ⚠️ Visualização de status "Pago" no PDV após webhook

---

### 2. Pedido final contém: cliente, itens, desconto, vendedor, origem, comissão, pagamento, envio
**Status:** ⚠️ **PARCIAL**

**Contém:**
- ✅ Cliente (`customer_id`)
- ✅ Itens (completo)
- ✅ Desconto (`discount_amount` e desconto por item)
- ✅ Vendedor (`seller_user_id` via `_pdv_metadata`)
- ✅ Origem (`origin` via `_pdv_metadata`)
- ✅ Pagamento (status e dados básicos)

**Faltando:**
- ❌ Comissão não é calculada/salva (campo existe, mas não preenchido)
- ⚠️ Envio (estrutura existe, mas não há UI para preencher)

---

### 3. PDV rápido, sem reload desnecessário
**Status:** ✅ **OK**

**Implementado:**
- ✅ React Query para cache e atualização automática
- ✅ Estado local gerenciado com hooks
- ✅ Atualização otimista quando possível
- ✅ Sem reloads de página

---

## 📁 Arquivos Modificados/Criados

### Backend

**Migrations:**
- `packages/db/drizzle/0018_add_pdv_cart_customer_fields.sql` (NOVO)

**Use Cases:**
- `apps/api/src/application/physical-sales/use-cases/add-item-to-pdv-cart.ts`
- `apps/api/src/application/physical-sales/use-cases/remove-item-from-pdv-cart.ts`
- `apps/api/src/application/physical-sales/use-cases/update-item-quantity-pdv-cart.ts`
- `apps/api/src/application/physical-sales/use-cases/associate-customer-to-pdv-cart.ts`
- `apps/api/src/application/physical-sales/use-cases/apply-discount-to-pdv-cart.ts`
- `apps/api/src/application/physical-sales/use-cases/finalize-pdv-sale.ts`
- `apps/api/src/application/physical-sales/use-cases/generate-payment-link.ts`
- `apps/api/src/application/physical-sales/use-cases/set-cart-origin.ts` (NOVO)
- `apps/api/src/application/physical-sales/use-cases/set-cart-seller.ts` (NOVO)

**Controllers:**
- `apps/api/src/presentation/http/physical-sales/physical-sales-controller.ts`

**Routes:**
- `apps/api/src/presentation/http/physical-sales/physical-sales-routes.ts`

**Repositories:**
- `apps/api/src/infra/db/repositories/physical-sales-cart-repository.ts`

**Types:**
- `apps/api/src/domain/physical-sales/physical-sales-types.ts`

### Frontend

**Pages:**
- `apps/pdv/app/page.tsx` (REESTRUTURADO)
- `apps/pdv/app/receipt/[orderId]/page.tsx`
- `apps/pdv/app/layout.tsx` (adicionado Toaster)

**Components:**
- `apps/pdv/components/pdv/actions-home.tsx` (NOVO)
- `apps/pdv/components/pdv/cart-view.tsx` (NOVO)
- `apps/pdv/components/pdv/payment-view.tsx` (NOVO)
- `apps/pdv/components/pdv/product-search.tsx`
- `apps/pdv/components/pdv/customer-search.tsx`
- `apps/pdv/components/ui/card.tsx` (NOVO)
- `apps/pdv/components/ui/avatar.tsx` (NOVO)
- `apps/pdv/components/ui/select.tsx` (NOVO)
- `apps/pdv/components/ui/dialog.tsx` (NOVO)
- `apps/pdv/components/ui/input.tsx` (ATUALIZADO)

**Hooks:**
- `apps/pdv/lib/hooks/use-pdv-cart.ts` (ATUALIZADO)
- `apps/pdv/lib/hooks/use-customers.ts`
- `apps/pdv/lib/hooks/use-products.ts`
- `apps/pdv/lib/hooks/use-users.ts` (NOVO)
- `apps/pdv/lib/hooks/use-customer-by-id.ts` (NOVO)
- `apps/pdv/lib/hooks/use-store-theme.ts`
- `apps/pdv/lib/hooks/use-order-status.ts`

**Utils:**
- `apps/pdv/lib/utils/index.ts` (NOVO)

**Package:**
- `apps/pdv/package.json` (dependências adicionadas)

---

## 📊 Resumo Estatístico

**Total de Itens:** 23

- ✅ **OK (Funcionando):** 16 itens (70%)
- ⚠️ **PARCIAL (Funciona, mas incompleto):** 6 itens (26%)
- ❌ **QUEBRADO (Não funciona):** 1 item (4%)

---

## 🎯 Próximos Passos Recomendados

1. **Comissão:**
   - Implementar cálculo de comissão no backend
   - Exibir comissão no resumo do carrinho

2. **Link de Pagamento:**
   - Adicionar botão "Gerar link" na tela de pagamento
   - Implementar copiar/compartilhar
   - Exibir QR Code para PIX

3. **Status de Pagamento:**
   - Integrar `useOrderStatus()` no fluxo após finalizar venda
   - Exibir status visualmente

4. **Logo no Header:**
   - Adicionar logo no header do PDV usando `useStoreTheme()`

5. **Envio:**
   - Criar UI para cadastrar endereço de envio (opcional)
   - Integrar cálculo de frete (se necessário)

---

**Validação concluída sem implementação de correções.**

