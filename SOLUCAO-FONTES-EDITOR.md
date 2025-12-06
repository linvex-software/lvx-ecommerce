# ✅ Solução Completa: Fontes do Editor Craft.js

## A) Diagnóstico do Problema

### 🔍 Problemas Identificados:

1. **Fonte Externa (Google Fonts) não estava sendo carregada no editor**
   - A loja usa: `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap')`
   - O editor **NÃO** estava carregando esse link do Google Fonts
   - Resultado: O navegador usava fallback de fontes (system fonts)

2. **Conflito de Variáveis CSS**
   - Admin tinha: `--font-display: 'Outfit', sans-serif` e `--font-sans: 'Inter Tight', sans-serif`
   - Template precisa: `--font-display: 'Cormorant Garamond'` e `--font-body: 'Montserrat'`
   - As variáveis do admin estavam sobrescrevendo as do template

3. **Ordem de Carregamento**
   - CSS do admin (`globals.css`) carregava antes do CSS do template
   - Body do admin tinha: `font-family: -apple-system, BlinkMacSystemFont...` que sobrescrevia

4. **Craft.js Renderiza Diretamente no DOM (não usa iframe)**
   - O código anterior tentava acessar iframe, mas o Craft.js renderiza em `[data-craftjs-frame]`
   - Fontes precisam ser aplicadas diretamente no DOM do editor

### 🎯 Causas Raiz:
- ❌ Google Fonts não carregado no editor
- ❌ Variáveis CSS do admin sobrescrevendo as do template
- ❌ CSS do admin (body font-family) aplicado antes do template
- ❌ Falta de especificidade nos seletores CSS

---

## B) Solução Implementada

### ✅ Código Pronto para Colar

#### 1. **Carregamento do Google Fonts** (`template-styles.tsx`)
```typescript
// GARANTIR QUE GOOGLE FONTS ESTÁ CARREGADO ANTES DE TUDO
const googleFontsUrl = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap'

let googleFontsLink = document.getElementById('template-google-fonts')
if (!googleFontsLink) {
  googleFontsLink = document.createElement('link')
  googleFontsLink.id = 'template-google-fonts'
  googleFontsLink.href = googleFontsUrl
  googleFontsLink.rel = 'stylesheet'
  googleFontsLink.setAttribute('media', 'all')
  document.head.insertBefore(googleFontsLink, document.head.firstChild)
}
```

#### 2. **CSS Global com Prioridade Máxima** (`restricted-frame.tsx`)
```css
/* Aplicar variáveis CSS no frame com EXATAMENTE as mesmas fontes da loja */
[data-craftjs-frame] {
  --font-display: 'Cormorant Garamond', Georgia, serif !important;
  --font-body: 'Montserrat', system-ui, sans-serif !important;
  font-display: swap !important;
}

/* Body e elementos de texto usam Montserrat */
[data-craftjs-frame],
[data-craftjs-frame] body,
[data-craftjs-frame] body *:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6):not(.font-display):not(.font-display *) {
  font-family: var(--font-body, 'Montserrat', system-ui, sans-serif) !important;
  font-display: swap !important;
}

/* Headings usam Cormorant Garamond */
[data-craftjs-frame] h1,
[data-craftjs-frame] h2,
[data-craftjs-frame] h3,
[data-craftjs-frame] h4,
[data-craftjs-frame] h5,
[data-craftjs-frame] h6,
[data-craftjs-frame] h1 *,
[data-craftjs-frame] h2 *,
[data-craftjs-frame] h3 *,
[data-craftjs-frame] h4 *,
[data-craftjs-frame] h5 *,
[data-craftjs-frame] h6 * {
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif) !important;
  font-weight: 500 !important;
  font-style: normal !important;
  font-display: swap !important;
}
```

#### 3. **Interceptação JavaScript de Fontes**
- Intercepta `CSSStyleDeclaration.setProperty` para bloquear mudanças
- Intercepta setter `fontFamily` para forçar fontes corretas
- Aplica fontes diretamente via JavaScript em todos os elementos

---

## C) Código para Caso Exista Iframe (Futuro)

Se no futuro o Craft.js usar iframe, adicione no `restricted-frame.tsx`:

