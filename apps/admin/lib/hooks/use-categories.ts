import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

export interface Category {
  id: string
  store_id: string
  parent_id: string | null
  name: string
  slug: string
  created_at: string,
  icon?: string | null
}

export interface CategoryListFilters {
  q?: string
  page?: number
  limit?: number
}

export interface CategoryListResult {
  categories: Category[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateCategoryInput {
  name: string
  slug?: string
  parent_id?: string | null,
  icon?: string
}

export interface UpdateCategoryInput {
  name?: string
  slug?: string
  parent_id?: string | null,
  icon?: string
}

export function useCategories(filters?: CategoryListFilters) {
  return useQuery({
    queryKey: ['categories', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.q) params.append('q', filters.q)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())

      const response = await apiClient.get<CategoryListResult>(
        `/admin/categories?${params.toString()}`
      )
      return response.data
    }
  })
}

export function useCategory(id: string | null) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      if (!id) return null
      const response = await apiClient.get<{ category: Category }>(`/admin/categories/${id}`)
      return response.data.category
    },
    enabled: !!id
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCategoryInput) => {
      const response = await apiClient.post<{ category: Category }>('/admin/categories', data)
      return response.data.category
    },
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoria criada com sucesso!', {
        description: `${category.name} foi adicionada ao catálogo.`
      })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Erro ao criar categoria'
      toast.error('Erro ao criar categoria', {
        description: message
      })
    }
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateCategoryInput & { id: string }) => {
      const response = await apiClient.put<{ category: Category }>(
        `/admin/categories/${id}`,
        data
      )
      return response.data.category
    },
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['category', category.id] })
      toast.success('Categoria atualizada com sucesso!', {
        description: `As alterações em ${category.name} foram salvas.`
      })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Erro ao atualizar categoria'
      toast.error('Erro ao atualizar categoria', {
        description: message
      })
    }
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/categories/${id}`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoria excluída com sucesso!', {
        description: 'A categoria foi removida do catálogo.'
      })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Erro ao excluir categoria'
      toast.error('Erro ao excluir categoria', {
        description: message
      })
    }
  })
}
 