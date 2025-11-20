'use client'

import { useEffect, useState, useMemo } from 'react'
import { useTheme, useUpdateTheme } from '@/lib/hooks/use-theme'
import { ThemeForm, type ThemeConfig } from '@/components/theme/theme-form'
import { LivePreview } from '@/components/theme/live-preview'

const DEFAULT_CONFIG: ThemeConfig = {
  logoUrl: null,
  primaryColor: '#000000',
  secondaryColor: '#6366F1',
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
  fontFamily: 'sans',
  darkMode: false,
  banners: []
}

export default function ThemePage() {
  const { data: theme, isLoading: isLoadingTheme } = useTheme()
  const updateTheme = useUpdateTheme()
  const [localConfig, setLocalConfig] = useState<ThemeConfig | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showImportSuccess, setShowImportSuccess] = useState(false)
  const [showImportError, setShowImportError] = useState(false)

  useEffect(() => {
    if (theme) {
      setLocalConfig(theme)
    }
  }, [theme])

  const handleSave = async (config: ThemeConfig) => {
    try {
      await updateTheme.mutateAsync(config)
      setLocalConfig(config) // Atualizar localConfig após salvar
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      alert('Erro ao salvar tema. Tente novamente.')
    }
  }

  const handleImport = (config: ThemeConfig) => {
    setLocalConfig(config)
    setShowImportSuccess(true)
    setShowImportError(false)
    setTimeout(() => setShowImportSuccess(false), 3000)
  }

  const handleImportError = () => {
    setShowImportError(true)
    setShowImportSuccess(false)
    setTimeout(() => setShowImportError(false), 5000)
  }

  // Memoizar currentConfig para evitar recriação a cada render
  const currentConfig = useMemo(() => {
    return localConfig || DEFAULT_CONFIG
  }, [localConfig])

  if (isLoadingTheme) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm font-light text-gray-500">Carregando tema...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-light tracking-tight text-gray-900">Tema</h1>
        <p className="mt-2 text-sm font-light text-gray-500">
          Personalize a identidade visual da sua loja
        </p>
      </div>

      {/* Success Messages */}
      {showSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-4">
          <p className="text-sm font-medium text-emerald-800">
            ✓ Tema salvo com sucesso!
          </p>
        </div>
      )}

      {showImportSuccess && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-6 py-4">
          <p className="text-sm font-medium text-blue-800">
            ✓ Tema importado com sucesso! Revise e salve para aplicar.
          </p>
        </div>
      )}

      {showImportError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-6 py-4">
          <p className="text-sm font-medium text-rose-800">
            ✗ Erro ao importar tema: O arquivo JSON é inválido ou está corrompido.
          </p>
        </div>
      )}

      {/* Mobile Preview (apenas em mobile) */}
      <div className="lg:hidden">
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
            Preview ao vivo
          </p>
          <div className="h-[600px] overflow-hidden rounded-lg border border-gray-200">
            <LivePreview config={currentConfig} />
          </div>
        </div>
      </div>

      {/* Form */}
      <ThemeForm
        initialConfig={currentConfig}
        onSave={handleSave}
        onImport={handleImport}
        onImportError={handleImportError}
        isLoading={updateTheme.isPending}
      />
    </div>
  )
}

