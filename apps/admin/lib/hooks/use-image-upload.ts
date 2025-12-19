import { useState } from 'react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false)

  const uploadImage = async (file: File): Promise<string> => {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      throw new Error('Arquivo deve ser uma imagem (JPG, PNG, GIF, etc.)')
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Tamanho máximo: 5MB')
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await apiClient.post<{ success: boolean; url: string }>(
        '/admin/upload/image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.data.success && response.data.url) {
        return response.data.url
      }

      throw new Error('Resposta inválida do servidor')
    } catch (error: any) {
      console.error('[useImageUpload] Erro ao fazer upload:', error)

      // Extrair mensagem de erro
      let errorMessage = 'Erro ao fazer upload da imagem'

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error('Erro ao fazer upload', {
        description: errorMessage
      })

      throw new Error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  return {
    uploadImage,
    isUploading
  }
}

