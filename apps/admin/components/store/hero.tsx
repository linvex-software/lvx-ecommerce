'use client'

import { useNode, useEditor } from '@craftjs/core'
import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'

interface HeroProps {
  imageUrl?: string
}

export function Hero({
  imageUrl = ''
}: HeroProps) {
  const {
    connectors: { connect, drag },
    isActive
  } = useNode((state) => ({
    isActive: state.events.selected
  }))
  
  // Detectar se estamos no editor
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled
  }))
  
  // No editor, usar width 100% para respeitar o container
  // Na web, usar 100vw para quebrar o container
  const isInEditor = enabled

  // Se não houver imagem, não renderizar o componente
  if (!imageUrl) {
    return (
      <div
        ref={(ref) => {
          if (ref) {
            connect(drag(ref))
          }
        }}
        className={`relative ${isActive ? 'ring-2 ring-blue-500' : ''}`}
        style={{
          cursor: 'move',
          minHeight: '300px'
        }}
      >
        <div className="flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 h-full min-h-[300px]">
          <p className="text-gray-400 text-sm">Hero - Faça upload de uma imagem</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={(ref) => {
        if (ref) {
          connect(drag(ref))
        }
      }}
      className={`relative overflow-hidden w-full ${isActive ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        cursor: 'move',
        width: isInEditor ? '100%' : '100vw',
        marginLeft: isInEditor ? 0 : 'calc(50% - 50vw)',
        marginRight: isInEditor ? 0 : 'calc(50% - 50vw)',
        maxWidth: isInEditor ? '100%' : '100vw',
        marginTop: isInEditor ? 0 : '-3rem',
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
        position: 'relative',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 0,
        overflow: 'hidden',
        display: 'block',
        lineHeight: 0
      }}
    >
      <>
        <style dangerouslySetInnerHTML={{__html: `
          .hero-mask-mobile {
            -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 80%, rgba(0,0,0,1) 100%);
            mask-image: linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 80%, rgba(0,0,0,1) 100%);
          }
          @media (min-width: 768px) {
            .hero-mask-mobile {
              -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,1) 100%);
              mask-image: linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,1) 100%);
            }
          }
        `}} />
        <img
          src={imageUrl}
          alt="Hero banner"
          className="w-full  h-auto object-contain object-center block hero-mask-mobile"
          style={{
            display: 'block',
            marginTop: '45px !important',
            padding: 0,
            maxHeight: 'none'
          }}
        />
      </>
    </div>
  )
}

Hero.craft = {
  displayName: 'Hero',
  props: {
    imageUrl: ''
  },
  related: {
    settings: HeroSettings
  }
}

function HeroSettings() {
  const {
    actions: { setProp },
    imageUrl
  } = useNode((node) => ({
    imageUrl: node.data.props.imageUrl || ''
  }))

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF).')
      return
    }

    // Validar tamanho (máximo 10MB para base64)
    if (file.size > 10 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 10MB. Por favor, escolha uma imagem menor.')
      return
    }

    setIsUploading(true)

    // Converter para base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64String = e.target?.result as string
      setProp((props: HeroProps) => (props.imageUrl = base64String))
      setIsUploading(false)
    }
    reader.onerror = () => {
      setIsUploading(false)
      alert('Erro ao processar imagem. Tente novamente.')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setProp((props: HeroProps) => (props.imageUrl = ''))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium mb-2">Imagem do Hero</label>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {imageUrl ? (
          <div className="space-y-2">
            <div className="relative rounded-lg border border-gray-300 overflow-hidden bg-gray-100">
              <div
                className="w-full h-48 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${imageUrl})`
                }}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                title="Remover imagem"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={isUploading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? 'Carregando...' : 'Trocar Imagem'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={isUploading}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-md hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            {isUploading ? 'Carregando...' : 'Fazer Upload da Imagem'}
          </button>
        )}

        <p className="text-xs text-gray-500 mt-2">
          A imagem será convertida para base64 e exibida como banner com degradê de transparência
        </p>
      </div>
    </div>
  )
}

