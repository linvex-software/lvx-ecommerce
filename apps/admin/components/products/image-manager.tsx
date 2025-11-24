'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, MoveUp, MoveDown, Upload } from 'lucide-react'
import { Button } from '@white-label/ui'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem')
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB')
      return
    }

    // Converter para data URL (base64)
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      const maxPosition = images.length > 0 ? Math.max(...images.map((img) => img.position || 0)) : -1
      onChange([
        ...images,
        {
          image_url: imageUrl,
          position: maxPosition + 1,
          is_main: images.length === 0
        }
      ])
    }
    reader.readAsDataURL(file)

    // Resetar o input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAddImageClick = () => {
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
    <Card className="rounded-2xl border-gray-100 shadow-sm">
      <CardHeader>
        <div>
          <CardTitle className="text-xl font-light">Imagens</CardTitle>
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
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="text-sm text-gray-500">Nenhuma imagem adicionada</p>
            <p className="mt-1 text-xs text-gray-400">
              Selecione imagens para o produto
            </p>
            <div className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={handleAddImageClick} className="gap-2">
                <Upload className="h-4 w-4" />
                Selecionar imagem
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Imagem #{index + 1}
                    </span>
                    {image.is_main && (
                      <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
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
                      <div className="rounded-lg border border-gray-200 bg-white p-2">
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
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (!file) return

                            if (!file.type.startsWith('image/')) {
                              alert('Por favor, selecione apenas arquivos de imagem')
                              return
                            }

                            if (file.size > 5 * 1024 * 1024) {
                              alert('A imagem deve ter no máximo 5MB')
                              return
                            }

                            const reader = new FileReader()
                            reader.onload = (event) => {
                              const newUrl = event.target?.result as string
                              updateImage(index, 'image_url', newUrl)
                            }
                            reader.readAsDataURL(file)
                          }
                          input.click()
                        }}
                        className="w-full gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Trocar imagem
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                      <p className="mb-4 text-sm text-gray-500">Nenhuma imagem selecionada</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (!file) return

                            if (!file.type.startsWith('image/')) {
                              alert('Por favor, selecione apenas arquivos de imagem')
                              return
                            }

                            if (file.size > 5 * 1024 * 1024) {
                              alert('A imagem deve ter no máximo 5MB')
                              return
                            }

                            const reader = new FileReader()
                            reader.onload = (event) => {
                              const newUrl = event.target?.result as string
                              updateImage(index, 'image_url', newUrl)
                            }
                            reader.readAsDataURL(file)
                          }
                          input.click()
                        }}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Selecionar imagem
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`image-main-${index}`}
                      checked={image.is_main || false}
                      onChange={(e) => updateImage(index, 'is_main', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <Label htmlFor={`image-main-${index}`} className="cursor-pointer text-sm font-normal">
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

