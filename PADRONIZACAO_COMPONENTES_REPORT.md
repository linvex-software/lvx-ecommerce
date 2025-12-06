# Relatório de Padronização de Componentes Store

**Data:** 2025-12-03  
**Status:** Em Progresso

## 📊 Resumo do Scan Automático

### Estatísticas Gerais
- **Total de componentes:** 32 (16 pares admin/web)
- **Com textColor:** 30 (94%)
- **Com backgroundColor:** 24 (75%)
- **Usando cores do tema:** 14 (44%)
- **Com conflitos CSS:** 2

### Componentes que Precisam de Atenção

#### ❌ Críticos (sem textColor/backgroundColor)
1. **Hero** (admin/web) - Falta textColor e backgroundColor
2. **Categories** (admin/web) - Falta backgroundColor

#### ⚠️ Problemas Identificados
1. **BentoGrid** - `bg-white` hardcoded sobrescreve backgroundColor ✅ **CORRIGIDO**
2. Múltiplos componentes usam classes hardcoded que podem conflitar
3. Muitos componentes não usam cores do tema por padrão
4. Alguns componentes usam `ALLOWED_COLORS` restritivo ao invés de aceitar qualquer cor

## ✅ Implementações Concluídas

### 1. Sistema de Configuração Padronizado
- ✅ Componentes reutilizáveis criados:
  - `ColorField` - Seletor de cores com suporte a tema
  - `TypographyField` - Configuração completa de tipografia
  - `SpacingField` - Padding/margin uniforme ou individual
  - `ImageField` - Upload e configurações de imagem
  - `TextField` - Campos de texto melhorados
- ✅ Utilitários para aplicar estilos (`utils.ts`)
- ✅ Tipos TypeScript padronizados (`types.ts`)

### 2. Wrapper Component
- ✅ `ComponentWrapper` criado (admin e web)
- ✅ Aplica estilos com prioridade correta:
  1. Inline styles (props custom)
  2. CSS variables do tema
  3. Theme defaults
- ✅ Suporte a responsividade por breakpoint
- ✅ CSS variables para propagar aos filhos

### 3. Correções Aplicadas
- ✅ **BentoGrid** - Removido `bg-white` hardcoded, aplicado backgroundColor via inline style
- ✅ **Banner** - Atualizado para usar sistema padronizado
- ✅ **HeroBanner** - Campos de texto melhorados com TextField

### 4. CSS Variables
- ✅ Adicionado `--store-background-color` ao globals.css

## 🔄 Em Progresso

### 1. Padronização de API
Todos os componentes devem expor:
```typescript
interface StandardComponentProps {
  textColor?: string | ColorConfig | ResponsiveColor
  backgroundColor?: string | ColorConfig | ResponsiveColor
  useThemeTextColor?: boolean
  useThemeBackgroundColor?: boolean
}
```

**Status:** Parcialmente implementado
- Banner: ✅ Completo
- BentoGrid: ⚠️ Precisa adicionar textColor e useTheme*
- Outros: Pendente

### 2. Editor Craft.js
- ✅ Componentes de configuração criados
- ⚠️ Precisa atualizar todos os Settings para usar componentes padronizados
- ⚠️ Adicionar controles de "usar cor do tema"

## 📋 Próximos Passos

### Prioridade Alta
1. ✅ Corrigir BentoGrid (CONCLUÍDO)
2. Adicionar textColor e useTheme* ao BentoGrid
3. Atualizar Hero para ter textColor/backgroundColor
4. Atualizar Categories para ter backgroundColor
5. Padronizar todos os componentes para usar a nova API

### Prioridade Média
1. Atualizar todos os Settings do editor para usar componentes padronizados
2. Adicionar suporte a responsividade por breakpoint em todos
3. Remover `ALLOWED_COLORS` restritivos
4. Garantir que todos usem cores do tema por padrão quando não especificado

### Prioridade Baixa
1. Criar testes automatizados
2. Adicionar Storybook snapshots
3. Script de migração para layouts existentes

## 🔧 Como a Correção do BentoGrid Funcionou

### Problema Anterior
O BentoGrid tinha `bg-white` hardcoded na classe do elemento `<section>`, o que sobrescrevia qualquer `backgroundColor` passado via props, mesmo quando aplicado via inline style. Isso acontecia porque:

1. A classe `bg-white` do Tailwind tem especificidade que pode conflitar
2. O backgroundColor estava sendo aplicado apenas nos cards internos, não no wrapper principal
3. Não havia CSS variables para propagar a cor aos filhos

### Solução Aplicada
1. **Removido `bg-white` hardcoded** - Elimina conflito de especificidade
2. **Aplicado backgroundColor via inline style** - Maior prioridade que classes
3. **Adicionado CSS variable `--component-background-color`** - Permite que filhos consumam a cor
4. **Mantida compatibilidade** - Props antigas ainda funcionam

### Código Antes:
```tsx
<section className="bg-white rounded-3xl ...">
```

### Código Depois:
```tsx
<section 
  className="rounded-3xl ..."
  style={{
    backgroundColor: safeBackgroundColor,
    '--component-background-color': safeBackgroundColor
  }}
>
```

## 📝 Notas Técnicas

### Precedência de Estilos (ordem de aplicação)
1. **Inline styles** (maior prioridade) - `style={{ color: '...' }}`
2. **CSS Variables** - `var(--component-text-color)`
3. **Classes CSS específicas** - `.component-wrapper .text`
4. **Theme defaults** - `var(--store-text-color)`
5. **Classes Tailwind** - `text-black` (menor prioridade, apenas fallback)

### Evitando !important
- Usar inline styles ao invés de !important
- CSS variables para propagação aos filhos
- Wrapper component para encapsular estilos

### Responsividade
- Props podem aceitar objetos: `{ mobile: '#fff', desktop: '#000' }`
- CSS variables são aplicadas no wrapper
- Media queries podem sobrescrever via CSS se necessário

## 🧪 Testes Necessários

### Testes Manuais
1. Abrir editor com store_id específico
2. Alterar backgroundColor do BentoGrid
3. Verificar que cor é aplicada no wrapper principal
4. Verificar que cards internos herdam a cor (se aplicável)
5. Testar com useThemeBackgroundColor = true
6. Verificar que funciona na página pública

### Testes Automatizados (Futuro)
- Cypress/Playwright E2E tests
- Storybook snapshots
- Unit tests para ComponentWrapper

## 📚 Referências

- Relatório completo: `COMPONENT_SCAN_REPORT.md`
- Script de scan: `scripts/scan-store-components.ts`
- Componentes de configuração: `apps/admin/components/editor/settings/`
- Wrapper component: `apps/admin/components/editor/settings/component-wrapper.tsx`




