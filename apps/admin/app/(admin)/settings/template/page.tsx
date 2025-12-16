'use client'

/**
 * Página de configurações do template
 * Permite micro-configurações: cores, logo, textos
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Button } from '@white-label/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Upload, Palette, Type, Image as ImageIcon } from 'lucide-react'
import type { TemplateConfig } from '../../../../../../templates/types'

export default function TemplateSettingsPage() {
  const queryClient = useQueryClient()
  const [config, setConfig] = useState<TemplateConfig | null>(null)

  // Carregar configuração atual
  const { data: currentConfig, isLoading } = useQuery<TemplateConfig>({
    queryKey: ['template-config'],
    queryFn: async () => {
      const response = await apiClient.get<{ config: TemplateConfig }>('/settings/template')
      return response.data.config
    }
  })

  // Salvar configuração
  const saveMutation = useMutation({
    mutationFn: async (newConfig: TemplateConfig) => {
      return apiClient.put('/settings/template', { config: newConfig })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-config'] })
      alert('Configurações salvas com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar configurações')
    }
  })

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig)
    }
  }, [currentConfig])

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-gray-500">Carregando configurações...</div>
      </div>
    )
  }

  const handleSave = () => {
    if (config) {
      saveMutation.mutate(config)
    }
  }

  const updateTheme = (key: keyof TemplateConfig['theme'], value: string) => {
    if (config) {
      setConfig({
        ...config,
        theme: {
          ...config.theme,
          [key]: value
        }
      })
    }
  }

  const updateBranding = (key: keyof TemplateConfig['branding'], value: string) => {
    if (config) {
      setConfig({
        ...config,
        branding: {
          ...config.branding,
          [key]: value
        }
      })
    }
  }

  const updateContent = (section: keyof TemplateConfig['content'], key: string, value: string) => {
    if (config) {
      setConfig({
        ...config,
        content: {
          ...config.content,
          [section]: {
            ...config.content[section],
            [key]: value
          }
        }
      })
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configurações do Template</h1>
        <p className="text-gray-600 mt-2">
          Personalize cores, logo e textos do seu template. O layout permanece fixo.
        </p>
      </div>

      <Tabs defaultValue="theme" className="space-y-6">
        <TabsList>
          <TabsTrigger value="theme">
            <Palette className="w-4 h-4 mr-2" />
            Cores
          </TabsTrigger>
          <TabsTrigger value="branding">
            <ImageIcon className="w-4 h-4 mr-2" />
            Marca
          </TabsTrigger>
          <TabsTrigger value="content">
            <Type className="w-4 h-4 mr-2" />
            Textos
          </TabsTrigger>
        </TabsList>

        {/* Tab: Cores */}
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle>Cores do Tema</CardTitle>
              <CardDescription>
                Personalize as cores principais do template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Cor Primária</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={config.theme.primaryColor}
                      onChange={(e) => updateTheme('primaryColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={config.theme.primaryColor}
                      onChange={(e) => updateTheme('primaryColor', e.target.value)}
                      placeholder="#C2185B"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondaryColor">Cor Secundária</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={config.theme.secondaryColor}
                      onChange={(e) => updateTheme('secondaryColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={config.theme.secondaryColor}
                      onChange={(e) => updateTheme('secondaryColor', e.target.value)}
                      placeholder="#F8E8EC"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="backgroundColor">Cor de Fundo</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={config.theme.backgroundColor}
                      onChange={(e) => updateTheme('backgroundColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={config.theme.backgroundColor}
                      onChange={(e) => updateTheme('backgroundColor', e.target.value)}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="buttonColor">Cor dos Botões</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="buttonColor"
                      type="color"
                      value={config.theme.buttonColor}
                      onChange={(e) => updateTheme('buttonColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={config.theme.buttonColor}
                      onChange={(e) => updateTheme('buttonColor', e.target.value)}
                      placeholder="#C2185B"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="textColor">Cor do Texto</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="textColor"
                      type="color"
                      value={config.theme.textColor}
                      onChange={(e) => updateTheme('textColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={config.theme.textColor}
                      onChange={(e) => updateTheme('textColor', e.target.value)}
                      placeholder="#333333"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Marca */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Marca e Identidade</CardTitle>
              <CardDescription>
                Configure logo, favicon e nome da loja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="storeName">Nome da Loja</Label>
                <Input
                  id="storeName"
                  value={config.branding.storeName}
                  onChange={(e) => updateBranding('storeName', e.target.value)}
                  placeholder="Flor de Menina Boutique"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="logoUrl">URL do Logo</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="logoUrl"
                    value={config.branding.logoUrl}
                    onChange={(e) => updateBranding('logoUrl', e.target.value)}
                    placeholder="/logo.png"
                  />
                  <Button type="button" variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="faviconUrl">URL do Favicon</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="faviconUrl"
                    value={config.branding.faviconUrl}
                    onChange={(e) => updateBranding('faviconUrl', e.target.value)}
                    placeholder="/favicon.ico"
                  />
                  <Button type="button" variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Textos */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Textos do Site</CardTitle>
              <CardDescription>
                Personalize os textos exibidos no template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Homepage</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="heroTitle">Título do Hero</Label>
                    <Input
                      id="heroTitle"
                      value={config.content.home.heroTitle}
                      onChange={(e) => updateContent('home', 'heroTitle', e.target.value)}
                      placeholder="Nova Coleção"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="heroSubtitle">Subtítulo do Hero</Label>
                    <Input
                      id="heroSubtitle"
                      value={config.content.home.heroSubtitle}
                      onChange={(e) => updateContent('home', 'heroSubtitle', e.target.value)}
                      placeholder="Elegância que transforma"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Footer</h3>
                <div>
                  <Label htmlFor="policyText">Texto da Política</Label>
                  <Input
                    id="policyText"
                    value={config.content.footer.policyText}
                    onChange={(e) => updateContent('footer', 'policyText', e.target.value)}
                    placeholder="Política de Trocas e Devoluções"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  )
}

