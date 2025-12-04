'use client'

/**
 * Componente que aplica os estilos globais do template no editor
 * Garante que o preview no editor seja 100% idêntico à renderização na web
 * 
 * IMPORTANTE: Usa o arquivo CSS compartilhado templates/flor-de-menina/styles.css
 * para garantir que editor e web leiam da mesma fonte de estilos.
 */

import { useEffect } from 'react'

export function TemplateStyles() {
  useEffect(() => {
    // Carregar estilos compartilhados do template Flor de Menina
    // Este arquivo é a FONTE ÚNICA de verdade para estilos do template
    // CÓPIA EXATA de template1/flor-de-menina-boutique/src/index.css
    const link = document.createElement('link')
    link.href = '/templates/flor-de-menina/styles.css'
    link.rel = 'stylesheet'
    link.id = 'template-shared-styles'
    // Garantir que o CSS do template seja carregado DEPOIS do CSS do admin para ter prioridade
    // Mas antes de qualquer outro estilo
    const adminStyles = document.getElementById('admin-globals')
    if (adminStyles && adminStyles.nextSibling) {
      document.head.insertBefore(link, adminStyles.nextSibling)
    } else {
      document.head.appendChild(link)
    }

    // Aplicar isolamento seletivo do preview wrapper
    // Bloqueia CSS do admin sem resetar estilos do template
    const style = document.createElement('style')
    style.id = 'template-editor-overrides'
    style.textContent = `
      /* ============================================
         ISOLAMENTO COMPLETO DO PREVIEW DO EDITOR
         ============================================ */
      /* Bloquear TODOS os estilos globais do editor que possam interferir */
      
      /* Garantir que o preview-wrapper isole completamente do CSS do admin */
      .preview-wrapper {
        isolation: isolate !important;
        contain: style layout paint !important;
        display: block !important;
        width: 100% !important;
        min-height: 100% !important;
        font-family: var(--font-body, "Montserrat", system-ui, sans-serif) !important;
        background-color: hsl(var(--background, 0 0% 100%)) !important;
        color: hsl(var(--foreground, 0 0% 12%)) !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        position: relative !important;
        line-height: 1.5 !important;
        letter-spacing: normal !important;
      }

      /* Garantir que elementos dentro do wrapper não herdem estilos do admin */
      .preview-wrapper * {
        box-sizing: border-box !important;
      }

      /* Isolamento do frame do Craft.js dentro do wrapper */
      .preview-wrapper [data-craftjs-frame] {
        isolation: isolate !important;
        contain: style layout paint !important;
        display: block !important;
        width: 100% !important;
        min-height: 100% !important;
        font-family: var(--font-body, "Montserrat", system-ui, sans-serif) !important;
      }

      /* ============================================
         RESET COMPLETO DENTRO DO IFRAME
         ============================================ */
      /* FORÇAR estilos do template com prioridade MÁXIMA sobre Tailwind e editor */
      
      /* Resetar TODAS as fontes dentro do iframe e forçar fontes do template */
      [data-craftjs-frame] body,
      [data-craftjs-frame] body * {
        font-family: var(--font-body, "Montserrat", system-ui, sans-serif) !important;
        line-height: 1.5 !important;
        letter-spacing: normal !important;
      }

      /* FORÇAR fontes de display em TODOS os headings - PRIORIDADE MÁXIMA */
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
        font-family: var(--font-display, "Cormorant Garamond", Georgia, serif) !important;
        font-weight: 500 !important;
        color: hsl(var(--foreground, 0 0% 12%)) !important;
        margin: 0 !important;
        line-height: 1.2 !important;
        letter-spacing: normal !important;
      }

      /* Resetar qualquer herança de fontes do editor */
      [data-craftjs-frame] * {
        font-family: inherit !important;
      }

      /* Garantir que elementos de texto usem font-body EXATAMENTE como no template1 */
      [data-craftjs-frame] p,
      [data-craftjs-frame] span:not(h1 span):not(h2 span):not(h3 span):not(h4 span):not(h5 span):not(h6 span),
      [data-craftjs-frame] div:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6),
      [data-craftjs-frame] a,
      [data-craftjs-frame] button,
      [data-craftjs-frame] input,
      [data-craftjs-frame] textarea,
      [data-craftjs-frame] select,
      [data-craftjs-frame] label,
      [data-craftjs-frame] li {
        font-family: var(--font-body, "Montserrat", system-ui, sans-serif) !important;
        line-height: 1.5 !important;
        letter-spacing: normal !important;
      }

      /* FORÇAR classes do template com prioridade MÁXIMA sobre Tailwind */
      [data-craftjs-frame] .font-display {
        font-family: var(--font-display, "Cormorant Garamond", Georgia, serif) !important;
      }

      [data-craftjs-frame] .font-body {
        font-family: var(--font-body, "Montserrat", system-ui, sans-serif) !important;
      }

      /* CORRIGIDO: text-secondary deve usar --secondary-foreground */
      [data-craftjs-frame] .text-secondary {
        color: hsl(var(--secondary-foreground, 0 0% 20%)) !important;
      }

      [data-craftjs-frame] .text-gold {
        color: hsl(var(--gold, 42 65% 55%)) !important;
      }

      /* Garantir que spans dentro de h2 com text-gold funcionem */
      [data-craftjs-frame] h2 .text-gold,
      [data-craftjs-frame] h2 span.text-gold,
      [data-craftjs-frame] h2 > span.text-gold {
        color: hsl(var(--gold, 42 65% 55%)) !important;
      }

      /* Garantir que h2 com text-secondary funcione */
      [data-craftjs-frame] h2.text-secondary,
      [data-craftjs-frame] h2.text-secondary *:not(.text-gold) {
        color: hsl(var(--secondary-foreground, 0 0% 20%)) !important;
      }

      [data-craftjs-frame] .text-wine {
        color: hsl(var(--wine, 350 70% 35%)) !important;
      }

      [data-craftjs-frame] .text-charcoal {
        color: hsl(var(--charcoal, 0 0% 20%)) !important;
      }

      [data-craftjs-frame] .text-primary {
        color: hsl(var(--primary, 350 70% 35%)) !important;
      }

      [data-craftjs-frame] .text-foreground {
        color: hsl(var(--foreground, 0 0% 12%)) !important;
      }

      [data-craftjs-frame] .bg-gold {
        background-color: hsl(var(--gold)) !important;
      }

      [data-craftjs-frame] .bg-wine {
        background-color: hsl(var(--wine)) !important;
      }

      [data-craftjs-frame] .bg-charcoal {
        background-color: hsl(var(--charcoal)) !important;
      }

      [data-craftjs-frame] .bg-secondary {
        background-color: hsl(var(--secondary)) !important;
      }

      [data-craftjs-frame] .bg-primary {
        background-color: hsl(var(--primary)) !important;
      }

      /* BLOQUEAR Tailwind de sobrescrever estilos do template */
      /* Garantir que classes do template tenham prioridade MÁXIMA */
      [data-craftjs-frame] body {
        font-family: var(--font-body, "Montserrat", system-ui, sans-serif) !important;
        background-color: hsl(var(--background, 0 0% 100%)) !important;
        color: hsl(var(--foreground, 0 0% 12%)) !important;
      }

      /* Bloquear scrollbar do admin */
      [data-craftjs-frame]::-webkit-scrollbar {
        width: auto !important;
        height: auto !important;
      }

      [data-craftjs-frame]::-webkit-scrollbar-track {
        background: transparent !important;
      }

      [data-craftjs-frame]::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2) !important;
        border-radius: 4px !important;
      }

      /* Bloquear qualquer estilo do admin que possa vazar */
      [data-craftjs-frame] {
        contain: style layout paint !important;
      }

      /* Garantir que classes Tailwind do template funcionem dentro do frame */
      [data-craftjs-frame] .container {
        width: 100% !important;
        margin-left: auto !important;
        margin-right: auto !important;
        padding-left: 1rem !important;
        padding-right: 1rem !important;
      }

      @media (min-width: 640px) {
        [data-craftjs-frame] .container {
          max-width: 640px !important;
        }
      }

      @media (min-width: 768px) {
        [data-craftjs-frame] .container {
          max-width: 768px !important;
        }
      }

      @media (min-width: 1024px) {
        [data-craftjs-frame] .container {
          max-width: 1024px !important;
        }
      }

      @media (min-width: 1280px) {
        [data-craftjs-frame] .container {
          max-width: 1280px !important;
        }
      }

      @media (min-width: 1400px) {
        [data-craftjs-frame] .container {
          max-width: 1400px !important;
        }
      }

      @media (max-width: 767.98px) {
        [data-craftjs-frame] .container {
          padding-left: 0.5rem !important;
          padding-right: 0.5rem !important;
        }
      }

    `
    // Inserir DEPOIS do CSS do template para ter prioridade máxima
    const templateStyles = document.getElementById('template-shared-styles')
    if (templateStyles && templateStyles.nextSibling) {
      document.head.insertBefore(style, templateStyles.nextSibling)
    } else {
      document.head.appendChild(style)
    }

    return () => {
      // Cleanup
      const linkElement = document.getElementById('template-shared-styles')
      if (linkElement) {
        document.head.removeChild(linkElement)
      }
      const styleElement = document.getElementById('template-editor-overrides')
      if (styleElement) {
        document.head.removeChild(styleElement)
      }
    }
  }, [])

  return null
}

