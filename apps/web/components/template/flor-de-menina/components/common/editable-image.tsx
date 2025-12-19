'use client'

import React, { useRef, useState, useEffect } from 'react'
import { ImagePlus, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'
import { useNode } from '@craftjs/core'
import { useImageUpload } from '@/lib/hooks/use-image-upload'
import { useSafeNode } from '../../lib/hooks/use-safe-node'
import { createPortal } from 'react-dom'

interface EditableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Prop do Craft.js para atualizar a URL da imagem
   * Se não fornecida, tentará usar useNode automaticamente
   */
  imageProp?: string
  /**
   * Callback chamado quando a imagem é atualizada
   */
  onImageChange?: (url: string) => void
  /**
   * Posição do botão de edição
   */
  buttonPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

/**
 * Componente de imagem editável que adiciona um botão de upload
 * quando renderizado no editor.
 * 
 * Funciona como uma tag <img> normal fora do editor.
 * No editor, adiciona um botão flutuante para alterar a imagem.
 */
export function EditableImage({
  src,
  imageProp = 'src',
  onImageChange,
  buttonPosition = 'top-right',
  className = '',
  style,
  ...imgProps
}: EditableImageProps) {
  const safeNode = useSafeNode()
  const isInEditor = 'isInEditor' in safeNode ? safeNode.isInEditor : false
  
  // Tentar obter node do Craft.js PRIMEIRO
  let nodeActions: { setProp: (callback: (props: any) => void) => void } | null = null
  let currentImageUrl: string | undefined = src
  let hasCraftContext = false

  try {
    const node = useNode((node) => ({
      imageUrl: node.data.props[imageProp] || src || '',
    }))
    const fullNode = useNode()
    nodeActions = fullNode.actions
    currentImageUrl = node.imageUrl || src
    hasCraftContext = true
  } catch (e) {
    // Não está no contexto do Craft.js - usar src diretamente
    currentImageUrl = src
    hasCraftContext = false
  }
  
  // Verificar se está no editor - usar múltiplas verificações
  const [isInEditorMode, setIsInEditorMode] = React.useState(false)
  
  React.useEffect(() => {
    // Verificar se está no editor
    if (typeof window === 'undefined') {
      setIsInEditorMode(false) // SSR nunca está no editor
      return
    }
    
    const urlParams = new URLSearchParams(window.location.search)
    const isEditable = urlParams.get('editable') === 'true'
    const isInIframe = window.self !== window.top
    const pathname = window.location.pathname
    const isPreviewPage = pathname === '/preview'
    
    // Está no editor APENAS se TODAS as condições forem atendidas:
    // 1. Está na página /preview
    // 2. Tem editable=true na URL
    // 3. Está em iframe (dentro do editor)
    // 4. Tem contexto do Craft.js (hasCraftContext)
    // Isso garante que os botões NÃO apareçam na loja pública
    const shouldBeInEditor = isPreviewPage && isEditable && isInIframe && hasCraftContext
    
    setIsInEditorMode(shouldBeInEditor)
    
    console.log('[EditableImage] Verificação do editor:', {
      isPreviewPage,
      isEditable,
      isInIframe,
      hasCraftContext,
      shouldBeInEditor,
      pathname
    })
  }, [hasCraftContext])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const { uploadImage, isUploading } = useImageUpload()
  const [localImageUrl, setLocalImageUrl] = useState<string | undefined>(currentImageUrl)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  // Só mostrar botão se estiver no modo editor E montado
  const shouldShowButton = isInEditorMode && mounted
  
  // Debug: verificar estado do editor
  React.useEffect(() => {
    console.log('[EditableImage] Estado do editor:', {
      isInEditor,
      hasCraftContext,
      isInEditorMode,
      mounted,
      shouldShowButton
    });
  }, [isInEditor, hasCraftContext, isInEditorMode, mounted, shouldShowButton]);

  // Atualizar URL local quando src mudar
  React.useEffect(() => {
    setLocalImageUrl(currentImageUrl)
  }, [currentImageUrl])

  // Verificar se está montado para usar createPortal
  useEffect(() => {
    setMounted(true)
    console.log('[EditableImage] Componente montado')
  }, [])
  
  // Debug: verificar quando modal abre/fecha
  useEffect(() => {
    console.log('[EditableImage] Estado do modal:', { isModalOpen, mounted })
  }, [isModalOpen, mounted])

  // Função para lidar com upload de imagem
  const handleFileSelect = async (file: File) => {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF).')
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB. Por favor, escolha uma imagem menor.')
      return
    }

    // Criar preview local enquanto faz upload
    const reader = new FileReader()
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string
      setLocalImageUrl(previewUrl)
      
      // Atualizar no Craft.js se disponível e imageProp fornecido
      if (nodeActions && imageProp) {
        nodeActions.setProp((props: any) => {
          props[imageProp] = previewUrl
        })
      }
      
      // Chamar callback se fornecido
      onImageChange?.(previewUrl)
    }
    reader.readAsDataURL(file)

    // Fazer upload para R2
    try {
      const uploadedUrl = await uploadImage(file)
      setLocalImageUrl(uploadedUrl)
      
      // Atualizar no Craft.js se disponível e imageProp fornecido
      if (nodeActions && imageProp) {
        nodeActions.setProp((props: any) => {
          props[imageProp] = uploadedUrl
        })
      }
      
      // Chamar callback se fornecido
      onImageChange?.(uploadedUrl)
      
      // Fechar modal após upload bem-sucedido
      setIsModalOpen(false)
    } catch (error: any) {
      // Se falhar, manter preview temporário mas mostrar erro
      alert(error.message || 'Erro ao fazer upload da imagem. Tente novamente.')
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  // Posições do botão
  const buttonPositions = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2',
  }

  const buttonClass = buttonPositions[buttonPosition]

  // Separar style de imgProps para evitar conflito
  const { style: imgStyle, ...restImgProps } = imgProps

  return (
    <div className="relative w-full h-full" style={style}>
      <img
        src={localImageUrl}
        className={className}
        style={{ width: '100%', height: '100%', ...imgStyle }}
        {...restImgProps}
      />
      
      {/* Botão de upload - apenas no editor (iframe com editable=true) */}
      {shouldShowButton && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            data-modal-button="true"
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation()
              } else if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
                e.nativeEvent.stopImmediatePropagation()
              }
              console.log('[EditableImage] Botão de alterar imagem clicado', { 
                isModalOpen, 
                mounted, 
                shouldShowButton,
                isInEditorMode 
              })
              setIsModalOpen(true)
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation()
              } else if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
                e.nativeEvent.stopImmediatePropagation()
              }
            }}
            onPointerDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            disabled={isUploading}
            className={`${buttonClass} absolute w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ 
              pointerEvents: 'auto', 
              cursor: 'pointer',
              zIndex: 99999,
              position: 'absolute'
            }}
            title="Alterar imagem"
            aria-label="Alterar imagem"
          >
            <ImagePlus 
              className="w-5 h-5 text-gray-700 group-hover/btn:text-primary transition-colors pointer-events-none" 
              style={{ pointerEvents: 'none' }}
            />
          </button>
        </>
      )}

      {/* Modal para editar imagem */}
      {isModalOpen && mounted && typeof document !== 'undefined' && createPortal(
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation()
              console.log('[EditableImage] Overlay clicado, fechando modal')
              setIsModalOpen(false)
            }}
            style={{ pointerEvents: 'auto' }}
          />
          {/* Modal */}
          <div
            ref={modalRef}
            className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Alterar Imagem</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Selecione uma nova imagem para substituir a atual
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setIsModalOpen(false)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div
                className={`
                  relative rounded-xl border-2 border-dashed transition-colors
                  ${isDragging
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }
                  ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />

                {localImageUrl ? (
                  <div className="relative w-full overflow-hidden rounded-xl aspect-video">
                    <img src={localImageUrl} alt="Preview" className="h-full w-full object-cover" />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    {isUploading ? (
                      <>
                        <Loader2 className="mb-4 h-12 w-12 animate-spin text-gray-400" />
                        <p className="text-sm font-medium text-gray-600">Enviando...</p>
                      </>
                    ) : (
                      <>
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="mb-2 text-sm font-medium text-gray-900">
                          Clique ou arraste uma imagem
                        </p>
                        <p className="mb-4 text-xs text-gray-500">
                          PNG, JPG ou GIF até 5MB
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            fileInputRef.current?.click()
                          }}
                          disabled={isUploading}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Upload className="h-4 w-4" />
                          Selecionar imagem
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setIsModalOpen(false)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                data-modal-button="true"
              >
                Cancelar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setIsModalOpen(false)
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
                data-modal-button="true"
              >
                OK
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

