'use client'

import { useEffect, useState } from 'react'
import { useStorePreferences, useUpdateStorePreferences, useUpdateStoreLogo, type StorePreferences } from '@/lib/hooks/use-preferences'
import { ColorPicker } from '@/components/theme/color-picker'
import { ImageUpload } from '@/components/products/image-upload'
import { Button } from '@white-label/ui'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Save } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const DEFAULT_PREFERENCES: StorePreferences = {
  logo_url: null,
  primary_color: '#000000',
  secondary_color: '#6366F1',
  text_color: '#000000',
  icon_color: '#000000'
}

interface PreferencesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PreferencesModal({ open, onOpenChange }: PreferencesModalProps) {
  const { data: preferences, isLoading } = useStorePreferences()
  const updatePreferences = useUpdateStorePreferences()
  const updateLogo = useUpdateStoreLogo()

  const [localPreferences, setLocalPreferences] = useState<StorePreferences>(DEFAULT_PREFERENCES)
  const [isSaving, setIsSaving] = useState(false)

  // Carregar preferências do servidor
  useEffect(() => {
    if (preferences) {
      const loaded = {
        logo_url: preferences.logo_url ?? null,
        primary_color: preferences.primary_color ?? DEFAULT_PREFERENCES.primary_color,
        secondary_color: preferences.secondary_color ?? DEFAULT_PREFERENCES.secondary_color,
        text_color: preferences.text_color ?? DEFAULT_PREFERENCES.text_color,
        icon_color: preferences.icon_color ?? DEFAULT_PREFERENCES.icon_color
      }
      setLocalPreferences(loaded)
      applyThemeToPreview(loaded)
    }
  }, [preferences])

  // Aplicar tema no preview do editor em tempo real
  const applyThemeToPreview = (prefs: StorePreferences) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      const primaryColor = prefs.primary_color || DEFAULT_PREFERENCES.primary_color
      const secondaryColor = prefs.secondary_color || DEFAULT_PREFERENCES.secondary_color
      const textColor = prefs.text_color || DEFAULT_PREFERENCES.text_color
      const iconColor = prefs.icon_color || DEFAULT_PREFERENCES.icon_color
      
      // Aplicar no root do documento
      root.style.setProperty('--store-primary-color', primaryColor)
      root.style.setProperty('--store-secondary-color', secondaryColor)
      root.style.setProperty('--store-text-color', textColor)
      root.style.setProperty('--store-icon-color', iconColor)
      
      // Aplicar também em todos os elementos do Frame do Craft.js
      const applyToAllFrames = () => {
        const frames = document.querySelectorAll('[data-craftjs-frame], .craftjs-frame, [class*="craftjs"]')
        frames.forEach((frame) => {
          if (frame instanceof HTMLElement) {
            frame.style.setProperty('--store-primary-color', primaryColor)
            frame.style.setProperty('--store-secondary-color', secondaryColor)
            frame.style.setProperty('--store-text-color', textColor)
            frame.style.setProperty('--store-icon-color', iconColor)
          }
        })
      }
      
