/**
 * Carregador de Estilos de Template
 * 
 * Gerencia o carregamento de estilos CSS, fontes e variáveis CSS para templates
 * Garante isolamento completo no iframe do preview
 */

export interface TemplateStylesConfig {
  templateId: string
  cssPath: string
  fonts: string[]
  cssVariables: Record<string, string>
}

/**
 * Obtém a configuração de estilos para um template
 */
export function getTemplateStylesConfig(templateId: string): TemplateStylesConfig {
  // Mapear templates para suas configurações de estilo
  const templateConfigs: Record<string, TemplateStylesConfig> = {
    'flor-de-menina': {
      templateId: 'flor-de-menina',
      cssPath: '/templates/flor-de-menina/styles.css',
      fonts: [
        'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap'
      ],
      cssVariables: {
        '--background': '0 0% 100%',
        '--foreground': '0 0% 12%',
        '--card': '30 25% 98%',
        '--card-foreground': '0 0% 12%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '0 0% 12%',
        '--primary': '350 70% 35%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '30 30% 95%',
        '--secondary-foreground': '0 0% 20%',
        '--muted': '30 15% 92%',
        '--muted-foreground': '0 0% 45%',
        '--accent': '42 65% 55%',
        '--accent-foreground': '0 0% 100%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '210 40% 98%',
        '--border': '30 20% 88%',
        '--input': '30 20% 88%',
        '--ring': '350 70% 35%',
        '--radius': '0.25rem',
        '--gold': '42 65% 55%',
        '--gold-light': '42 50% 75%',
        '--wine': '350 70% 35%',
        '--wine-dark': '350 75% 25%',
        '--wine-light': '350 60% 45%',
        '--cream': '30 30% 97%',
        '--beige': '30 25% 92%',
        '--charcoal': '0 0% 20%',
        '--shadow-soft': '0 4px 20px -4px hsl(0 0% 0% / 0.08)',
        '--shadow-elevated': '0 8px 30px -8px hsl(0 0% 0% / 0.12)',
        '--shadow-gold': '0 4px 20px -4px hsl(42 65% 55% / 0.3)',
        '--font-display': "'Cormorant Garamond', Georgia, serif",
        '--font-body': "'Montserrat', system-ui, sans-serif",
        '--font-sans': "'Montserrat', system-ui, sans-serif"
      }
    }
  }

  const config = templateConfigs[templateId]
  
  if (!config) {
    console.warn(`[template-styles-loader] Template ${templateId} não encontrado, usando padrão`)
    // Retornar configuração padrão (flor-de-menina) como fallback
    return templateConfigs['flor-de-menina'] || {
      templateId,
      cssPath: `/templates/${templateId}/styles.css`,
      fonts: [],
      cssVariables: {}
    }
  }

  return config
}

/**
 * Valida se o CSS do template existe
 */
