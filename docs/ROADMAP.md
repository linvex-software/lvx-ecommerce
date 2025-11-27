# 🗺️ Roadmap de Desenvolvimento - White Label E-commerce

Este documento organiza as features do projeto em ordem cronológica de desenvolvimento, considerando dependências e evolução natural do sistema.

---

## 📋 Fase 1: Fundação e Navegação Base

### 1. [SEO] Metadados + Sitemap/Robots (#21)
**Prioridade: ALTA**  
**Dependências: Nenhuma**

**Checklist:**
- [ ] Configurar metadados básicos
- [ ] Criar `sitemap.xml`
- [ ] Criar `robots.txt`
- [ ] Adicionar Open Graph básico

**Justificativa:** Base para SEO e indexação. Não depende de outras features e deve ser implementado desde o início.

---

### 2. [FEATURE] Filtros Página Home (#32)
**Prioridade: ALTA**  
**Dependências: Nenhuma**

**Checklist:**
- [ ] Implementar filtros na página home
- [ ] Organizar e categorizar produtos
- [ ] Melhorar navegação

**Justificativa:** Feature fundamental de navegação e descoberta de produtos. Deve ser implementada cedo para melhorar a experiência do usuário desde o início.

---

## 📦 Fase 2: Sistema de Frete (Base para Vendas)

### 3. [FEATURE] Sistema de Frete (#24)
**Prioridade: ALTA**  
**Dependências: Nenhuma (infraestrutura base)**

**Checklist:**
- [ ] Integração Correios
- [ ] Integração Loggi
- [ ] Tabela `shipping_quotes`
- [ ] Tabela `shipping_labels`
- [ ] Regras de frete grátis
- [ ] API de cálculo de frete

**Justificativa:** **DEVE VIR ANTES** da API de Pedidos Online, pois o sistema de pedidos precisa calcular frete. É a infraestrutura base para vendas online.

---

## 🛒 Fase 3: Sistema de Pedidos e Checkout

