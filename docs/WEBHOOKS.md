# 🔔 Sistema de Webhooks - Documentação Completa

Documentação completa do sistema de webhooks para desenvolvedores.

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Conceitos e Funcionalidades](#conceitos-e-funcionalidades)
3. [Estrutura Técnica](#estrutura-técnica)
4. [Como Testar](#como-testar)
5. [Exemplos Práticos](#exemplos-práticos)

---

## 🎯 Visão Geral

O sistema de webhooks permite receber e processar eventos de provedores externos (Mercado Pago, PagSeguro, etc.) de forma segura e confiável.

### Características Principais

- ✅ Multi-tenant (cada loja tem seus próprios webhooks isolados)
- ✅ Validação de assinatura HMAC SHA256
- ✅ Suporte a múltiplos provedores
- ✅ Processamento assíncrono
- ✅ Sistema de retry para eventos falhos
- ✅ Histórico completo de eventos
- ✅ Isolamento de dados por loja

---

## 📚 Conceitos e Funcionalidades

### Provedores Suportados

#### 1. Mercado Pago
- **Provider:** `mercadopago`
- **Event Type:** Extraído do campo `type` do payload
- **Exemplo:** `{ "type": "payment", "data": { ... } }`

#### 2. PagSeguro
- **Provider:** `pagseguro`
- **Event Type:** Extraído do campo `event` do payload
- **Exemplo:** `{ "event": "TRANSACTION", "transaction": { ... } }`

### Estados do Evento

| Status | Descrição |
|--------|-----------|
| `received` | Evento recebido e salvo no banco |
| `processed` | Evento processado com sucesso |
| `failed` | Evento falhou no processamento |
| `retrying` | Evento sendo reprocessado |

### Validação de Assinatura

O sistema valida assinaturas usando **HMAC SHA256**:

1. Calcula HMAC do raw body usando o secret do provider
2. Compara com a assinatura recebida usando `timingSafeEqual`
3. Protege contra timing attacks

**Formatos de Assinatura Suportados:**
- `x-signature: <hash>` (hex)
- `x-signature: sha256=<hash>` (com prefixo)
- `x-hub-signature: sha256=<hash>` (GitHub style)
- `x-mercadopago-signature: <hash>`
- `x-pagseguro-signature: <hash>`

### Campos do Webhook Event

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | ID único do evento |
| `store_id` | uuid | ID da loja (multi-tenant) |
| `provider` | string | Provedor do webhook (mercadopago, pagseguro, etc.) |
| `event_type` | string | Tipo do evento (extraído do payload) |
| `payload` | jsonb | Payload completo do webhook |
| `signature_valid` | boolean | Se a assinatura foi validada |
| `status` | string | Status do processamento |
| `attempts` | number | Número de tentativas de processamento |
| `last_attempt_at` | timestamp | Data da última tentativa |
| `error_message` | string | Mensagem de erro (se houver) |
| `created_at` | timestamp | Data de criação |

---

## 🏗️ Estrutura Técnica

### Arquitetura

```
domain/
  └── webhooks/
      └── webhook-types.ts          # Tipos e interfaces

application/
  └── webhooks/
      └── use-cases/
          ├── process-webhook-event.ts
          └── retry-webhook-event.ts

infra/
  ├── db/
  │   └── repositories/
  │       └── webhook-events-repository.ts
  └── http/
      └── middlewares/
          └── validate-webhook-signature.ts

presentation/
  └── http/
      └── webhooks/
          ├── webhook-controller.ts
          └── webhook-routes.ts
```

### Rotas Disponíveis

#### Rotas Públicas (com validação de assinatura)
- `POST /webhooks/:provider` - Recebe webhook de qualquer provider

#### Rotas Admin (Protegidas)
- `POST /admin/webhooks/:id/retry` - Retenta um webhook falho

### Permissões

| Rota | Permissão Necessária |
|------|---------------------|
| `POST /webhooks/:provider` | Pública (apenas `tenantMiddleware` e validação de assinatura) |
| `POST /admin/webhooks/:id/retry` | `admin` ou `operador` |

---

## 🧪 Como Testar

### Pré-requisitos

1. **Configurar secrets no `.env`:**
   ```env
   WEBHOOK_SECRET_MERCADOPAGO=seu_secret_mercadopago
   WEBHOOK_SECRET_PAGSEGURO=seu_secret_pagseguro
   ```

2. **Rodar migrations:**
   ```bash
   pnpm db:migrate
   ```

3. **Iniciar servidor:**
   ```bash
   pnpm dev
   ```

4. **Obter Store ID:**
   ```bash
   pnpm test:store-id
   ```

### Passo 1: Calcular Assinatura HMAC

**Node.js:**
```javascript
const crypto = require('crypto');
const secret = 'seu_secret_mercadopago';
const payload = JSON.stringify({ 
  type: 'payment', 
  data: { id: '123', status: 'approved' } 
});
const signature = crypto.createHmac('sha256', secret)
  .update(payload)
  .digest('hex');
console.log(signature);
```

**⚠️ Importante:** O payload usado para calcular a assinatura deve ser **exatamente igual** ao JSON enviado no body (incluindo formatação e espaços).

### Passo 2: Enviar Webhook

**POST** `http://localhost:3333/webhooks/mercadopago`

**Headers:**
```
Content-Type: application/json
x-store-id: <SEU_STORE_ID>
x-signature: <HMAC_SHA256_HASH>
```

**Body:**
```json
{
  "type": "payment",
  "data": {
    "id": "123",
    "status": "approved"
  }
}
```

**Resposta (200):**
```json
{
  "received": true,
  "eventId": "uuid-do-evento"
}
```

### Passo 3: Verificar no Banco

```sql
SELECT 
  id,
  provider,
  event_type,
  signature_valid,
  status,
  attempts,
  created_at
FROM webhook_events
WHERE id = '<eventId-da-resposta>';
```

**Deve mostrar:**
- `provider: 'mercadopago'`
- `event_type: 'payment'`
- `signature_valid: true`
- `status: 'processed'`
- `attempts: 0`

---

## 💡 Exemplos Práticos

### Exemplo 1: Webhook Mercado Pago (com assinatura válida)

**Calcular assinatura:**
```javascript
const crypto = require('crypto');
const secret = 'seu_secret_mercadopago';
const payload = JSON.stringify({
  type: 'payment',
  data: { id: '123', status: 'approved' }
});
const signature = crypto.createHmac('sha256', secret)
  .update(payload)
  .digest('hex');
```

**Enviar webhook:**
```bash
POST /webhooks/mercadopago
Headers:
  Content-Type: application/json
  x-store-id: <SEU_STORE_ID>
  x-signature: <SIGNATURE>

Body:
{
  "type": "payment",
  "data": {
    "id": "123",
    "status": "approved"
  }
}
```

**Resultado:**
- Evento salvo com `signature_valid: true`
- Status: `processed`
- Event type: `payment`

---

### Exemplo 2: Webhook PagSeguro (com assinatura válida)

**Calcular assinatura:**
```javascript
const crypto = require('crypto');
const secret = 'seu_secret_pagseguro';
const payload = JSON.stringify({
  event: 'TRANSACTION',
  transaction: { code: 'ABC123', status: 'PAID' }
});
const signature = crypto.createHmac('sha256', secret)
  .update(payload)
  .digest('hex');
```

**Enviar webhook:**
```bash
POST /webhooks/pagseguro
Headers:
  Content-Type: application/json
  x-store-id: <SEU_STORE_ID>
  x-signature: <SIGNATURE>

Body:
{
  "event": "TRANSACTION",
  "transaction": {
    "code": "ABC123",
    "status": "PAID"
  }
}
```

**Resultado:**
- Evento salvo com `signature_valid: true`
- Status: `processed`
- Event type: `TRANSACTION`

---

### Exemplo 3: Webhook com Assinatura Inválida

**Enviar webhook:**
```bash
POST /webhooks/mercadopago
Headers:
  Content-Type: application/json
  x-store-id: <SEU_STORE_ID>
  x-signature: assinatura_invalida_qualquer

Body:
{
  "type": "payment",
  "data": { "id": "123" }
}
```

**Resultado:**
- Evento salvo com `signature_valid: false`
- Status: `failed`
- Error message: `Invalid signature`

---

### Exemplo 4: Retry de Webhook Falho

**Pré-requisito:** Fazer login para obter token

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

**Retentar webhook:**
```bash
POST /admin/webhooks/<EVENT_ID>/retry
Headers:
  Authorization: Bearer <ACCESS_TOKEN>
  x-store-id: <SEU_STORE_ID>
```

**Resposta (200):**
```json
{
  "retried": true,
  "eventId": "<EVENT_ID>",
  "newStatus": "processed"
}
```

**Resultado:**
- `attempts` incrementado
- `last_attempt_at` atualizado
- `status` atualizado (pode continuar `failed` se assinatura for inválida)

---

## 🔍 Troubleshooting

### Erro 400 (Store ID is required)
- Adicione o header `x-store-id: <SEU_STORE_ID>`

### Erro 400 (Request body is required)
- Verifique se o `Content-Type: application/json` está presente
- Verifique se o body está sendo enviado corretamente

### Erro 500 (Webhook secret not configured)
- Configure a variável de ambiente `WEBHOOK_SECRET_<PROVIDER>` no `.env`
- Exemplo: `WEBHOOK_SECRET_MERCADOPAGO=seu_secret`

### Assinatura sempre inválida
- Verifique se o secret está correto
- Verifique se está usando o raw body (não o JSON parseado) para calcular HMAC
- **Importante:** O payload usado para calcular a assinatura deve ser **exatamente igual** ao JSON enviado (incluindo formatação e espaços)
- Se estiver usando Insomnia/Postman com JSON formatado, use a assinatura calculada com JSON formatado

### Evento não processa
- Verifique os logs do servidor
- Verifique se há erros no processamento
- Verifique se o `event_type` está sendo extraído corretamente do payload

### Retry não funciona
- Verifique se o evento existe e pertence à loja
- Verifique se você tem permissão (admin ou operador)
- Verifique se o token de autenticação está válido

---

## 📝 Notas Importantes

1. **Formato do Payload:** O payload usado para calcular a assinatura deve ser **exatamente igual** ao JSON enviado no body. Se o Insomnia/Postman enviar JSON formatado (com espaços), use a assinatura calculada com JSON formatado.

2. **Multi-tenant:** Cada loja tem seus próprios webhooks isolados. Webhooks de uma loja não aparecem em outra.

3. **Processamento Assíncrono:** O webhook é recebido e salvo imediatamente (200 OK), mas o processamento acontece de forma assíncrona.

4. **Retry:** Eventos com `signature_valid: false` não podem ser processados, mesmo com retry. O retry só funciona para eventos que falharam por outros motivos (erro no processamento, timeout, etc.).

5. **Secrets:** Guarde os secrets em local seguro. Eles são necessários para validar assinaturas dos webhooks.

---

## 🚀 Próximos Passos

Funcionalidades futuras que podem ser implementadas:

- [ ] Handlers específicos para cada tipo de evento (payment.created, order.updated, etc.)
- [ ] Integração com sistema de notificações
- [ ] Dashboard de monitoramento de webhooks
- [ ] Webhooks com retry automático configurável
- [ ] Rate limiting por provider
- [ ] Webhooks com filtros por tipo de evento

