'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'
import { Button } from '@white-label/ui'
import { Plus, FileText, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface DynamicPage {
  id: string
  title: string
  slug: string
  published: boolean
  createdAt: string
  updatedAt: string
}

export default function PagesListPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [pages, setPages] = useState<DynamicPage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadPages = async () => {
      if (!user?.storeId) return

      try {
        setIsLoading(true)
        const response = await apiClient.get<{ pages: DynamicPage[] }>('/admin/dynamic-pages')
        setPages(response.data.pages || [])
      } catch (error) {
        console.error('Erro ao carregar páginas:', error)
        toast.error('Erro ao carregar páginas')
      } finally {
        setIsLoading(false)
      }
    }

    loadPages()
  }, [user?.storeId])

  const handleDelete = async (pageId: string, title: string) => {
    if (!confirm(`Tem certeza que deseja deletar a página "${title}"?`)) return

    try {
      await apiClient.delete(`/admin/dynamic-pages/${pageId}`)
      toast.success('Página deletada com sucesso')
      setPages(pages.filter(p => p.id !== pageId))
    } catch (error) {
      console.error('Erro ao deletar página:', error)
      toast.error('Erro ao deletar página')
    }
  }

  const handleTogglePublish = async (page: DynamicPage) => {
    try {
      await apiClient.put(`/admin/dynamic-pages/${page.id}`, {
        published: !page.published
      })
      toast.success(`Página ${!page.published ? 'publicada' : 'despublicada'}`)
      setPages(pages.map(p => 
        p.id === page.id ? { ...p, published: !p.published } : p
      ))
    } catch (error) {
      console.error('Erro ao atualizar publicação:', error)
      toast.error('Erro ao atualizar publicação')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Carregando páginas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Páginas Dinâmicas</h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie suas páginas customizadas</p>
          </div>
          <Button
            onClick={() => router.push('/editor/pages/new')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Página
          </Button>
        </div>

        {pages.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma página criada</h3>
            <p className="text-sm text-gray-500 mb-6">
              Comece criando sua primeira página dinâmica
            </p>
            <Button
              onClick={() => router.push('/editor/pages/new')}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Criar Primeira Página
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Atualizada
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{page.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">/{page.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          page.published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {page.published ? 'Publicada' : 'Rascunho'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(page.updatedAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTogglePublish(page)}
                          className="text-gray-400 hover:text-gray-600"
                          title={page.published ? 'Despublicar' : 'Publicar'}
                        >
                          {page.published ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => router.push(`/editor/pages/${page.slug}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(page.id, page.title)}
                          className="text-red-600 hover:text-red-900"
                          title="Deletar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}



