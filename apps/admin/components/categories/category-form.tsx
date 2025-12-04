'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@white-label/ui'
import { CATEGORY_ICONS, getIconComponent } from '@/lib/constants/category-icons'
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/lib/hooks/use-categories'

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').min(3, 'Nome deve ter pelo menos 3 caracteres'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens')
    .optional()
    .or(z.literal('')),
  icon: z.string().optional().or(z.literal(''))
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
      slug: category?.slug || '',
      icon: category?.icon || ''
    }
  })
  
  const selectedIcon = watch('icon')

  const nameValue = watch('name')

  // Atualizar valores do formulário quando a categoria for carregada
  useEffect(() => {
    if (category) {
      setValue('name', category.name || '')
      setValue('slug', category.slug || '')
      setValue('icon', category.icon || '')
    }
  }, [category, setValue])

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
      ...(data.slug && { slug: data.slug }),
      // Sempre enviar icon quando definido (mesmo se string vazia, será tratado como undefined)
      ...(data.icon !== undefined && { icon: data.icon || undefined })
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

      <div>
        <Label htmlFor="icon">Ícone</Label>
        <div className="mt-2 grid grid-cols-6 gap-3">
          {CATEGORY_ICONS.map((icon) => {
            const IconComponent = icon.component
            const isSelected = selectedIcon === icon.value
            return (
              <button
                key={icon.value}
                type="button"
                onClick={() => setValue('icon', isSelected ? '' : icon.value)}
                className={`p-3 border-2 rounded-lg transition-all hover:border-[#7c3aed] ${
                  isSelected
                    ? 'border-[#7c3aed] bg-[#7c3aed]/10'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                title={icon.name}
              >
                <IconComponent className={`w-6 h-6 mx-auto ${isSelected ? 'text-[#7c3aed]' : 'text-gray-600'}`} />
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Selecione um ícone para representar esta categoria (opcional)
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

