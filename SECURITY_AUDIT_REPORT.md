# 🔒 Relatório de Auditoria de Segurança

**Data:** 2025-12-14
**Versão do Projeto:** 0.1.0
**Auditor:** Security Audit Scan
**Branch:** `chore/security-audit-scan`

---

## 📊 Resumo Executivo

### Status Geral: ⚠️ **ATENÇÃO**

O projeto apresenta uma **baseline de segurança moderada** com várias vulnerabilidades identificadas que requerem atenção imediata. Embora a arquitetura siga boas práticas (Clean Architecture, separação de camadas), existem riscos críticos relacionados a:

1. **Segredos hardcoded** (COOKIE_SECRET com fallback inseguro)
2. **CORS permissivo** em produção
3. **Vulnerabilidades críticas em dependências** (Next.js 16.0.3)
4. **Ausência de rate limiting** em endpoints sensíveis
5. **Tokens armazenados em localStorage** (risco de XSS)

### Top 5 Riscos Reais

1. **CRITICAL:** Next.js 16.0.3 vulnerável a RCE (CVE-2025-55182) - CVSS 10.0
2. **CRITICAL:** COOKIE_SECRET com fallback inseguro hardcoded
3. **HIGH:** CORS configurado como `origin: true` permitindo qualquer origem
4. **HIGH:** @fastify/multipart vulnerável a DoS (CVE-2025-24033) - CVSS 7.5
5. **MEDIUM:** Tokens JWT armazenados em localStorage (vulnerável a XSS)

---

## 🔍 Achados por Severidade

### 🔴 CRITICAL

#### 1. Next.js 16.0.3 Vulnerável a RCE
- **Contexto:** `apps/admin`, `apps/web`, `apps/pdv` usando Next.js 16.0.3
- **Risco:** Vulnerabilidade crítica (CVE-2025-55182) permite execução remota de código via React Flight Protocol
- **CVSS:** 10.0 (CRITICAL)
- **Como explorar:** Atacante pode enviar requisições maliciosas a endpoints App Router que retornam código compilado de Server Functions, potencialmente executando código arbitrário no servidor
- **Recomendação:** **UPGRADE IMEDIATO** para Next.js 16.0.7 ou superior
- **Status:** ❌ **NÃO CORRIGIDO** (requer atualização de dependências)

#### 2. COOKIE_SECRET com Fallback Inseguro
- **Contexto:** `apps/api/src/server.ts:92`
- **Risco:** Se `COOKIE_SECRET` não estiver definido, o sistema usa `'cookie-secret-change-me'` como fallback. Isso permite que atacantes forjem cookies assinados se descobrirem o valor padrão.
- **Como explorar:** Se o ambiente não tiver `COOKIE_SECRET` definido, um atacante pode usar o valor padrão para criar cookies válidos e potencialmente elevar privilégios ou fazer session fixation.
- **Recomendação:** Remover fallback e lançar erro se variável não estiver definida
- **Status:** ✅ **CORRIGIDO** - Agora lança erro se `COOKIE_SECRET` não estiver definido

#### 3. Next.js Vulnerável a DoS
- **Contexto:** Next.js 16.0.3 em todos os apps frontend
- **Risco:** CVE-2025-55184 permite DoS via deserialização maliciosa em Server Components
- **CVSS:** 7.5 (HIGH)
- **Como explorar:** Requisições HTTP maliciosas podem causar hang do processo e consumo excessivo de CPU
- **Recomendação:** Upgrade para Next.js 16.0.9 ou superior
- **Status:** ❌ **NÃO CORRIGIDO** (requer atualização de dependências)

---

### 🟠 HIGH

#### 4. CORS Permissivo em Produção
- **Contexto:** `apps/api/src/server.ts:87-90`
- **Risco:** CORS configurado com `origin: true` permite requisições de **qualquer origem**, incluindo sites maliciosos. Isso é especialmente perigoso quando combinado com `credentials: true`, permitindo que sites externos façam requisições autenticadas.
- **Como explorar:** Um site malicioso pode fazer requisições autenticadas à API usando cookies/tokens do usuário, potencialmente acessando dados sensíveis ou executando ações não autorizadas.
- **Recomendação:** Configurar `CORS_ORIGINS` com lista específica de origens permitidas em produção
- **Status:** ✅ **CORRIGIDO** - Agora requer `CORS_ORIGINS` em produção (lista de origens separadas por vírgula)

