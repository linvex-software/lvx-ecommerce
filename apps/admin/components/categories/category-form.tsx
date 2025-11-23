'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@white-label/ui'
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/lib/hooks/use-categories'

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').min(3, 'Nome deve ter pelo menos 3 caracteres'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens')
    .optional()
    .or(z.literal(''))
})

type CategoryFormData = z.infer<typeof categorySchema>

interface CategoryFormProps {
  category?: Category | null
  onSubmit: (data: CreateCategoryInput | UpdateCategoryInput) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function CategoryForm({ category, onSubmit, onCancel, isLoading = false }: CategoryFormProps) {
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      slug: category?.slug || ''
    }
  })

  const nameValue = watch('name')

  // Auto-gerar slug quando nome mudar
  useEffect(() => {
    if (autoGenerateSlug && nameValue && !category) {
      const slug = nameValue
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setValue('slug', slug)
    }
  }, [nameValue, autoGenerateSlug, category, setValue])

  const handleFormSubmit = async (data: CategoryFormData) => {
    const submitData: CreateCategoryInput | UpdateCategoryInput = {
      name: data.name,
      ...(data.slug && { slug: data.slug })
    }
    await onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Ex: Roupas, Eletrônicos..."
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          {...register('slug')}
          placeholder="Ex: roupas, eletronicos..."
          className={errors.slug ? 'border-red-500' : ''}
          disabled={autoGenerateSlug && !category}
        />
        {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug.message}</p>}
        <p className="mt-1 text-xs text-gray-500">
          URL amigável para a categoria (opcional, será gerado automaticamente se não informado)
        </p>
      </div>

      <div className="flex items-center justify-between pt-4">
        {!category && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoGenerateSlug}
              onChange={(e) => setAutoGenerateSlug(e.target.checked)}
              className="rounded border-gray-300"
            />
            Auto-gerar slug
          </label>
        )}
        <div className="flex gap-3 ml-auto">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : category ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </div>
    </form>
  )
}