### 4. [FEATURE] API Pedidos Online (#22)
**Prioridade: ALTA**  
**Dependências: Sistema de Frete (#24)**

**Checklist:**
- [ ] Endpoint criar pedido (checkout)
- [ ] Salvar itens do pedido (pode ser JSON ou tabela separada)
- [ ] Gerar movimento de estoque de saída (origin=venda_online)
- [ ] Atualizar status (criado, pago, cancelado)
- [ ] Endpoint listar pedidos para o admin
- [ ] Tabela `shipping_addresses`
- [ ] Integração com sistema de frete (usar API de cálculo)
- [ ] Tracking code

**Justificativa:** Base fundamental para o sistema de vendas online. **Depende do sistema de frete** estar pronto para calcular valores durante a criação do pedido.

---

### 5. [FEATURE] Frete no Carrinho e Checkout
**Prioridade: ALTA**  
**Dependências: Sistema de Frete (#24), API Pedidos Online (#22)**

**Checklist:**
- [ ] Calcula CEP ao digitar
- [ ] Loading states
- [ ] Simulador de frete na PDP
- [ ] Integração com API de cálculo de frete

**Justificativa:** Melhora a experiência do usuário no fluxo de compra. Depende do sistema de frete e da estrutura de pedidos estarem funcionando.

---

### 6. [FEATURE] Gestão de Etiquetas de Frete
**Prioridade: MÉDIA**  
**Dependências: Sistema de Frete (#24), API Pedidos Online (#22)**

**Checklist:**
- [ ] Exibir etiqueta
- [ ] Botão baixar PDF
- [ ] Código de rastreio
- [ ] Integração com MelhorEnvio / Correios para geração

**Justificativa:** Funcionalidade administrativa importante, mas pode ser desenvolvida após o fluxo básico de frete e pedidos estarem funcionando.

---

## 🏪 Fase 4: Vendas Físicas e PDV

### 7. [FEATURE] API Vendas Físicas (com ID do vendedor) (#23)
**Prioridade: ALTA**  
**Dependências: Nenhuma (pode ser desenvolvida em paralelo com Fase 3)**

**Checklist:**
- [ ] Endpoint POST `/physical-sales`
- [ ] Receber `product_id`, `quantity`, `total`, `user_id` (do token)
- [ ] Criar registro em `physical_sales` com `user_id_vendedor`
- [ ] Criar movimento de estoque (saída, origin=venda_fisica)
- [ ] Retornar dados da venda para exibir no PDV

**Consultas:**
- [ ] Endpoint listar vendas físicas por período
- [ ] Filtro por vendedor (`user_id`)
- [ ] Agrupar por produto para relatório simples

**Justificativa:** Base para o sistema de PDV. Pode ser desenvolvida em paralelo com pedidos online, mas deve vir antes do PDV UI.

---

### 8. [FEATURE] PDV Lite UI (venda física) (#16)
**Prioridade: ALTA**  
**Dependências: API Vendas Físicas (#23)**

**Checklist:**
- [ ] Rota `/pdv` protegida (role=funcionário)
- [ ] Campo de busca de produto por nome/SKU
- [ ] Mostrar estoque atual do produto
- [ ] Campo de quantidade
- [ ] Botão 'Registrar venda' chamando API física
- [ ] Exibir confirmação de venda com ID do vendedor

**Justificativa:** Interface para uso da API de vendas físicas. Depende da API estar pronta.

---

### 9. [FEATURE] Painel de Vendas Físicas (#20)
**Prioridade: MÉDIA**  
**Dependências: API Vendas Físicas (#23)**

**Checklist:**
- [ ] Formulário rápido
- [ ] Tabela histórica
- [ ] Filtro por vendedor

**Justificativa:** Dashboard administrativo. Depende da API de vendas físicas estar funcionando.

---

## 🎨 Fase 5: Melhorias de UX e Funcionalidades Avançadas

### 10. [FEATURE] Carrinho Inteligente
**Prioridade: MÉDIA**  
**Dependências: API Pedidos Online (#22)**

**Checklist:**
- [ ] Carrinho salvo (persistência no backend)
- [ ] Animações e transições suaves
- [ ] Sincronização com backend
- [ ] Recuperação de carrinho abandonado

**Justificativa:** Melhora significativamente a experiência do usuário. Pode ser desenvolvido após o fluxo principal de checkout estar estável.

---

### 11. [FEATURE] Cupons (#19)
**Prioridade: MÉDIA**  
**Dependências: API Pedidos Online (#22), Carrinho Inteligente (recomendado)**

**Checklist:**
- [ ] Campo no carrinho
- [ ] Validação visual
- [ ] Exibir economia total
- [ ] Integração com API de pedidos para aplicar desconto

**Justificativa:** Funcionalidade adicional que melhora conversão. Funciona melhor com carrinho inteligente, mas pode ser implementada independentemente.

---

### 12. [FEATURE] Provador Virtual (#25)
**Prioridade: BAIXA**  
**Dependências: Nenhuma (feature independente)**

**Checklist:**
- [ ] Tabela `measurements` do usuário
- [ ] Tabela de medidas do produto
- [ ] Algoritmo de recomendação
- [ ] Integração na PDP

**Justificativa:** Feature avançada e diferenciada. Pode ser desenvolvida em paralelo ou após as features críticas estarem prontas.

---

## 📊 Resumo por Fase

### Fase 1: Fundação e Navegação Base (2 features)
- SEO e Metadados (#21)
- Filtros Página Home (#32)

### Fase 2: Sistema de Frete (1 feature)
- Sistema de Frete (#24) - **Base para vendas online**

### Fase 3: Sistema de Pedidos e Checkout (3 features)
- API Pedidos Online (#22)
- Frete no Carrinho e Checkout
- Gestão de Etiquetas de Frete

### Fase 4: Vendas Físicas e PDV (3 features)
- API Vendas Físicas (#23)
- PDV Lite UI (#16)
- Painel de Vendas Físicas (#20)

### Fase 5: Melhorias de UX (3 features)
- Carrinho Inteligente
- Cupons (#19)
- Provador Virtual (#25)

---

## 🔄 Dependências Visuais

```
FASE 1: Fundação
├─ SEO (#21)
│  └─ (sem dependências)
└─ Filtros Página Home (#32)
   └─ (sem dependências)

FASE 2: Sistema de Frete (BASE)
└─ Sistema de Frete (#24)
   └─ (sem dependências - infraestrutura base)

FASE 3: Pedidos e Checkout
├─ API Pedidos Online (#22)
│  └─ Sistema de Frete (#24) ⚠️ DEPENDE
├─ Frete no Carrinho e Checkout
│  ├─ Sistema de Frete (#24)
│  └─ API Pedidos Online (#22)
└─ Gestão de Etiquetas de Frete
   ├─ Sistema de Frete (#24)
   └─ API Pedidos Online (#22)

FASE 4: Vendas Físicas (paralelo à Fase 3)
├─ API Vendas Físicas (#23)
│  └─ (sem dependências - pode ser paralelo)
├─ PDV Lite UI (#16)
│  └─ API Vendas Físicas (#23)
└─ Painel de Vendas Físicas (#20)
   └─ API Vendas Físicas (#23)

FASE 5: Melhorias de UX
├─ Carrinho Inteligente
│  └─ API Pedidos Online (#22)
├─ Cupons (#19)
│  ├─ API Pedidos Online (#22)
│  └─ Carrinho Inteligente (recomendado)
└─ Provador Virtual (#25)
   └─ (sem dependências - feature independente)
```

---

## 📝 Notas de Implementação

### ⚠️ Ordem Crítica (NÃO inverter)

1. **Sistema de Frete (#24) DEVE vir ANTES da API Pedidos Online (#22)**
   - A API de Pedidos precisa calcular frete durante a criação do pedido
   - O sistema de frete é a infraestrutura base

2. **API Pedidos Online (#22) DEVE vir ANTES de Frete no Carrinho**
   - O frontend precisa da API de pedidos para processar o checkout
   - O cálculo de frete no carrinho depende da estrutura de pedidos

### ✅ Features que podem ser desenvolvidas em paralelo

1. **Fase 1 (paralelo):**
   - SEO (#21) + Filtros (#32)

2. **Fase 3 e 4 (paralelo):**
   - API Pedidos Online (#22) + API Vendas Físicas (#23)
   - Frete no Carrinho + PDV Lite UI (#16)

3. **Fase 5 (paralelo):**
   - Carrinho Inteligente + Cupons (#19)
   - Provador Virtual (#25) (independente)

### 🎯 Features críticas para MVP

**Ordem obrigatória:**
1. SEO (#21) + Filtros (#32) - Navegação básica
2. Sistema de Frete (#24) - **Base obrigatória**
3. API Pedidos Online (#22) - Core do e-commerce
4. Frete no Carrinho e Checkout - UX essencial
5. API Vendas Físicas (#23) - Se PDV for necessário no MVP
6. PDV Lite UI (#16) - Se PDV for necessário no MVP

### 📈 Features pós-MVP (melhorias)

- Gestão de Etiquetas de Frete
- Painel de Vendas Físicas (#20)
- Carrinho Inteligente
- Cupons (#19)
- Provador Virtual (#25)

---

**Última atualização:** 2024
**Mantido por:** Equipe de Desenvolvimento