#### 5. @fastify/multipart Vulnerável a DoS
- **Contexto:** `apps/api` usando `@fastify/multipart@7.7.3`
- **Risco:** CVE-2025-24033 - `saveRequestFiles` não deleta arquivos temporários quando requisição é cancelada, permitindo consumo ilimitado de recursos
- **CVSS:** 7.5 (HIGH)
- **Como explorar:** Atacante pode enviar múltiplas requisições de upload e cancelá-las, acumulando arquivos temporários até esgotar espaço em disco
- **Recomendação:** Upgrade para `@fastify/multipart@8.3.1` ou `9.0.3`
- **Status:** ❌ **NÃO CORRIGIDO** (requer atualização de dependências)

#### 6. Ausência de Rate Limiting
- **Contexto:** Endpoints `/auth/login`, `/customers/login`, `/auth/refresh`, `/customers/register`, `/checkout`, `/webhooks/:provider`
- **Risco:** Endpoints sensíveis não possuem rate limiting, permitindo:
  - **Brute force** em login (tentativas ilimitadas de senha)
  - **DoS** via requisições massivas
  - **Abuse** de webhooks e checkout
- **Como explorar:** Script automatizado pode fazer milhares de requisições por segundo, sobrecarregando o servidor ou tentando descobrir credenciais válidas
- **Recomendação:** Implementar rate limiting usando `@fastify/rate-limit` ou similar:
  - Login: 5 tentativas por IP a cada 15 minutos
  - Checkout: 10 requisições por IP a cada minuto
  - Webhooks: Validar assinatura (já implementado) + rate limit por store
- **Status:** ❌ **NÃO CORRIGIDO** (requer implementação)

#### 7. fast-jwt Vulnerabilidades Múltiplas
- **Contexto:** `apps/api` usando `@fastify/jwt@5.0.1` que depende de `fast-jwt@1.7.2`
- **Riscos:**
  - CVE-2023-48223: JWT Algorithm Confusion (CVSS 5.9)
  - CVE-2025-30144: Improper `iss` claim validation (CVSS 6.5)
- **Como explorar:**
  - Algorithm confusion: Atacante pode forjar tokens JWT usando algoritmo HS256 com chave pública RSA
  - `iss` validation: Tokens com `iss` como array podem bypassar validação de issuer
- **Recomendação:** Upgrade `@fastify/jwt` para versão que use `fast-jwt@>=3.3.2` e `>=5.0.6`
- **Status:** ❌ **NÃO CORRIGIDO** (requer atualização de dependências)

---

### 🟡 MEDIUM

#### 8. Tokens JWT Armazenados em localStorage
- **Contexto:** `apps/web/lib/store/useAuthStore.ts:51` usa `localStorage` para persistir tokens
- **Risco:** localStorage é vulnerável a XSS. Se um atacante conseguir injetar JavaScript malicioso, pode roubar tokens do localStorage.
- **Como explorar:** Se houver vulnerabilidade XSS (ex: `dangerouslySetInnerHTML` sem sanitização), atacante pode executar `localStorage.getItem('auth-storage')` e roubar tokens
- **Recomendação:**
  - **Ideal:** Usar apenas cookies HttpOnly (já implementado para refreshToken)
  - **Alternativa:** Se precisar de localStorage, garantir sanitização rigorosa de todas as entradas e CSP adequado
- **Status:** ⚠️ **PARCIALMENTE MITIGADO** - RefreshToken já está em cookie HttpOnly, mas accessToken ainda em localStorage

#### 9. Uso de dangerouslySetInnerHTML sem Sanitização
- **Contexto:**
  - `apps/web/components/blocks/TextBlock.tsx:29`
  - `apps/web/components/store/hero.tsx:37`
  - `apps/web/components/template/flor-de-menina/components/ui/chart.tsx:70`
- **Risco:** Conteúdo HTML não sanitizado pode conter scripts maliciosos, permitindo XSS
- **Como explorar:** Se conteúdo vier de fonte não confiável (ex: editor de conteúdo), atacante pode injetar `<script>alert('XSS')</script>` ou código mais malicioso
- **Recomendação:**
  - Usar biblioteca de sanitização (ex: `DOMPurify`)
  - Ou usar biblioteca de markdown que sanitiza automaticamente
- **Status:** ❌ **NÃO CORRIGIDO** (requer implementação de sanitização)

#### 10. Console.log em Produção
- **Contexto:** 50+ ocorrências de `console.log/error/warn` em `apps/api/src`
- **Risco:** Logs podem expor informações sensíveis (tokens, senhas, dados de clientes) em produção
- **Como explorar:** Se logs forem expostos (ex: via plataforma de logging), informações sensíveis podem ser acessadas
- **Recomendação:**
  - Usar biblioteca de logging estruturado (ex: `pino`, `winston`)
  - Implementar redaction de dados sensíveis
  - Desabilitar console.log em produção