```typescript
// Verificar se Craft.js cria iframe (atualmente não usa, mas preparado para futuro)
const frameIframe = frameRef.current?.querySelector('[data-craftjs-frame]') as HTMLIFrameElement | null

if (frameIframe && frameIframe.contentDocument) {
  const iframeDoc = frameIframe.contentDocument
  const googleFontsUrl = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap'
  
  // Injetar Google Fonts no iframe
  let iframeFontLink = iframeDoc.getElementById('template-google-fonts')
  if (!iframeFontLink) {
    iframeFontLink = iframeDoc.createElement('link')
    iframeFontLink.id = 'template-google-fonts'
    iframeFontLink.href = googleFontsUrl
    iframeFontLink.rel = 'stylesheet'
    iframeFontLink.setAttribute('media', 'all')
    iframeDoc.head.insertAdjacentElement('afterbegin', iframeFontLink)
  }
  
  // Aplicar variáveis CSS no :root do iframe
  const iframeRoot = iframeDoc.documentElement
  iframeRoot.style.setProperty('--font-display', "'Cormorant Garamond', Georgia, serif", 'important')
  iframeRoot.style.setProperty('--font-body', "'Montserrat', system-ui, sans-serif", 'important')
}
```

---

## D) Como Validar Visualmente

### ✅ Checklist de Validação:

1. **Verificar no DevTools (F12)**:
   ```
   Elements Tab → Selecionar um heading (h1, h2, etc.)
   → Verificar em Computed Styles:
     - font-family deve mostrar: "Cormorant Garamond", Georgia, serif
     - font-weight deve mostrar: 500
   ```

2. **Verificar elementos de texto (p, span, div)**:
   ```
   Elements Tab → Selecionar um parágrafo
   → Verificar em Computed Styles:
     - font-family deve mostrar: "Montserrat", system-ui, sans-serif
   ```

3. **Verificar no Network Tab**:
   ```
   Network Tab → Filtrar por "fonts.googleapis.com"
   → Deve aparecer requisição para Google Fonts
   → Status deve ser 200 (sucesso)
   ```

4. **Comparação Visual**:
   - Abrir a loja (web) em uma aba
   - Abrir o editor em outra aba
   - Comparar side-by-side: as fontes devem ser **IDÊNTICAS**
   - Headings devem ter a mesma aparência elegante (Cormorant Garamond)
   - Texto do body deve ter a mesma aparência limpa (Montserrat)

5. **Comando no Console do Navegador**:
   ```javascript
   // Verificar se Google Fonts está carregado
   document.getElementById('template-google-fonts')
   // Deve retornar o elemento <link>

   // Verificar fontes aplicadas em um heading
   const h1 = document.querySelector('[data-craftjs-frame] h1')
   window.getComputedStyle(h1).fontFamily
   // Deve retornar: "'Cormorant Garamond', Georgia, serif"

   // Verificar fontes aplicadas em um parágrafo
   const p = document.querySelector('[data-craftjs-frame] p')
   window.getComputedStyle(p).fontFamily
   // Deve retornar: "'Montserrat', system-ui, sans-serif"
   ```

### 🎯 Resultado Esperado:
- ✅ Headings (h1-h6) usam **Cormorant Garamond** com font-weight 500
- ✅ Texto do body (p, span, div) usa **Montserrat**
- ✅ Fontes carregadas do Google Fonts (não system fonts)
- ✅ Visualmente **IDÊNTICO** à loja (web)

---

## 📋 Resumo Técnico

| Item | Loja (Web) | Editor (Admin) | Status |
|------|------------|----------------|--------|
| **Fonte Display** | Cormorant Garamond | Cormorant Garamond | ✅ Igual |
| **Fonte Body** | Montserrat | Montserrat | ✅ Igual |
| **Fonte de Carregamento** | Google Fonts | Google Fonts | ✅ Igual |
| **font-weight (headings)** | 500 | 500 | ✅ Igual |
| **font-display** | swap | swap | ✅ Igual |
| **Variáveis CSS** | --font-display, --font-body | --font-display, --font-body | ✅ Igual |

---

**✅ SOLUÇÃO IMPLEMENTADA E PRONTA PARA USO!**