export async function validateTemplateCSS(cssPath: string): Promise<boolean> {
  try {
    const response = await fetch(cssPath, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    console.warn(`[template-styles-loader] Erro ao validar CSS ${cssPath}:`, error)
    return false
  }
}

/**
 * Carrega fontes do template no iframe
 */
export function loadTemplateFonts(
  iframeDoc: Document,
  fonts: string[]
): Promise<void> {
  return new Promise((resolve) => {
    if (fonts.length === 0) {
      resolve()
      return
    }

    let loadedCount = 0
    const totalFonts = fonts.length

    fonts.forEach((fontUrl) => {
      const link = iframeDoc.createElement('link')
      link.rel = 'stylesheet'
      link.href = fontUrl
      link.crossOrigin = 'anonymous'
      
      link.onload = () => {
        loadedCount++
        if (loadedCount === totalFonts) {
          resolve()
        }
      }
      
      link.onerror = () => {
        console.warn(`[template-styles-loader] Erro ao carregar fonte ${fontUrl}`)
        loadedCount++
        if (loadedCount === totalFonts) {
          resolve()
        }
      }

      iframeDoc.head.appendChild(link)
    })
  })
}

/**
 * Aplica variáveis CSS do template no :root do iframe
 */
export function applyTemplateCSSVariables(
  iframeDoc: Document,
  cssVariables: Record<string, string>
): void {
  const root = iframeDoc.documentElement
  
  Object.entries(cssVariables).forEach(([variable, value]) => {
    root.style.setProperty(variable, value)
  })
}

/**
 * Carrega CSS do template no iframe
 */
export function loadTemplateCSS(
  iframeDoc: Document,
  cssPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'template-styles-loader.ts:154',message:'loadTemplateCSS ENTRY',data:{cssPath,origin:window.location.origin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Remover link existente se houver (para recarregar)
    const existingLink = iframeDoc.getElementById('template-shared-styles')
    if (existingLink) {
      existingLink.remove()
    }

    // Garantir URL absoluta
    const absolutePath = cssPath.startsWith('http') 
      ? cssPath 
      : `${window.location.origin}${cssPath.startsWith('/') ? '' : '/'}${cssPath}`

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'template-styles-loader.ts:169',message:'loadTemplateCSS BEFORE fetch',data:{absolutePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    const link = iframeDoc.createElement('link')
    link.id = 'template-shared-styles'
    link.rel = 'stylesheet'
    link.href = absolutePath
    link.crossOrigin = 'anonymous'
    
    // Inserir no início do head para máxima prioridade
    iframeDoc.head.insertBefore(link, iframeDoc.head.firstChild)
    
    link.onload = () => {
      // #region agent log
      const hasSheet = !!link.sheet;
      const rulesCount = link.sheet ? link.sheet.cssRules.length : 0;
      fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'template-styles-loader.ts:180',message:'loadTemplateCSS onload',data:{absolutePath,hasSheet,rulesCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.log(`[template-styles-loader] CSS carregado: ${absolutePath}`)
      resolve()
    }
    
    link.onerror = () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'template-styles-loader.ts:184',message:'loadTemplateCSS onerror',data:{absolutePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error(`[template-styles-loader] Erro ao carregar CSS ${absolutePath}`)
      // Não rejeitar, apenas logar o erro (pode ser que o CSS ainda não esteja disponível)
      resolve()
    }

    // Timeout de segurança
    setTimeout(() => {
      if (!link.sheet) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'template-styles-loader.ts:191',message:'loadTemplateCSS timeout',data:{absolutePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.warn(`[template-styles-loader] CSS não carregou após timeout: ${absolutePath}`)
        resolve() // Resolver mesmo assim para não bloquear
      }
    }, 3000)
  })
}

/**
 * Remove qualquer CSS do admin que possa ter sido injetado no iframe
 */
export function removeAdminStyles(iframeDoc: Document): void {
  // #region agent log
  const linksBefore = Array.from(iframeDoc.querySelectorAll('link[rel="stylesheet"]')).map(l => l.getAttribute('href'));
  const stylesBefore = Array.from(iframeDoc.querySelectorAll('style')).map(s => ({id:s.id,textLength:s.textContent?.length || 0}));
  fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'template-styles-loader.ts:203',message:'removeAdminStyles ENTRY',data:{linksBefore,stylesBefore},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  // Remover qualquer link que aponte para CSS do admin
  const links = iframeDoc.querySelectorAll('link[rel="stylesheet"]')
  const removedLinks: string[] = []
  links.forEach((link) => {
    const href = link.getAttribute('href') || ''
    // Remover CSS do Next.js, Tailwind do admin, ou qualquer CSS que não seja do template
    if (
      href.includes('/_next/static/css/') ||
      href.includes('app.css') ||
      href.includes('globals.css') ||
      (href.includes('admin') && !href.includes('template'))
    ) {
      removedLinks.push(href)
      link.remove()
    }
  })

  // Remover qualquer style tag que possa ter sido injetado pelo admin
  const styles = iframeDoc.querySelectorAll('style')
  const removedStyles: string[] = []
  styles.forEach((style) => {
    const text = style.textContent || ''
    // Remover estilos que contenham classes do Tailwind do admin ou do Next.js
    if (
      text.includes('tailwind') ||
      text.includes('next') ||
      (text.includes('admin') && !text.includes('template'))
    ) {
      // Não remover se for nosso reset ou CSS do template
      if (!style.id || (!style.id.includes('template') && !style.id.includes('reset'))) {
        removedStyles.push(style.id || 'no-id')
        style.remove()
      }
    }
  })
  
  // #region agent log
  const linksAfter = Array.from(iframeDoc.querySelectorAll('link[rel="stylesheet"]')).map(l => l.getAttribute('href'));
  fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'template-styles-loader.ts:235',message:'removeAdminStyles EXIT',data:{removedLinks,removedStyles,linksAfter},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
}

/**
 * Aplica reset CSS completo no iframe para isolar do admin
 */
export function applyIsolationReset(iframeDoc: Document, config: TemplateStylesConfig): void {
  // Verificar se já existe
  const existingReset = iframeDoc.getElementById('template-iframe-reset')
  if (existingReset) {
    existingReset.remove() // Remover e recriar para garantir que está atualizado
  }

  const resetStyle = iframeDoc.createElement('style')
  resetStyle.id = 'template-iframe-reset'
  resetStyle.textContent = `
    /* ============================================
       RESET COMPLETO DO IFRAME - ISOLAR DO EDITOR
       ============================================ */
    /* Este reset garante que NENHUM estilo do editor interfira */
    
    /* Resetar box-sizing para todos os elementos */
    *, *::before, *::after {
      box-sizing: border-box !important;
    }
    
    /* Resetar margin e padding do body e html */
    html, body {
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* FORÇAR fontes do template em TODOS os elementos - PRIORIDADE MÁXIMA */
    html, body {
      font-family: ${config.cssVariables['--font-body']} !important;
      line-height: 1.5 !important;
      letter-spacing: normal !important;
      background-color: hsl(${config.cssVariables['--background']}) !important;
      color: hsl(${config.cssVariables['--foreground']}) !important;
    }
    
    /* FORÇAR fontes do template em elementos de texto */
    p, span, div, a, button, input, textarea, select, label, li, td, th {
      font-family: ${config.cssVariables['--font-body']} !important;
      line-height: 1.5 !important;
      letter-spacing: normal !important;
    }
    
    /* FORÇAR fontes de display em headings - PRIORIDADE MÁXIMA */
    h1, h2, h3, h4, h5, h6 {
      font-family: ${config.cssVariables['--font-display']} !important;
      font-weight: 500 !important;
      line-height: 1.2 !important;
      color: hsl(${config.cssVariables['--foreground']}) !important;
    }
    
    /* FORÇAR fontes de display em spans dentro de headings */
    h1 *, h2 *, h3 *, h4 *, h5 *, h6 * {
      font-family: ${config.cssVariables['--font-display']} !important;
    }
    
    /* FORÇAR cores do template em classes utilitárias */
    .text-secondary {
      color: hsl(${config.cssVariables['--secondary-foreground']}) !important;
    }
    
    .text-gold {
      color: hsl(${config.cssVariables['--gold']}) !important;
    }
    
    .text-wine {
      color: hsl(${config.cssVariables['--wine']}) !important;
    }
    
    .text-charcoal {
      color: hsl(${config.cssVariables['--charcoal']}) !important;
    }
    
    .text-primary {
      color: hsl(${config.cssVariables['--primary']}) !important;
    }
    
    .bg-gold {
      background-color: hsl(${config.cssVariables['--gold']}) !important;
    }
    
    .bg-wine {
      background-color: hsl(${config.cssVariables['--wine']}) !important;
    }
    
    .bg-primary {
      background-color: hsl(${config.cssVariables['--primary']}) !important;
    }
    
    /* Garantir que classes do template funcionem */
    .font-display {
      font-family: ${config.cssVariables['--font-display']} !important;
    }
    
    .font-body {
      font-family: ${config.cssVariables['--font-body']} !important;
    }
  `
  
  // Inserir no início do head para máxima prioridade
  iframeDoc.head.insertBefore(resetStyle, iframeDoc.head.firstChild)
}

/**
 * Aplica estilos inline forçados no body e html do iframe
 */
export function applyForcedStyles(iframeDoc: Document, config: TemplateStylesConfig): void {
  const body = iframeDoc.body
  const html = iframeDoc.documentElement
  
  if (body) {
    body.style.setProperty('font-family', config.cssVariables['--font-body'], 'important')
    body.style.setProperty('background-color', `hsl(${config.cssVariables['--background']})`, 'important')
    body.style.setProperty('color', `hsl(${config.cssVariables['--foreground']})`, 'important')
    body.style.setProperty('margin', '0', 'important')
    body.style.setProperty('padding', '0', 'important')
    body.style.setProperty('line-height', '1.5', 'important')
    body.style.setProperty('font-size', '16px', 'important')
    
    // Forçar fontes em todos os elementos filhos
    const allElements = body.querySelectorAll('*')
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement
      // Apenas aplicar se for um elemento de texto (não headings)
      if (!['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(htmlEl.tagName)) {
        htmlEl.style.setProperty('font-family', config.cssVariables['--font-body'], 'important')
      } else {
        // Headings usam font-display
        htmlEl.style.setProperty('font-family', config.cssVariables['--font-display'], 'important')
      }
    })
  }
  
  if (html) {
    html.style.setProperty('font-family', config.cssVariables['--font-body'], 'important')
    html.style.setProperty('margin', '0', 'important')
    html.style.setProperty('padding', '0', 'important')
  }
}

/**
 * Observa mudanças no head do iframe e remove CSS do admin
 */
export function setupStyleObserver(iframeDoc: Document): MutationObserver {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement
          
          // Remover links de CSS do admin
          if (element.tagName === 'LINK') {
            const link = element as HTMLLinkElement
            const href = link.getAttribute('href') || ''
            if (
              href.includes('/_next/static/css/') ||
              href.includes('app.css') ||
              href.includes('globals.css') ||
              (href.includes('admin') && !href.includes('template'))
            ) {
              link.remove()
              console.log('[template-styles-loader] Removido CSS do admin:', href)
            }
          }
          
          // Remover style tags do admin
          if (element.tagName === 'STYLE') {
            const style = element as HTMLStyleElement
            const text = style.textContent || ''
            if (
              (text.includes('tailwind') || text.includes('next')) &&
              !style.id?.includes('template') &&
              !style.id?.includes('reset')
            ) {
              style.remove()
              console.log('[template-styles-loader] Removido style tag do admin')
            }
          }
        }
      })
    })
  })
  
  observer.observe(iframeDoc.head, {
    childList: true,
    subtree: true
  })
  
  return observer
}