- **Status:** ❌ **NÃO CORRIGIDO** (requer implementação de logging estruturado)

#### 11. Next.js Server Actions Source Code Exposure
- **Contexto:** Next.js 16.0.3 em todos os apps frontend
- **Risco:** CVE-2025-55183 permite exposição de código fonte de Server Functions
- **CVSS:** 5.3 (MEDIUM)
- **Como explorar:** Requisições HTTP maliciosas podem revelar código compilado de Server Functions, expondo lógica de negócio
- **Recomendação:** Upgrade para Next.js 16.0.9 ou superior
- **Status:** ❌ **NÃO CORRIGIDO** (requer atualização de dependências)

#### 12. Ausência de Security Headers no Next.js
- **Contexto:** `apps/web/next.config.mjs` e `apps/admin/next.config.mjs` não configuram security headers
- **Risco:** Falta de headers de segurança permite:
  - Clickjacking (sem X-Frame-Options)
  - MIME type sniffing (sem X-Content-Type-Options)
  - XSS via CSP inadequado
- **Recomendação:** Adicionar headers de segurança:
  ```javascript
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ]
  }
  ```
- **Status:** ❌ **NÃO CORRIGIDO** (requer configuração)

---

### 🟢 LOW

#### 13. .gitignore Pode Ser Melhorado
- **Contexto:** `.gitignore` não inclui todos os padrões de arquivos sensíveis
- **Risco:** Arquivos sensíveis podem ser commitados acidentalmente
- **Recomendação:** Adicionar padrões para `.pem`, `.p12`, `*.key`, `credentials*.json`, `service-account*.json`
- **Status:** ✅ **CORRIGIDO** - Adicionados padrões adicionais ao `.gitignore`

#### 14. Validação de Webhook Implementada Corretamente
- **Contexto:** `apps/api/src/infra/http/middlewares/validate-webhook-signature.ts`
- **Status:** ✅ **OK** - Validação HMAC implementada com `timingSafeEqual` (proteção contra timing attacks)

#### 15. Cookies Configurados Corretamente
- **Contexto:** Cookies de refreshToken usam `httpOnly: true`, `secure: isProduction`, `sameSite: 'lax'`
- **Status:** ✅ **OK** - Configuração adequada

#### 16. Multi-tenant Isolamento
- **Contexto:** `tenantMiddleware` valida storeId e isola dados por loja
- **Status:** ✅ **OK** - Isolamento implementado corretamente

---

## 🔐 Varredura de Segredos

### O Que Foi Checado

1. **Arquivos sensíveis no repositório:**
   - `.env*` files
   - `*.pem`, `*.p12`, `*.key`
   - `id_rsa`, `credentials*.json`, `service-account*.json`

2. **Padrões de segredos em código:**
   - `API_KEY`, `SECRET`, `TOKEN`, `BEARER`, `PRIVATE_KEY`, `CLIENT_SECRET`
   - `JWT`, `PASSWORD`, `DATABASE_URL`, `POSTGRES`, `REDIS`
   - `R2`, `S3`, `CLOUDFLARE`, `STRIPE`, `TWILIO`, `MAIL`

3. **Histórico do Git:**
   - ⚠️ **NÃO VERIFICADO** (requer ferramentas especializadas como `git-secrets` ou `truffleHog`)

### Resultados

- ✅ **Nenhum arquivo `.env` encontrado no repositório** (corretamente ignorado)
- ✅ **Nenhum arquivo de chave privada encontrado** (`.pem`, `.p12`, `id_rsa`)
- ✅ **Nenhum arquivo de credenciais encontrado** (`credentials*.json`, `service-account*.json`)
- ⚠️ **Segredo hardcoded encontrado:** `COOKIE_SECRET` com fallback inseguro (CORRIGIDO)
- ✅ **Todas as referências a segredos usam `process.env`** (correto)

### Arquivos Suspeitos Encontrados

Nenhum arquivo com segredos reais foi encontrado. Todas as referências a segredos são através de variáveis de ambiente, o que é o comportamento esperado.

---

## 📦 Dependências

### Output do `pnpm audit`

```json
{
  "metadata": {
    "vulnerabilities": {
      "info": 0,
      "low": 0,
      "moderate": 3,
      "high": 2,
      "critical": 1
    },
    "dependencies": 808,
    "totalDependencies": 808
  }
}
```

### Vulnerabilidades Encontradas

