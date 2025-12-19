'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, MoveUp, MoveDown, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@white-label/ui'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useImageUpload } from '@/lib/hooks/use-image-upload'

export interface ProductImage {
  image_url: string
  position?: number
  is_main?: boolean
}

interface ImageManagerProps {
  images: ProductImage[]
  onChange: (images: ProductImage[]) => void
}

export function ImageManager({ images, onChange }: ImageManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadImage, isUploading } = useImageUpload()
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const validateImageFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo inválido', {
        description: 'Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF).'
      })
      return false
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande', {
        description: 'A imagem deve ter no máximo 5MB. Por favor, escolha uma imagem menor.'
      })
      return false
    }

    return true
  }

  const processImageFile = async (file: File, callback: (imageUrl: string) => void, index?: number) => {
    if (!validateImageFile(file)) {
      return
    }

    // Se for atualização de imagem existente, mostrar loading
    if (index !== undefined) {
      setUploadingIndex(index)
    }

    // Criar preview local enquanto faz upload (apenas para nova imagem)
    let previewUrl: string | null = null
    if (index === undefined) {
      const reader = new FileReader()
      reader.onload = (event) => {
        previewUrl = event.target?.result as string
        // Adicionar com preview temporário
        const maxPosition = images.length > 0 ? Math.max(...images.map((img) => img.position || 0)) : -1
        onChange([
          ...images,
          {
            image_url: previewUrl,
            position: maxPosition + 1,
            is_main: images.length === 0
          }
        ])
      }
      reader.readAsDataURL(file)
    }

    // Fazer upload para R2
    try {
      const uploadedUrl = await uploadImage(file)

      // Atualizar com URL real do R2
      if (index !== undefined) {
        // Atualizar imagem existente
        const updated = [...images]
        updated[index] = {
          ...updated[index],
          image_url: uploadedUrl
        }
        onChange(updated)
      } else {
        // Substituir preview temporário pela URL real
        // Usar o estado atual de images diretamente
        const previewIndex = images.findIndex((img) => img.image_url === previewUrl)
        const maxPosition = images.length > 0 ? Math.max(...images.map((img) => img.position || 0)) : -1

        let newImages: ProductImage[]
        if (previewIndex >= 0) {
          // Substituir preview
          newImages = [...images]
          newImages[previewIndex] = {
            image_url: uploadedUrl,
            position: maxPosition,
            is_main: images.length === 1 // Se for a primeira imagem
          }
        } else {
          // Se não encontrou preview, adicionar nova
          newImages = [
            ...images,
            {
              image_url: uploadedUrl,
              position: maxPosition + 1,
              is_main: images.length === 0
            }
          ]
        }
        onChange(newImages)
      }

      callback(uploadedUrl)
    } catch (error) {
      // Se falhar o upload, remover preview temporário se for nova imagem
      if (index === undefined && previewUrl) {
        const newImages = images.filter((img) => img.image_url !== previewUrl)
        onChange(newImages)
      }
      // Erro já foi tratado no hook
    } finally {
      if (index !== undefined) {
        setUploadingIndex(null)
      }
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    event.stopPropagation()
    
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await processImageFile(file, () => {
        // Upload concluído
      })
    } catch (error) {
      // Erro já foi tratado no processImageFile e no hook
      // Apenas garantir que não propague
      console.error('[ImageManager] Erro ao processar arquivo:', error)
    } finally {
      // Resetar o input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleAddImageClick = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    fileInputRef.current?.click()
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    // Se removemos a imagem principal, definir a primeira como principal
    if (images[index]?.is_main && newImages.length > 0) {
      newImages[0].is_main = true
    }
    onChange(newImages)
  }

  const updateImage = (index: number, field: keyof ProductImage, value: string | number | boolean) => {
    const updated = [...images]
    updated[index] = {
      ...updated[index],
      [field]: value
    }
    // Se marcou como principal, desmarcar outras
    if (field === 'is_main' && value === true) {
      updated.forEach((img, i) => {
        if (i !== index) img.is_main = false
      })
    }
    onChange(updated)
  }

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= newImages.length) return

    const temp = newImages[index]
    newImages[index] = newImages[newIndex]
    newImages[newIndex] = temp

    // Atualizar posições
    newImages.forEach((img, i) => {
      img.position = i
    })

    onChange(newImages)
  }

  return (
    <Card className="dark:bg-surface-2">
      <CardHeader>
        <div>
          <CardTitle className="text-xl font-semibold">Imagens</CardTitle>
          <CardDescription>Gerencie as imagens do produto</CardDescription>
        </div>
      </CardHeader>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <CardContent>
        {images.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center dark:border-[#2A2A2A]">
            <p className="text-sm text-text-secondary">Nenhuma imagem adicionada</p>
            <p className="mt-1 text-xs text-text-tertiary">
              Selecione imagens para o produto
            </p>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddImageClick}
                disabled={isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Selecionar imagem
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-surface p-4 dark:bg-surface-2 dark:border-[#2A2A2A]"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      Imagem #{index + 1}
                    </span>
                    {image.is_main && (
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:bg-primary/20">
                        Principal
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => moveImage(index, 'up')}
                      disabled={index === 0}
                      className="h-8 w-8 p-0"
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => moveImage(index, 'down')}
                      disabled={index === images.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeImage(index)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {image.image_url ? (
                    <>
                      <div className="rounded-lg border border-border bg-background p-2 dark:bg-[#050505] dark:border-[#2A2A2A]">
                        <img
                          src={image.image_url}
                          alt={`Preview ${index + 1}`}
                          className="h-48 w-full object-contain"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.onchange = async (event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            const file = (event.target as HTMLInputElement).files?.[0]
                            if (!file) return

                            try {
                              await processImageFile(file, (imageUrl) => {
                                updateImage(index, 'image_url', imageUrl)
                              }, index)
                            } catch (error) {
                              console.error('[ImageManager] Erro ao processar arquivo:', error)
                            }
                          }
                          input.click()
                        }}
                        disabled={isUploading && uploadingIndex === index}
                        className="w-full gap-2"
                      >
                        {isUploading && uploadingIndex === index ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Trocar imagem
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center dark:border-[#2A2A2A]">
                      <p className="mb-4 text-sm text-text-secondary">Nenhuma imagem selecionada</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.onchange = async (event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            const file = (event.target as HTMLInputElement).files?.[0]
                            if (!file) return

                            try {
                              await processImageFile(file, (imageUrl) => {
                                updateImage(index, 'image_url', imageUrl)
                              }, index)
                            } catch (error) {
                              console.error('[ImageManager] Erro ao processar arquivo:', error)
                            }
                          }
                          input.click()
                        }}
                        disabled={isUploading && uploadingIndex === index}
                        className="gap-2"
                      >
                        {isUploading && uploadingIndex === index ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Selecionar imagem
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`image-main-${index}`}
                      checked={image.is_main || false}
                      onChange={(e) => updateImage(index, 'is_main', e.target.checked)}
                      className="h-4 w-4 rounded border-input-border text-primary focus:ring-primary dark:border-[#2A2A2A]"
                    />
                    <Label htmlFor={`image-main-${index}`} className="cursor-pointer text-sm font-normal text-text-primary">
                      Definir como imagem principal
                    </Label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

