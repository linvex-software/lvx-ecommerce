#!/usr/bin/env tsx

/**
 * Script para escanear todos os componentes store e gerar relatório
 * sobre textColor, backgroundColor e uso de temas
 */

import * as fs from 'fs'
import * as path from 'path'

interface ComponentReport {
  filePath: string
  hasTextColor: boolean
  hasBackgroundColor: boolean
  usesThemeColors: boolean
  appliesStylesInline: boolean
  appliesStylesViaClasses: boolean
  hasCSSConflicts: boolean
  textColorProp?: string
  backgroundColorProp?: string
  notes: string[]
}

const STORE_COMPONENTS_PATHS = [
  'apps/admin/components/store',
  'apps/web/components/store'
]

const THEME_COLOR_PATTERNS = [
  /var\(--store-[^)]+\)/g,
  /--store-text-color/,
  /--store-primary-color/,
  /--store-secondary-color/,
  /useTheme/i,
  /theme.*color/i
]

const INLINE_STYLE_PATTERNS = [
  /style=\{\{/,
  /style:\s*\{/,
  /\.style\./,
  /getColorWithOpacity/,
  /getTypographyStyles/,
  /getSpacingStyles/
]

const CLASS_STYLE_PATTERNS = [
  /className=.*bg-/,
  /className=.*text-/,
  /className=.*color/
]

const CSS_CONFLICT_PATTERNS = [
  /!important/,
  /\[.*\]\s*\{[^}]*color[^}]*\}/, // CSS com alta especificidade
  /\.\w+\.\w+\.\w+.*color/ // Classes muito específicas
]

async function scanComponent(filePath: string): Promise<ComponentReport> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const relativePath = path.relative(process.cwd(), filePath)
  
  const report: ComponentReport = {
    filePath: relativePath,
    hasTextColor: false,
    hasBackgroundColor: false,
    usesThemeColors: false,
    appliesStylesInline: false,
    appliesStylesViaClasses: false,
    hasCSSConflicts: false,
    notes: []
  }

  // Verificar props textColor/backgroundColor
  const textColorMatches = [
    /textColor\??\s*:/,
    /text-color/,
    /color\??\s*:\s*['"`]/,
    /ColorConfig/
  ]
  
  const backgroundColorMatches = [
    /backgroundColor\??\s*:/,
    /background-color/,
    /backgroundColor\??\s*:\s*['"`]/,
    /backgroundColor\??\s*:\s*\{/
  ]

  report.hasTextColor = textColorMatches.some(pattern => pattern.test(content))
  report.hasBackgroundColor = backgroundColorMatches.some(pattern => pattern.test(content))

  // Extrair nomes das props
  const textColorPropMatch = content.match(/(\w+)\??\s*:\s*(?:string|ColorConfig).*text/i)
  if (textColorPropMatch) {
    report.textColorProp = textColorPropMatch[1]
  } else if (content.includes('textColor')) {
    report.textColorProp = 'textColor'
  }

  const backgroundColorPropMatch = content.match(/(\w+)\??\s*:\s*(?:string|ColorConfig).*background/i)
  if (backgroundColorPropMatch) {
    report.backgroundColorProp = backgroundColorPropMatch[1]
  } else if (content.includes('backgroundColor')) {
    report.backgroundColorProp = 'backgroundColor'
  }

  // Verificar uso de cores do tema
  report.usesThemeColors = THEME_COLOR_PATTERNS.some(pattern => 
    typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content)
  )

  // Verificar aplicação de estilos
  report.appliesStylesInline = INLINE_STYLE_PATTERNS.some(pattern => pattern.test(content))
  report.appliesStylesViaClasses = CLASS_STYLE_PATTERNS.some(pattern => pattern.test(content))

  // Verificar conflitos CSS
  report.hasCSSConflicts = CSS_CONFLICT_PATTERNS.some(pattern => pattern.test(content))

  // Notas adicionais
  if (content.includes('ALLOWED_COLORS')) {
    report.notes.push('Usa lista restrita de cores (ALLOWED_COLORS)')
  }
  
  if (content.includes('safeBackgroundColor') || content.includes('safeTextColor')) {
    report.notes.push('Valida cores com fallback')
  }

  if (content.includes('ColorConfig')) {
    report.notes.push('Usa sistema padronizado ColorConfig')
  }

  if (content.includes('getColorWithOpacity')) {
    report.notes.push('Usa utilitário getColorWithOpacity')
  }

  if (content.includes('bg-white') && !content.includes('backgroundColor')) {
    report.notes.push('⚠️ Usa classe bg-white hardcoded (pode conflitar com backgroundColor)')
  }

  if (content.includes('text-') && !content.includes('textColor') && !content.includes('var(--store-text-color)')) {
    report.notes.push('⚠️ Usa classes de texto hardcoded (pode conflitar com textColor)')
  }

  return report
}

function findTsxFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      findTsxFiles(filePath, fileList)
    } else if (file.endsWith('.tsx') && !file.includes('.test.') && !file.includes('.spec.')) {
      fileList.push(filePath)
    }
  })
  
  return fileList
}