#### CRITICAL (1)
- **Next.js 16.0.3** → CVE-2025-55182 (RCE) - Upgrade para 16.0.7+

#### HIGH (2)
- **@fastify/multipart 7.7.3** → CVE-2025-24033 (DoS) - Upgrade para 8.3.1+ ou 9.0.3+
- **Next.js 16.0.3** → CVE-2025-55184 (DoS) - Upgrade para 16.0.9+

#### MODERATE (3)
- **fast-jwt 1.7.2** → CVE-2023-48223 (Algorithm Confusion) - Upgrade para 3.3.2+
- **fast-jwt 1.7.2** → CVE-2025-30144 (iss validation) - Upgrade para 5.0.6+
- **Next.js 16.0.3** → CVE-2025-55183 (Source Code Exposure) - Upgrade para 16.0.9+

### Upgrades Sugeridos

#### Prioridade CRITICAL (Imediato)
```bash
# Next.js - CRITICAL RCE
cd apps/admin && pnpm add next@16.0.9
cd apps/web && pnpm add next@16.0.9
cd apps/pdv && pnpm add next@16.0.9
```

#### Prioridade HIGH (Esta semana)
```bash
# @fastify/multipart - DoS
cd apps/api && pnpm add @fastify/multipart@9.0.3

# @fastify/jwt - JWT vulnerabilities
cd apps/api && pnpm add @fastify/jwt@latest
# Verificar se atualiza fast-jwt para versão segura
```

#### Prioridade MEDIUM (Próximo mês)
- Revisar outras dependências desatualizadas
- Considerar dependabot/renovate para atualizações automáticas

---

## 🔧 Mudanças Aplicadas

### Arquivos Alterados

1. **`apps/api/src/server.ts`**
   - ✅ Removido fallback inseguro de `COOKIE_SECRET`
   - ✅ Adicionada validação obrigatória de `COOKIE_SECRET`
   - ✅ CORS agora requer `CORS_ORIGINS` em produção (lista separada por vírgula)
   - ✅ Em desenvolvimento, CORS continua permissivo para não quebrar DX

2. **`.gitignore`**
   - ✅ Adicionados padrões para arquivos sensíveis:
     - `*.pem`, `*.p12`, `*.key`
     - `id_rsa`, `id_rsa.pub`
     - `credentials*.json`, `service-account*.json`
     - `*.env.*` (exceto `.env.example`)

3. **`SECURITY_AUDIT_REPORT.md`**
   - ✅ Relatório completo de auditoria de segurança

### O Que Mudou e Por Quê

#### 1. COOKIE_SECRET Obrigatório
**Antes:**
```typescript
secret: process.env.COOKIE_SECRET || 'cookie-secret-change-me'
```

**Depois:**
```typescript
const cookieSecret = process.env.COOKIE_SECRET
if (!cookieSecret) {
  throw new Error('COOKIE_SECRET environment variable is required...')
}
```

**Por quê:** Fallback inseguro permitia que sistema funcionasse sem segredo adequado, permitindo forjamento de cookies.

#### 2. CORS Restritivo em Produção
**Antes:**
```typescript
origin: true  // Permite qualquer origem
```

**Depois:**
```typescript
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : process.env.NODE_ENV === 'production'
  ? []
  : true // Apenas em desenvolvimento
```

**Por quê:** CORS permissivo permite que sites maliciosos façam requisições autenticadas à API.

### Riscos de Regressão

- ⚠️ **COOKIE_SECRET:** Se `.env` não tiver `COOKIE_SECRET`, aplicação não iniciará. **Ação necessária:** Adicionar `COOKIE_SECRET` ao `.env` de todos os ambientes. Gerar com: `openssl rand -hex 32`
- ⚠️ **CORS_ORIGINS:** Em produção, se `CORS_ORIGINS` não estiver definido, nenhuma origem será permitida (array vazio). **Ação necessária:** Configurar `CORS_ORIGINS` com lista de origens permitidas separadas por vírgula (ex: `https://app.example.com,https://admin.example.com`). Em desenvolvimento, se não definido, continua permissivo (`origin: true`) para não quebrar DX.

---

## 📋 Plano de Hardening (Próximos Passos)

### 🚀 Quick Wins (1 dia)

1. **Upgrade Next.js CRITICAL** ⚠️ **URGENTE**
   ```bash
   # Atualizar Next.js em todos os apps para 16.0.9+
   cd apps/admin && pnpm add next@16.0.9
   cd apps/web && pnpm add next@16.0.9
   cd apps/pdv && pnpm add next@16.0.9
   ```

