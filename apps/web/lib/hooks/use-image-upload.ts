import { useState } from 'react'
import { fetchAPI } from '../api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

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

      // Usar fetch diretamente para FormData (fetchAPI não suporta FormData bem)
      const accessToken = typeof window !== 'undefined' 
        ? (() => {
            try {
              const authStorage = localStorage.getItem('auth-storage')
              if (!authStorage) return null
              const parsed = JSON.parse(authStorage)
              return parsed?.state?.accessToken || null
            } catch {
              return null
            }
          })()
        : null

      const headers: Record<string, string> = {}
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const storeId = process.env.NEXT_PUBLIC_STORE_ID
      if (storeId) {
        headers['x-store-id'] = storeId
      }

      // Não definir Content-Type para FormData - o browser define automaticamente com boundary
      const response = await fetch(`${API_URL}/admin/upload/image`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      })

      if (!response.ok) {
        let errorMessage = 'Erro ao fazer upload da imagem'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (data.success && data.url) {
        return data.url
      }

      throw new Error('Resposta inválida do servidor')
    } catch (error: any) {
      console.error('[useImageUpload] Erro ao fazer upload:', error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  return {
    uploadImage,
    isUploading
  }
}

