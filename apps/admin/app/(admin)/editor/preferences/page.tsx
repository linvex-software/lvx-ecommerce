'use client'

import { useEffect, useState } from 'react'
import { Button } from '@white-label/ui'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Save } from 'lucide-react'
import { useStoreSettings, useUpdateStoreSettings, type StoreSettings } from '@/lib/hooks/use-store-settings'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function PreferencesPage() {
  /* Hooks General Settings */
  const { data: storeSettings, isLoading } = useStoreSettings()
  const updateSettings = useUpdateStoreSettings()
  const [localSettings, setLocalSettings] = useState<Partial<StoreSettings>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Carregar configurações gerais
  useEffect(() => {
    if (storeSettings) {
      setLocalSettings(storeSettings)
    }
  }, [storeSettings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Salvar configurações gerais
      await updateSettings.mutateAsync(localSettings)
    } catch (error) {
      console.error('Erro ao salvar preferências:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const setSocialMedia = (key: string, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      social_media: {
        ...(prev.social_media || {}),
        [key]: value
      }
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm font-light text-gray-500">Carregando informações...</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8 p-6 pb-12">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-light tracking-tight text-gray-900">Preferências</h1>
          <p className="mt-2 text-sm font-light text-gray-500">
            Configure as informações gerais da sua loja
          </p>
        </div>

        <div className="space-y-6">
          {/* Formulário */}
          <div className="space-y-6">

            {/* Informações Gerais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações da Loja</CardTitle>
                <CardDescription>
                  Dados exibidos no rodapé e páginas de contato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ / CPF</Label>
                    <Input
                      id="cnpj"
                      value={localSettings.cnpj_cpf || ''}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, cnpj_cpf: e.target.value }))}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail de Contato</Label>
                    <Input
                      id="email"
                      type="email"
                      value={localSettings.email || ''}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="contato@loja.com.br"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp (Número)</Label>
                    <Input
                      id="whatsapp"
                      value={localSettings.whatsapp || ''}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, whatsapp: e.target.value }))}
                      placeholder="5511999999999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço Completo</Label>
                    <Input
                      id="address"
                      value={localSettings.address || ''}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Rua Exemplo, 123 - Cidade/UF"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Redes Sociais */}
            <Card>
              <CardHeader>
                <CardTitle>Redes Sociais</CardTitle>
                <CardDescription>
                  Links para seus perfis sociais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={localSettings.social_media?.instagram || ''}
                      onChange={(e) => setSocialMedia('instagram', e.target.value)}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={localSettings.social_media?.facebook || ''}
                      onChange={(e) => setSocialMedia('facebook', e.target.value)}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok</Label>
                    <Input
                      id="tiktok"
                      value={localSettings.social_media?.tiktok || ''}
                      onChange={(e) => setSocialMedia('tiktok', e.target.value)}
                      placeholder="https://tiktok.com/@..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      value={localSettings.social_media?.youtube || ''}
                      onChange={(e) => setSocialMedia('youtube', e.target.value)}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_link">Link do WhatsApp</Label>
                    <Input
                      id="whatsapp_link"
                      value={localSettings.social_media?.whatsapp_link || ''}
                      onChange={(e) => setSocialMedia('whatsapp_link', e.target.value)}
                      placeholder="https://wa.me/..."
                    />
                    <p className="text-[10px] text-muted-foreground">Link direto para abrir conversa (ex: wa.me)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão Salvar */}
            <div className="flex justify-end pb-10">
              <Button
                onClick={handleSave}
                disabled={isSaving || updateSettings.isPending}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Salvando...' : 'Salvar Preferências'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