2. **Configurar Security Headers no Next.js**
   - Adicionar `headers()` em `next.config.mjs` de todos os apps
   - Implementar CSP básico (incrementar gradualmente)

3. **Adicionar Variáveis de Ambiente Obrigatórias**
   - Documentar `COOKIE_SECRET` e `CORS_ORIGINS` no README
   - Criar `.env.example` com todas as variáveis necessárias

### 📅 Médio Prazo (1 semana)

4. **Implementar Rate Limiting**
   - Instalar `@fastify/rate-limit`
   - Aplicar em endpoints sensíveis:
     - `/auth/login`: 5 tentativas/15min por IP
     - `/customers/login`: 5 tentativas/15min por IP
     - `/checkout`: 10 requisições/min por IP
     - `/auth/refresh`: 20 requisições/min por IP

5. **Upgrade Dependências Vulneráveis**
   - `@fastify/multipart@9.0.3`
   - `@fastify/jwt@latest` (verificar compatibilidade)

6. **Sanitização de HTML**
   - Instalar `DOMPurify`
   - Aplicar em todos os usos de `dangerouslySetInnerHTML`
   - Criar wrapper `SafeHTML` component

7. **Logging Estruturado**
   - Substituir `console.log` por `pino` ou `winston`
   - Implementar redaction de dados sensíveis
   - Configurar níveis de log por ambiente

### 🎯 Longo Prazo (1 mês)

8. **Migrar Tokens para Cookies HttpOnly**
   - Remover `accessToken` de `localStorage`
   - Armazenar `accessToken` em cookie HttpOnly (curta duração)
   - Manter `refreshToken` em cookie HttpOnly (já implementado)

9. **Implementar Content Security Policy (CSP)**
   - Começar com CSP report-only
   - Ajustar gradualmente até CSP restritivo
   - Monitorar violações

10. **Auditoria de Segurança Automatizada**
    - Configurar `dependabot` ou `renovate` para atualizações automáticas
    - Integrar `npm audit` no CI/CD
    - Configurar `git-secrets` para prevenir commit de segredos

11. **Testes de Segurança**
    - Adicionar testes de rate limiting
    - Testes de validação de entrada (SQL injection, XSS)
    - Testes de autorização (multi-tenant isolation)

12. **Monitoramento e Alertas**
    - Configurar alertas para tentativas de brute force
    - Monitorar logs de segurança
    - Dashboard de métricas de segurança

---

## ✅ Critérios de Aceite

- ✅ **Nenhum commit realizado** - Branch criada, mudanças prontas para review
- ✅ **Branch criada corretamente** - `chore/security-audit-scan`
- ✅ **Relatório gerado e completo** - Este documento
- ✅ **Segredos identificados** - COOKIE_SECRET marcado como CRITICAL e corrigido
- ✅ **Mudanças mínimas e documentadas** - Apenas 3 arquivos alterados com justificativa (`.gitignore`, `apps/api/src/server.ts`, `SECURITY_AUDIT_REPORT.md`)

---

## 📝 Observações Finais

### Pontos Positivos

1. ✅ Arquitetura limpa facilita segurança (separação de camadas)
2. ✅ Multi-tenant isolation implementado corretamente
3. ✅ Validação de webhook com HMAC e timing-safe comparison
4. ✅ Cookies configurados corretamente (HttpOnly, Secure, SameSite)
5. ✅ Validação de entrada usando Zod
6. ✅ Nenhum segredo real encontrado no código

### Pontos de Atenção

1. ⚠️ **URGENTE:** Upgrade Next.js para corrigir RCE crítico
2. ⚠️ **URGENTE:** Configurar `COOKIE_SECRET` e `CORS_ORIGINS` em todos os ambientes
3. ⚠️ Implementar rate limiting antes de produção
4. ⚠️ Sanitizar HTML antes de usar `dangerouslySetInnerHTML`

### Recomendações Adicionais

1. **Documentação de Segurança:** Criar `docs/SECURITY.md` com:
   - Política de segurança
   - Processo de reportar vulnerabilidades
   - Checklist de segurança para PRs

2. **Code Review:** Adicionar checklist de segurança no processo de review:
   - [ ] Nenhum segredo hardcoded
   - [ ] Validação de entrada implementada
   - [ ] Rate limiting em endpoints sensíveis
   - [ ] Sanitização de HTML/inputs

3. **Treinamento:** Educar time sobre:
   - OWASP Top 10
   - Boas práticas de segurança
   - Como identificar vulnerabilidades

---

**Fim do Relatório**

