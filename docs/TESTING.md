# 🧪 Guia de Testes - Autenticação

Guia prático para testar as implementações de autenticação JWT + RBAC + Multi-tenant.

## 📋 Pré-requisitos

1. Banco de dados configurado e migrations aplicadas
2. Servidor da API rodando (`pnpm dev`)
3. Ferramenta para fazer requisições HTTP (curl, Postman, Insomnia, ou similar)

## 🗄️ Setup Inicial - Criar Dados de Teste

### 1. Criar uma Loja (Store)

Execute no seu cliente PostgreSQL ou use um script:

```sql
INSERT INTO stores (id, name, domain, active, created_at)
VALUES (
  gen_random_uuid(),
  'Loja Teste',
  'localhost',
  true,
  NOW()
);
```

Anote o `id` da loja criada (será usado como `store_id`).

### 2. Criar um Usuário de Teste

```sql
-- Substitua <STORE_ID> pelo ID da loja criada acima
-- A senha abaixo é "senha123" hasheada com bcrypt
INSERT INTO users (id, store_id, name, email, password_hash, role, created_at)
VALUES (
  gen_random_uuid(),
  '<STORE_ID>',
  'Admin Teste',
  'admin@teste.com',
  '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq',
  'admin',
  NOW()
);
```

**⚠️ Importante**: A senha acima é apenas um exemplo. Você precisa gerar o hash real da senha.

### 3. Gerar Hash de Senha

Crie um script temporário para gerar o hash:

```typescript
// scripts/generate-password-hash.ts
import bcrypt from 'bcryptjs'

const password = 'senha123'
const hash = await bcrypt.hash(password, 10)
console.log('Hash:', hash)
```

Ou use Node.js diretamente:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('senha123', 10).then(h => console.log(h))"
```

## 🚀 Testando as Rotas de Autenticação

### 1. Teste de Login

**Endpoint**: `POST http://localhost:3333/auth/login`

**Headers**:
```
Content-Type: application/json
x-store-id: <STORE_ID>
```

**Body**:
```json
{
  "email": "admin@teste.com",
  "password": "senha123"
}
```

**Resposta esperada** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@teste.com",
    "name": "Admin Teste",
    "role": "admin",
    "storeId": "..."
  }
}
```

**Cookie**: Deve receber `refreshToken` em cookie HttpOnly.

**Exemplo com curl**:
```bash
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -H "x-store-id: <STORE_ID>" \
  -d '{"email":"admin@teste.com","password":"senha123"}' \
  -c cookies.txt \
  -v
```

### 2. Teste de Refresh Token

**Endpoint**: `POST http://localhost:3333/auth/refresh`

**Headers**:
```
x-store-id: <STORE_ID>
```

**⚠️ Importante**: 
- O cookie `refreshToken` é enviado **automaticamente** pelo Insomnia após o login. Não é necessário configurá-lo manualmente.
- **NÃO adicione** `Content-Type: application/json` pois não há body nesta requisição.

**Resposta esperada** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@teste.com",
    "name": "Admin Teste",
    "role": "admin",
    "storeId": "..."
  }
}
```

**Como testar no Insomnia**:
1. Faça login primeiro (veja seção 1)
2. Crie uma nova requisição `POST /auth/refresh`
3. Adicione **apenas** o header `x-store-id: 34c236fc-6f43-49de-aea4-4ad4ff2f4323`
   - ⚠️ **NÃO adicione** `Content-Type: application/json` (não há body nesta requisição)
4. O cookie será enviado automaticamente
5. Envie a requisição (sem body e sem Content-Type)

**Exemplo com curl** (usando cookies salvos):
```bash
curl -X POST http://localhost:3333/auth/refresh \
  -b cookies.txt \
  -v
```

**Exemplo com PowerShell**:
```powershell
# Use a variável $session do login anterior
Invoke-RestMethod -Uri "http://localhost:3333/auth/refresh" `
    -Method Post `
    -WebSession $session