/**
 * Carrega todos os estilos do template no iframe na ordem correta
 */
export async function loadTemplateStylesInIframe(
  iframeDoc: Document,
  templateId: string
): Promise<void> {
  const config = getTemplateStylesConfig(templateId)
  
  // #region agent log
  const logData = {location:'template-styles-loader.ts:433',message:'loadTemplateStylesInIframe ENTRY',data:{templateId,hasIframeDoc:!!iframeDoc,configCssPath:config.cssPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
  console.log('[DEBUG]', logData);
  fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
  // #endregion
  
  try {
    // #region agent log
    const linksBefore = Array.from(iframeDoc.querySelectorAll('link[rel="stylesheet"]')).map(l => ({href:l.getAttribute('href'),id:l.id}));
    const logDataB = {location:'template-styles-loader.ts:441',message:'BEFORE removeAdminStyles',data:{linksBefore},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
    console.log('[DEBUG]', logDataB);
    fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logDataB)}).catch(()=>{});
    // #endregion
    
    // 0. Remover qualquer CSS do admin que possa ter sido injetado
    removeAdminStyles(iframeDoc)
    
    // #region agent log
    const linksAfter = Array.from(iframeDoc.querySelectorAll('link[rel="stylesheet"]')).map(l => ({href:l.getAttribute('href'),id:l.id}));
    const logDataB2 = {location:'template-styles-loader.ts:444',message:'AFTER removeAdminStyles',data:{linksAfter},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
    console.log('[DEBUG]', logDataB2);
    fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logDataB2)}).catch(()=>{});
    // #endregion
    
    // 1. Aplicar reset CSS primeiro (com valores do template)
    applyIsolationReset(iframeDoc, config)
    
    // 2. Aplicar estilos inline forçados
    applyForcedStyles(iframeDoc, config)
    
    // #region agent log
    const bodyFont = iframeDoc.body ? getComputedStyle(iframeDoc.body).fontFamily : 'N/A';
    const bodyColor = iframeDoc.body ? getComputedStyle(iframeDoc.body).color : 'N/A';
    const logDataD = {location:'template-styles-loader.ts:448',message:'AFTER applyForcedStyles',data:{bodyFont,bodyColor,expectedFont:config.cssVariables['--font-body']},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'};
    console.log('[DEBUG]', logDataD);
    fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logDataD)}).catch(()=>{});
    // #endregion
    
    // 3. Configurar observer para remover CSS do admin que seja injetado depois
    const observer = setupStyleObserver(iframeDoc)
    
    // 4. Carregar fontes antes do CSS
    await loadTemplateFonts(iframeDoc, config.fonts)
    
    // 5. Aplicar variáveis CSS
    applyTemplateCSSVariables(iframeDoc, config.cssVariables)
    
    // #region agent log
    const rootVars = Array.from(['--font-body','--font-display','--background','--foreground','--primary']).map(v => ({var:v,value:iframeDoc.documentElement.style.getPropertyValue(v) || getComputedStyle(iframeDoc.documentElement).getPropertyValue(v)}));
    const logDataC = {location:'template-styles-loader.ts:456',message:'AFTER applyTemplateCSSVariables',data:{rootVars,expectedVars:Object.fromEntries(Object.entries(config.cssVariables).filter(([k])=>['--font-body','--font-display','--background','--foreground','--primary'].includes(k)))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'};
    console.log('[DEBUG]', logDataC);
    fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logDataC)}).catch(()=>{});
    // #endregion
    
    // 6. Carregar CSS do template
    await loadTemplateCSS(iframeDoc, config.cssPath)
    
    // #region agent log
    const cssLink = iframeDoc.getElementById('template-shared-styles') as HTMLLinkElement;
    const cssLoaded = cssLink ? (cssLink.sheet ? 'YES' : 'NO') : 'NOT_FOUND';
    const allLinks = Array.from(iframeDoc.querySelectorAll('link[rel="stylesheet"]')).map(l => ({href:l.getAttribute('href'),id:l.id,sheet:!!l.sheet}));
    const logDataA = {location:'template-styles-loader.ts:459',message:'AFTER loadTemplateCSS',data:{cssLoaded,allLinks,cssPath:config.cssPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
    console.log('[DEBUG]', logDataA);
    fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logDataA)}).catch(()=>{});
    // #endregion
    
    // 7. Após carregar CSS, aplicar novamente estilos forçados e remover CSS do admin
    // Fazer isso múltiplas vezes para garantir que não seja sobrescrito
    const reapplyStyles = () => {
      removeAdminStyles(iframeDoc)
      applyForcedStyles(iframeDoc, config)
      applyTemplateCSSVariables(iframeDoc, config.cssVariables)
      
      // #region agent log
      const finalBodyFont = iframeDoc.body ? getComputedStyle(iframeDoc.body).fontFamily : 'N/A';
      const finalRootVars = Array.from(['--font-body','--background']).map(v => ({var:v,value:getComputedStyle(iframeDoc.documentElement).getPropertyValue(v)}));
      const finalLinks = Array.from(iframeDoc.querySelectorAll('link[rel="stylesheet"]')).map(l => l.getAttribute('href'));
      const logDataF = {location:'template-styles-loader.ts:467',message:'reapplyStyles EXECUTED',data:{finalBodyFont,finalRootVars,finalLinks},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'};
      console.log('[DEBUG]', logDataF);
      fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logDataF)}).catch(()=>{});
      // #endregion
    }
    
    setTimeout(reapplyStyles, 50)
    setTimeout(reapplyStyles, 100)
    setTimeout(reapplyStyles, 200)
    setTimeout(reapplyStyles, 500)
    
    // 8. Limpar observer após um tempo (para não ficar observando indefinidamente)
    setTimeout(() => {
      observer.disconnect()
    }, 5000)
    
    // #region agent log
    const logDataSuccess = {location:'template-styles-loader.ts:479',message:'loadTemplateStylesInIframe SUCCESS',data:{templateId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
    console.log('[DEBUG]', logDataSuccess);
    fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logDataSuccess)}).catch(()=>{});
    // #endregion
    
    console.log(`[template-styles-loader] Estilos do template ${templateId} carregados com sucesso`)
  } catch (error) {
    // #region agent log
    const logDataError = {location:'template-styles-loader.ts:481',message:'loadTemplateStylesInIframe ERROR',data:{templateId,error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
    console.log('[DEBUG]', logDataError);
    fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logDataError)}).catch(()=>{});
    // #endregion
    
    console.error(`[template-styles-loader] Erro ao carregar estilos do template ${templateId}:`, error)
    throw error
  }
}

