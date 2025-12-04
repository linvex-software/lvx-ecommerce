'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import { Button } from '@white-label/ui'
import { Save, Eye, EyeOff, Download, Upload } from 'lucide-react'
import { CraftEditor } from '@/components/editor/CraftEditor'
import { NavbarEditor } from '@/components/editor/NavbarEditor'
import { craftJsonToBlocks, blocksToCraftJson } from '@/lib/utils/craft-converter'
import type { Block } from '@/components/blocks/types'
import type { NavbarItem } from '@/lib/types/navbar'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

interface DesignSettings {
  homepage_blocks: Block[] | null
  theme_primary_color?: string | null
  theme_secondary_color?: string | null
  theme_background_color?: string | null
  theme_foreground_color?: string | null
  font_family?: string | null
  border_radius?: string | null
  [key: string]: unknown
}

async function fetchDesignSettings(): Promise<{ design_settings: DesignSettings }> {
  const token = localStorage.getItem('accessToken')
  try {
    const response = await axios.get(`${API_URL}/admin/design-settings`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    return response.data
  } catch (error) {
    console.warn('Erro ao buscar design settings, usando valores padrão:', error)
    return {
      design_settings: {
        homepage_blocks: []
      } as DesignSettings
    }
  }
}

async function updateDesignSettings(data: Partial<DesignSettings>): Promise<{ design_settings: DesignSettings }> {
  const token = localStorage.getItem('accessToken')
  const response = await axios.put(`${API_URL}/admin/design-settings`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  return response.data
}

export default function HomepageEditorPage() {
  const queryClient = useQueryClient()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [navbarItems, setNavbarItems] = useState<NavbarItem[]>([])
  const [showPreview, setShowPreview] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<'blocks' | 'navbar'>('blocks')
  const [craftJson, setCraftJson] = useState<string>('')

  const { data, isLoading } = useQuery({
    queryKey: ['design-settings'],
    queryFn: fetchDesignSettings
  })

  const updateMutation = useMutation({
    mutationFn: updateDesignSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-settings'] })
      setHasUnsavedChanges(false)
      toast.success('Página salva com sucesso!')
    },
    onError: (error: any) => {
      console.error('Erro ao salvar:', error)
      if (error.code === 'ERR_NETWORK' || error.message?.includes('CONNECTION_REFUSED')) {
        toast.error('Erro de conexão. Verifique se a API está rodando.')
      } else {
        toast.error('Erro ao salvar página')
      }
    }
  })

  useEffect(() => {
    if (data?.design_settings?.homepage_blocks) {
      const loadedBlocks = data.design_settings.homepage_blocks as Block[]
      setBlocks(loadedBlocks)
      // Converter para Craft JSON quando carregar
      if (loadedBlocks.length > 0) {
        const initialJson = blocksToCraftJson(loadedBlocks)
        setCraftJson(initialJson)
      }
    }
    if (data?.design_settings?.navbar_items) {
      setNavbarItems(data.design_settings.navbar_items as NavbarItem[])
    }
  }, [data])

  const handleCraftSerialize = (json: string) => {
    setCraftJson(json)
    // Converter Craft JSON para blocks
    const convertedBlocks = craftJsonToBlocks(json)
    setBlocks(convertedBlocks)
    setHasUnsavedChanges(true)
  }

  const handleSave = () => {
    updateMutation.mutate({ 
      homepage_blocks: blocks,
      navbar_items: navbarItems
    })
  }

  const handleExport = () => {
    const json = JSON.stringify(blocks, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'homepage-blocks.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as Block[]
        setBlocks(imported)
        setHasUnsavedChanges(true)
        toast.success('Blocos importados com sucesso!')
      } catch (error) {
        toast.error('Erro ao importar arquivo JSON')
      }
    }
    reader.readAsText(file)
  }

  const theme = data?.design_settings ? {
    primaryColor: data.design_settings.theme_primary_color || undefined,
    secondaryColor: data.design_settings.theme_secondary_color || undefined,
    backgroundColor: data.design_settings.theme_background_color || undefined,
    foregroundColor: data.design_settings.theme_foreground_color || undefined,
    fontFamily: data.design_settings.font_family || undefined,
    borderRadius: data.design_settings.border_radius || undefined
  } : undefined

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-sm text-muted-foreground">Carregando editor...</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Tabs - Only show if not in blocks mode */}
      {activeTab !== 'blocks' && (
        <div className="border-b border-gray-200 bg-white w-full">
          <div className="flex">
            <button
              onClick={() => setActiveTab('blocks')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'blocks'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Blocos
            </button>
            <button
              onClick={() => setActiveTab('navbar')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'navbar'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Navbar
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden w-full">
        {activeTab === 'blocks' ? (
          <div className="w-full h-full">
            <CraftEditor 
              blocks={blocks}
              onSerialize={handleCraftSerialize}
              onSave={handleSave}
              isSaving={updateMutation.isPending}
              hasUnsavedChanges={hasUnsavedChanges}
              onFinish={() => {
                if (hasUnsavedChanges) {
                  handleSave()
                }
                // Navigate away or close editor
              }}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 bg-white w-full">
            <NavbarEditor items={navbarItems} onUpdate={setNavbarItems} />
          </div>
        )}
      </div>
    </div>
  )
}

