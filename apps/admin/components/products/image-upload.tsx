'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@white-label/ui'
import { cn } from '@white-label/ui'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas imagens')
      return
    }

    setIsUploading(true)

    try {
      // Por enquanto, criar uma URL local para preview
      // Em produção, fazer upload para S3/R2 e obter URL
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        onChange(result)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      // Erro ao processar imagem
      setIsUploading(false)
      alert('Erro ao processar a imagem. Tente novamente.')
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

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 border-dashed transition-colors',
        isDragging
          ? 'border-gray-400 bg-gray-50'
          : 'border-gray-200 bg-white hover:border-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
        }}
      />

      {value ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-xl">
          <img src={value} alt="Preview" className="h-full w-full object-cover" />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-lg transition-colors hover:bg-white"
            >
              <X className="h-4 w-4 text-gray-700" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          {isUploading ? (
            <>
              <div className="mb-4 h-12 w-12 animate-pulse rounded-full bg-gray-200" />
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
                PNG, JPG ou GIF até 10MB
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleClick}
                disabled={disabled}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Selecionar imagem
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