```

### 3. Teste de Logout

**Endpoint**: `POST http://localhost:3333/auth/logout`

**Headers**:
```
x-store-id: <STORE_ID>
Authorization: Bearer <ACCESS_TOKEN>
```

**⚠️ Importante**: 
- Use o `accessToken` recebido no login ou refresh
- O cookie `refreshToken` é enviado automaticamente pelo Insomnia
- **NÃO adicione** `Content-Type: application/json` pois não há body nesta requisição

**Resposta esperada** (204 No Content)

**Como testar no Insomnia**:
1. Faça login primeiro (veja seção 1) e copie o `accessToken`
2. Crie uma nova requisição `POST /auth/logout`
3. Adicione **apenas** os headers:
   - `x-store-id: 34c236fc-6f43-49de-aea4-4ad4ff2f4323`
   - `Authorization: Bearer <seu_access_token>`
   - ⚠️ **NÃO adicione** `Content-Type: application/json` (não há body nesta requisição)
4. O cookie será enviado automaticamente
5. Envie a requisição (sem body e sem Content-Type)
6. Deve retornar status 204 (sem conteúdo)

**Exemplo com curl**:
```bash
curl -X POST http://localhost:3333/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -b cookies.txt \
  -v
```

**Exemplo com PowerShell**:
```powershell
Invoke-RestMethod -Uri "http://localhost:3333/auth/logout" `
    -Method Post `
    -Headers @{
        "Authorization" = "Bearer <ACCESS_TOKEN>"
    } `
    -WebSession $session
```

## 🔒 Testando Middlewares

### 1. Teste do Tenant Middleware

**Cenário 1: Store ID válido no header**
```bash
curl -X GET http://localhost:3333/auth/login \
  -H "x-store-id: <STORE_ID_VALIDO>" \
  -v
```

**Cenário 2: Store ID inválido**
```bash
curl -X GET http://localhost:3333/auth/login \
  -H "x-store-id: 00000000-0000-0000-0000-000000000000" \
  -v
```
**Esperado**: 404 com `{"error": "Store not found"}`

### 2. Teste do Auth Middleware (requireAuth)

**Cenário 1: Token válido**
```bash
curl -X POST http://localhost:3333/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN_VALIDO>" \
  -v
```

**Cenário 2: Token ausente**
```bash
curl -X POST http://localhost:3333/auth/logout \
  -v
```
**Esperado**: 401 com `{"error": "Missing or invalid authorization header"}`

**Cenário 3: Token inválido/expirado**
```bash
curl -X POST http://localhost:3333/auth/logout \
  -H "Authorization: Bearer token-invalido" \
  -v
```
**Esperado**: 401 com `{"error": "Invalid or expired token"}`

### 3. Teste do Role Middleware (requireRole)

Para testar, você precisaria criar uma rota protegida. Exemplo:

```typescript
// Em uma rota futura
app.get('/admin/users', {
  preHandler: [tenantMiddleware, requireAuth, requireRole(['admin'])]
}, async (request, reply) => {
  return { users: [] }
})
```

**Cenário 1: Role permitida (admin)**
```bash
curl -X GET http://localhost:3333/admin/users \
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>" \
  -H "x-store-id: <STORE_ID>" \
  -v
```
**Esperado**: 200

**Cenário 2: Role não permitida (vendedor tentando acessar rota admin)**
```bash
curl -X GET http://localhost:3333/admin/users \
  -H "Authorization: Bearer <ACCESS_TOKEN_VENDEDOR>" \
  -H "x-store-id: <STORE_ID>" \
  -v
```
**Esperado**: 403 com `{"error": "Forbidden: insufficient permissions"}`

## 📝 Script de Teste Automatizado

Crie um arquivo `scripts/test-auth.ts`:

```typescript
import { db, schema } from '@white-label/db'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