      // Aplicar imediatamente e depois de um delay para garantir que o Frame foi renderizado
      applyToAllFrames()
      setTimeout(applyToAllFrames, 100)
      setTimeout(applyToAllFrames, 500)
    }
  }

  // Atualizar preview quando localPreferences mudar
  useEffect(() => {
    if (open) {
      applyThemeToPreview(localPreferences)
    }
  }, [localPreferences, open])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Salvar logo separadamente se mudou
      if (localPreferences.logo_url !== preferences?.logo_url) {
        await updateLogo.mutateAsync(localPreferences.logo_url)
      }

      // Salvar cores
      await updatePreferences.mutateAsync({
        primary_color: localPreferences.primary_color,
        secondary_color: localPreferences.secondary_color,
        text_color: localPreferences.text_color,
        icon_color: localPreferences.icon_color
      })

      // Fechar modal após salvar
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao salvar preferências:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoChange = (url: string | null) => {
    setLocalPreferences(prev => ({ ...prev, logo_url: url }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preferências da Loja</DialogTitle>
          <DialogDescription>
            Configure a logo e o tema da sua loja
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm font-light text-gray-500">Carregando preferências...</div>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Logo Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Logo da Loja</CardTitle>
                <CardDescription>
                  Faça upload da logo que será exibida no site do cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  value={localPreferences.logo_url}
                  onChange={handleLogoChange}
                  aspectRatio="wide"
                />
              </CardContent>
            </Card>

            {/* Cores Principais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cores Principais</CardTitle>
                <CardDescription>
                  Defina as cores primária e secundária da sua loja
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ColorPicker
                  label="Cor Primária"
                  value={localPreferences.primary_color}
                  onChange={(color) => setLocalPreferences(prev => ({ ...prev, primary_color: color }))}
                  description="Usada em botões, links e elementos de destaque"
                />
                <ColorPicker
                  label="Cor Secundária"
                  value={localPreferences.secondary_color}
                  onChange={(color) => setLocalPreferences(prev => ({ ...prev, secondary_color: color }))}
                  description="Usada em elementos complementares e acentos"
                />
              </CardContent>
            </Card>

            {/* Cores de Tipografia e Ícones */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tipografia e Ícones</CardTitle>
                <CardDescription>
                  Personalize as cores do texto e dos ícones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ColorPicker
                  label="Cor do Texto"
                  value={localPreferences.text_color}
                  onChange={(color) => setLocalPreferences(prev => ({ ...prev, text_color: color }))}
                  description="Cor principal dos textos e títulos"
                />
                <ColorPicker
                  label="Cor dos Ícones"
                  value={localPreferences.icon_color}
                  onChange={(color) => setLocalPreferences(prev => ({ ...prev, icon_color: color }))}
                  description="Cor dos ícones e elementos gráficos"
                />
              </CardContent>
            </Card>

            {/* Preview ao vivo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview ao Vivo</CardTitle>
                <CardDescription>
                  Veja as mudanças em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Preview da Logo */}
                  {localPreferences.logo_url ? (
                    <div className="rounded-lg border border-gray-200 p-4 bg-white">
                      <img
                        src={localPreferences.logo_url}
                        alt="Logo preview"
                        className="max-w-full h-auto max-h-20 mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 p-8 bg-gray-50 text-center">
                      <p className="text-sm text-gray-500">Nenhuma logo</p>
                    </div>
                  )}

                  {/* Preview das Cores */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Cor Primária</p>
                      <div
                        className="h-12 rounded-lg border-2 border-gray-200"
                        style={{ backgroundColor: localPreferences.primary_color }}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Cor Secundária</p>
                      <div
                        className="h-12 rounded-lg border-2 border-gray-200"
                        style={{ backgroundColor: localPreferences.secondary_color }}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Cor do Texto</p>
                      <div
                        className="h-12 rounded-lg border-2 border-gray-200 flex items-center justify-center"
                        style={{ backgroundColor: localPreferences.text_color, color: '#fff' }}
                      >
                        <span className="text-sm font-medium">Texto</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Cor dos Ícones</p>
                      <div
                        className="h-12 rounded-lg border-2 border-gray-200 flex items-center justify-center"
                        style={{ backgroundColor: localPreferences.icon_color }}
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2L3 7v11h4v-6h6v6h4V7l-7-5z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Preview de Botão */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-2">Preview de Botão</p>
                    <button
                      className="w-full px-4 py-2 rounded-lg text-white font-medium transition-colors"
                      style={{ backgroundColor: localPreferences.primary_color }}
                    >
                      Botão de Exemplo
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão Salvar */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || updatePreferences.isPending || updateLogo.isPending}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Salvando...' : 'Salvar Preferências'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

