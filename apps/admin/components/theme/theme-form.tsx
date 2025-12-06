'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Save, RotateCcw, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@white-label/ui'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ColorPicker } from './color-picker'
import { ImageUpload } from '@/components/products/image-upload'
import { BannerManager, type Banner } from './banner-manager'
import { LivePreview } from './live-preview'
import { useAuthStore } from '@/store/auth-store'

export interface ThemeConfig {
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  fontFamily: 'sans' | 'serif'
  darkMode: boolean
  banners: Banner[]
}

const DEFAULT_THEME: ThemeConfig = {
  logoUrl: null,
  primaryColor: '#000000',
  secondaryColor: '#6366F1',
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
  fontFamily: 'sans',
  darkMode: false,
  banners: []
}

interface ThemeFormProps {
  initialConfig?: Partial<ThemeConfig>
  onSave: (config: ThemeConfig) => Promise<void>
  isLoading?: boolean
  onExport?: () => void
  onImport?: (config: ThemeConfig) => void
  onImportError?: (error: string) => void
}

export function ThemeForm({ initialConfig, onSave, isLoading = false, onExport, onImport, onImportError }: ThemeFormProps) {
  const user = useAuthStore((state) => state.user)
  // Memoizar initialConfig completo para evitar recriação
  const fullInitialConfig = useMemo(() => ({
    ...DEFAULT_THEME,
    ...initialConfig
  }), [initialConfig])

  const [config, setConfig] = useState<ThemeConfig>(fullInitialConfig)
  const initialConfigRef = useRef<ThemeConfig>(fullInitialConfig)

  // Atualizar config apenas quando initialConfig mudar externamente (ex: após salvar)
  useEffect(() => {
    const newInitial = { ...DEFAULT_THEME, ...initialConfig }
    const currentInitial = initialConfigRef.current
    
    // Comparar apenas se realmente mudou (não apenas referência)
    if (JSON.stringify(newInitial) !== JSON.stringify(currentInitial)) {
      initialConfigRef.current = newInitial
      setConfig(newInitial)
    }
  }, [initialConfig])

  // Detectar mudanças comparando com initialConfigRef (estável)
  const hasChanges = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(initialConfigRef.current)
  }, [config])

  const handleSave = async () => {
    await onSave(config)
    // Atualizar initialConfigRef após salvar para resetar hasChanges
    initialConfigRef.current = config
  }

  const handleReset = () => {
    if (confirm('Tem certeza que deseja resetar o tema para os valores padrão?')) {
      setConfig(DEFAULT_THEME)
      initialConfigRef.current = DEFAULT_THEME
    }
  }

  const handleExport = () => {
    if (onExport) {
      onExport()
    } else {
      // Fallback: exportação direta
      const exportData = {
        logoUrl: config.logoUrl,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        backgroundColor: config.backgroundColor,
        textColor: config.textColor,
        fontFamily: config.fontFamily,
        darkMode: config.darkMode,
        banners: config.banners
      }

      const json = JSON.stringify(exportData, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `theme-config-${user?.storeId?.slice(0, 8) || 'default'}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          const imported = JSON.parse(content) as Partial<ThemeConfig>

          // Validação básica
          if (
            typeof imported !== 'object' ||
            (!imported.primaryColor && !imported.logoUrl && !imported.fontFamily)
          ) {
            throw new Error('Formato de tema inválido')
          }

          // Mesclar com defaults para garantir campos obrigatórios
          const mergedConfig: ThemeConfig = {
            ...DEFAULT_THEME,
            ...imported,
            darkMode: imported.darkMode ?? false
          }

          if (onImport) {
            onImport(mergedConfig)
          } else {
            setConfig(mergedConfig)
          }
        } catch (error) {
          const errorMessage = 'Erro ao importar tema: O arquivo JSON é inválido ou está corrompido.'
          if (onImportError) {
            onImportError(errorMessage)
          } else {
            toast.error('Erro ao importar tema', {
              description: 'O arquivo JSON é inválido ou está corrompido. Verifique o arquivo e tente novamente.'
            })
          }
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr,480px]">
      {/* Formulário */}
      <div className="space-y-6">
        {/* Identidade Visual */}
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-light">Identidade visual</CardTitle>
            <CardDescription>Logo e elementos principais da marca</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Logo da loja</Label>
              <ImageUpload
                value={config.logoUrl}
                onChange={(url) => setConfig({ ...config, logoUrl: url })}
              />
              <p className="text-xs text-gray-500">
                Recomendado: PNG transparente ou SVG, mínimo 200px de largura
              </p>
            </div>

            <div className="space-y-2">
              <Label>Família de fonte</Label>
              <select
                value={config.fontFamily}
                onChange={(e) =>
                  setConfig({ ...config, fontFamily: e.target.value as 'sans' | 'serif' })
                }
                className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
              >
                <option value="sans">Sans-serif (Moderno)</option>
                <option value="serif">Serif (Elegante)</option>
              </select>
              <p className="text-xs text-gray-500">
                Escolha a tipografia principal da sua loja
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Modo escuro</Label>
                  <p className="text-xs text-gray-500">
                    Ativar modo escuro na loja
                  </p>
                </div>
                <Switch
                  checked={config.darkMode}
                  onChange={(e) => setConfig({ ...config, darkMode: e.target.checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cores do Tema */}
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-light">Cores do tema</CardTitle>
            <CardDescription>Personalize a paleta de cores da sua loja</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <ColorPicker
                label="Cor primária"
                value={config.primaryColor}
                onChange={(color) => setConfig({ ...config, primaryColor: color })}
                description="Usada em botões, links e elementos de destaque"
              />
              <ColorPicker
                label="Cor secundária"
                value={config.secondaryColor}
                onChange={(color) => setConfig({ ...config, secondaryColor: color })}
                description="Usada em elementos complementares"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <ColorPicker
                label="Cor de fundo"
                value={config.backgroundColor}
                onChange={(color) => setConfig({ ...config, backgroundColor: color })}
                description="Cor de fundo principal da loja"
              />
              <ColorPicker
                label="Cor de texto"
                value={config.textColor}
                onChange={(color) => setConfig({ ...config, textColor: color })}
                description="Cor principal do texto"
              />
            </div>
          </CardContent>
        </Card>

        {/* Banners */}
        <BannerManager
          banners={config.banners}
          onChange={(banners) => setConfig({ ...config, banners })}
        />

        {/* Export/Import */}
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-light">Exportar / Importar</CardTitle>
            <CardDescription>Backup e restauração do tema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleExport}
                className="flex-1 gap-2"
                disabled={isLoading}
              >
                <Download className="h-4 w-4" />
                Exportar tema
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleImport}
                className="flex-1 gap-2"
                disabled={isLoading}
              >
                <Upload className="h-4 w-4" />
                Importar tema
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="gap-2"
            disabled={isLoading}
          >
            <RotateCcw className="h-4 w-4" />
            Resetar tema
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Salvando...' : 'Salvar tema'}
          </Button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="hidden lg:block">
        <LivePreview config={config} />
      </div>
    </div>
  )
}