async function setupTestData() {
  // Criar store
  const [store] = await db
    .insert(schema.stores)
    .values({
      name: 'Loja Teste',
      domain: 'localhost',
      active: true
    })
    .returning()

  // Criar usuário
  const passwordHash = await bcrypt.hash('senha123', 10)
  const [user] = await db
    .insert(schema.users)
    .values({
      store_id: store.id,
      name: 'Admin Teste',
      email: 'admin@teste.com',
      password_hash: passwordHash,
      role: 'admin'
    })
    .returning()

  console.log('Store ID:', store.id)
  console.log('User ID:', user.id)
  console.log('Email:', user.email)
  console.log('Password: senha123')
}

setupTestData().catch(console.error)
```

Execute:
```bash
cd packages/db
tsx ../../scripts/test-auth.ts
```

## 🔍 Verificações no Banco de Dados

### Verificar Sessões Criadas

```sql
SELECT 
  id,
  user_id,
  store_id,
  expires_at,
  created_at,
  revoked_at
FROM auth_sessions
WHERE user_id = '<USER_ID>'
ORDER BY created_at DESC;
```

### Verificar Limite de Sessões

Faça login 6 vezes seguidas e verifique se apenas 5 sessões ativas são mantidas:

```sql
SELECT COUNT(*) 
FROM auth_sessions 
WHERE user_id = '<USER_ID>' 
  AND revoked_at IS NULL 
  AND expires_at > NOW();
```

**Esperado**: Máximo 5 sessões ativas.

## 🐛 Troubleshooting

### Erro: "Store not found"
- Verifique se a loja existe no banco
- Verifique se o `x-store-id` está correto
- Verifique se a loja está `active = true`

### Erro: "Invalid credentials"
- Verifique se o email está correto
- Verifique se a senha está correta
- Verifique se o hash da senha foi gerado corretamente

### Erro: "Refresh token not found"
- Verifique se o cookie está sendo enviado
- Verifique se o cookie não expirou
- Verifique se a sessão não foi revogada

### Erro: "Invalid or expired token"
- Verifique se o access token não expirou
- Verifique se o `JWT_ACCESS_SECRET` está configurado
- Gere um novo token fazendo refresh

## 📚 Exemplos com Postman/Insomnia

### Collection para Postman

1. **Variáveis de Ambiente**:
   - `baseUrl`: `http://localhost:3333`
   - `storeId`: `<STORE_ID>`
   - `accessToken`: (será preenchido após login)
   - `refreshToken`: (será preenchido após login)

2. **Request: Login**
   - Method: `POST`
   - URL: `{{baseUrl}}/auth/login`
   - Headers: `x-store-id: {{storeId}}`
   - Body (JSON):
     ```json
     {
       "email": "admin@teste.com",
       "password": "senha123"
     }
     ```
   - Tests (Postman):
     ```javascript
     const response = pm.response.json()
     pm.environment.set("accessToken", response.accessToken)
     ```

3. **Request: Refresh**
   - Method: `POST`
   - URL: `{{baseUrl}}/auth/refresh`
   - Cookies: Automático (refreshToken)

4. **Request: Logout**
   - Method: `POST`
   - URL: `{{baseUrl}}/auth/logout`
   - Headers: `Authorization: Bearer {{accessToken}}`
   - Cookies: Automático (refreshToken)

## ✅ Checklist de Testes

- [ ] Login com credenciais válidas retorna accessToken e user
- [ ] Login cria sessão em `auth_sessions`
- [ ] Login seta cookie `refreshToken` HttpOnly
- [ ] Login com credenciais inválidas retorna 401
- [ ] Login com store inexistente retorna 404
- [ ] Refresh token renova accessToken
- [ ] Refresh token gira novo refreshToken
- [ ] Refresh token expirado retorna 401
- [ ] Refresh token revogado retorna 401
- [ ] Logout revoga sessão
- [ ] Logout limpa cookie
- [ ] Limite de 5 sessões por usuário funciona
- [ ] Middleware de tenant funciona com `x-store-id`
- [ ] Middleware de auth valida JWT corretamente
- [ ] Middleware de role bloqueia acesso não autorizado