async function generateReport() {
  console.log('🔍 Escaneando componentes store...\n')

  const allReports: ComponentReport[] = []

  for (const basePath of STORE_COMPONENTS_PATHS) {
    const fullPath = path.join(process.cwd(), basePath)
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  Caminho não encontrado: ${fullPath}`)
      continue
    }
    
    const files = findTsxFiles(fullPath)
    
    for (const file of files) {
      try {
        const report = await scanComponent(file)
        allReports.push(report)
      } catch (error) {
        console.error(`❌ Erro ao escanear ${file}:`, error)
      }
    }
  }

  // Gerar relatório
  console.log('='.repeat(80))
  console.log('📊 RELATÓRIO DE COMPONENTES STORE')
  console.log('='.repeat(80))
  console.log()

  // Agrupar por componente (admin vs web)
  const grouped = new Map<string, ComponentReport[]>()
  
  for (const report of allReports) {
    const componentName = path.basename(report.filePath, '.tsx')
    if (!grouped.has(componentName)) {
      grouped.set(componentName, [])
    }
    grouped.get(componentName)!.push(report)
  }

  // Estatísticas gerais
  const withTextColor = allReports.filter(r => r.hasTextColor).length
  const withBackgroundColor = allReports.filter(r => r.hasBackgroundColor).length
  const usingTheme = allReports.filter(r => r.usesThemeColors).length
  const withConflicts = allReports.filter(r => r.hasCSSConflicts).length

  console.log('📈 ESTATÍSTICAS GERAIS:')
  console.log(`   Total de componentes: ${allReports.length}`)
  console.log(`   Com textColor: ${withTextColor} (${Math.round(withTextColor/allReports.length*100)}%)`)
  console.log(`   Com backgroundColor: ${withBackgroundColor} (${Math.round(withBackgroundColor/allReports.length*100)}%)`)
  console.log(`   Usando cores do tema: ${usingTheme} (${Math.round(usingTheme/allReports.length*100)}%)`)
  console.log(`   Com conflitos CSS: ${withConflicts}`)
  console.log()

  // Relatório detalhado por componente
  console.log('📋 RELATÓRIO DETALHADO POR COMPONENTE:')
  console.log('='.repeat(80))
  console.log()

  for (const [componentName, reports] of Array.from(grouped.entries()).sort()) {
    console.log(`\n📦 ${componentName.toUpperCase()}`)
    console.log('-'.repeat(80))
    
    for (const report of reports) {
      console.log(`\n  📁 ${report.filePath}`)
      console.log(`     ✅ textColor: ${report.hasTextColor ? 'SIM' : 'NÃO'} ${report.textColorProp ? `(${report.textColorProp})` : ''}`)
      console.log(`     ✅ backgroundColor: ${report.hasBackgroundColor ? 'SIM' : 'NÃO'} ${report.backgroundColorProp ? `(${report.backgroundColorProp})` : ''}`)
      console.log(`     🎨 Usa cores do tema: ${report.usesThemeColors ? 'SIM' : 'NÃO'}`)
      console.log(`     💅 Estilos inline: ${report.appliesStylesInline ? 'SIM' : 'NÃO'}`)
      console.log(`     🎯 Estilos via classes: ${report.appliesStylesViaClasses ? 'SIM' : 'NÃO'}`)
      console.log(`     ⚠️  Conflitos CSS: ${report.hasCSSConflicts ? 'SIM' : 'NÃO'}`)
      
      if (report.notes.length > 0) {
        console.log(`     📝 Notas:`)
        report.notes.forEach(note => console.log(`        - ${note}`))
      }
    }
  }

  // Componentes que precisam de atenção
  console.log('\n\n⚠️  COMPONENTES QUE PRECISAM DE ATENÇÃO:')
  console.log('='.repeat(80))
  
  const needsAttention = allReports.filter(r => 
    !r.hasTextColor || 
    !r.hasBackgroundColor || 
    !r.usesThemeColors || 
    r.hasCSSConflicts ||
    r.notes.some(n => n.includes('⚠️'))
  )

  if (needsAttention.length === 0) {
    console.log('✅ Nenhum componente precisa de atenção!')
  } else {
    for (const report of needsAttention) {
      console.log(`\n❌ ${report.filePath}`)
      if (!report.hasTextColor) console.log('   - Falta prop textColor')
      if (!report.hasBackgroundColor) console.log('   - Falta prop backgroundColor')
      if (!report.usesThemeColors) console.log('   - Não usa cores do tema')
      if (report.hasCSSConflicts) console.log('   - Possui conflitos CSS')
      report.notes.filter(n => n.includes('⚠️')).forEach(note => {
        console.log(`   - ${note}`)
      })
    }
  }

  // Salvar relatório em arquivo
  const reportPath = path.join(process.cwd(), 'COMPONENT_SCAN_REPORT.md')
  const markdown = generateMarkdownReport(allReports, grouped)
  fs.writeFileSync(reportPath, markdown)
  console.log(`\n\n💾 Relatório salvo em: ${reportPath}`)
}

function generateMarkdownReport(
  allReports: ComponentReport[],
  grouped: Map<string, ComponentReport[]>
): string {
  let md = '# Relatório de Scan - Componentes Store\n\n'
  md += `**Data:** ${new Date().toISOString()}\n\n`
  md += `**Total de componentes:** ${allReports.length}\n\n`
  
  md += '## Estatísticas Gerais\n\n'
  md += `- Com textColor: ${allReports.filter(r => r.hasTextColor).length}\n`
  md += `- Com backgroundColor: ${allReports.filter(r => r.hasBackgroundColor).length}\n`
  md += `- Usando cores do tema: ${allReports.filter(r => r.usesThemeColors).length}\n`
  md += `- Com conflitos CSS: ${allReports.filter(r => r.hasCSSConflicts).length}\n\n`
  
  md += '## Relatório por Componente\n\n'
  
  for (const [componentName, reports] of Array.from(grouped.entries()).sort()) {
    md += `### ${componentName}\n\n`
    
    for (const report of reports) {
      md += `#### ${report.filePath}\n\n`
      md += `- **textColor:** ${report.hasTextColor ? '✅' : '❌'} ${report.textColorProp || ''}\n`
      md += `- **backgroundColor:** ${report.hasBackgroundColor ? '✅' : '❌'} ${report.backgroundColorProp || ''}\n`
      md += `- **Usa cores do tema:** ${report.usesThemeColors ? '✅' : '❌'}\n`
      md += `- **Estilos inline:** ${report.appliesStylesInline ? '✅' : '❌'}\n`
      md += `- **Estilos via classes:** ${report.appliesStylesViaClasses ? '✅' : '❌'}\n`
      md += `- **Conflitos CSS:** ${report.hasCSSConflicts ? '⚠️' : '✅'}\n`
      
      if (report.notes.length > 0) {
        md += `\n**Notas:**\n`
        report.notes.forEach(note => md += `- ${note}\n`)
      }
      md += '\n'
    }
  }
  
  return md
}

// Executar
generateReport().catch(console.error)

