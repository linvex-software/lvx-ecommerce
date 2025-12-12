'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Button } from '@white-label/ui'
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/lib/hooks/use-categories'
import { useCategories } from '@/lib/hooks/use-categories'
import { CATEGORY_ICONS, getIconComponent } from '@/lib/constants/category-icons'

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').min(3, 'Nome deve ter pelo menos 3 caracteres'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens')
    .optional()
    .or(z.literal('')),
  parent_id: z.string().uuid().nullable().optional(),
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
  // Buscar todas as categorias para o seletor (máximo 100 permitido pela API)
  const { data: categoriesData } = useCategories({ limit: 100 })

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
      parent_id: category?.parent_id || null,
      icon: category?.icon || ''
    }
  })

    const selectedIcon = watch('icon')
  // Filtrar categorias disponíveis para parent (excluir a própria categoria e suas descendentes)
  const availableParents = useMemo(() => {
    if (!categoriesData?.categories) return []

    if (!category) {
      // Criação: todas as categorias podem ser parent
      return categoriesData.categories
    }

    // Edição: excluir a própria categoria e suas descendentes
    const excludeIds = new Set([category.id])

    const findDescendants = (parentId: string) => {
      categoriesData.categories
        .filter((cat) => cat.parent_id === parentId)
        .forEach((child) => {
          excludeIds.add(child.id)
          findDescendants(child.id)
        })
    }

    findDescendants(category.id)

    return categoriesData.categories.filter((cat) => !excludeIds.has(cat.id))
  }, [categoriesData?.categories, category])

  // Construir hierarquia visual para o select
  // Inclui todas as categorias de availableParents organizadas hierarquicamente
  const buildParentOptions = (categories: Category[]): Array<{ id: string; name: string; level: number }> => {
    if (!categories || categories.length === 0) return []

    // Criar mapa para lookup rápido
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]))

    // Função recursiva para construir árvore começando pelas raízes
    const buildTree = (parentId: string | null, level: number): Array<{ id: string; name: string; level: number }> => {
      const options: Array<{ id: string; name: string; level: number }> = []

      // Buscar todas as categorias que têm este parent_id E estão em availableParents
      const children = categories.filter((cat) => cat.parent_id === parentId)

      children.forEach((cat) => {
        options.push({ id: cat.id, name: cat.name, level })
        // Recursivamente adicionar subcategorias desta categoria
        options.push(...buildTree(cat.id, level + 1))
      })

      return options
    }

    // Começar pelas categorias raiz (parent_id === null)
    const rootCategories = categories.filter((cat) => !cat.parent_id)
    const result: Array<{ id: string; name: string; level: number }> = []

    rootCategories.forEach((root) => {
      result.push({ id: root.id, name: root.name, level: 0 })
      result.push(...buildTree(root.id, 1))
    })

    // Incluir categorias órfãs (têm parent_id, mas o parent não está em availableParents)
    // Essas devem aparecer como raiz também
    const orphanCategories = categories.filter((cat) => {
      if (!cat.parent_id) return false // Já foi incluída acima
      const parent = categoryMap.get(cat.parent_id)
      return !parent // Parent não existe em availableParents
    })

    orphanCategories.forEach((orphan) => {
      if (!result.some(opt => opt.id === orphan.id)) {
        result.push({ id: orphan.id, name: orphan.name, level: 0 })
        // Também incluir subcategorias da órfã
        result.push(...buildTree(orphan.id, 1))
      }
    })

    return result
  }

  const parentOptions = useMemo(() => {
    if (!availableParents || availableParents.length === 0) return []
    return buildParentOptions(availableParents)
  }, [availableParents])

  // Incluir categoria pai atual nas opções se ela não estiver disponível (pode ter sido filtrada)
  const allParentOptions = useMemo(() => {
    if (!category?.parent_id) return parentOptions

    // Verificar se o parent_id atual está nas opções
    const currentParentExists = parentOptions.some(opt => opt.id === category.parent_id)

    if (!currentParentExists && categoriesData?.categories) {
      // Buscar a categoria pai atual
      const currentParent = categoriesData.categories.find(cat => cat.id === category.parent_id)
      if (currentParent) {
        // Adicionar no início da lista
        return [{ id: currentParent.id, name: currentParent.name, level: 0 }, ...parentOptions]
      }
    }

    return parentOptions
  }, [parentOptions, category?.parent_id, categoriesData?.categories])

  const nameValue = watch('name')
  const slugValue = watch('slug')
  const parentIdValue = watch('parent_id')

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

  // Buscar nome da categoria pai selecionada para preview
  const selectedParentName = useMemo(() => {
    if (!parentIdValue || !categoriesData?.categories) return null
    const parent = categoriesData.categories.find(cat => cat.id === parentIdValue)
    return parent?.name || null
  }, [parentIdValue, categoriesData?.categories])

  const handleFormSubmit = async (data: CategoryFormData) => {
    const submitData: CreateCategoryInput | UpdateCategoryInput = {
      name: data.name,
      ...(data.slug && { slug: data.slug }),
      parent_id: data.parent_id || null
    }
    await onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-1">
        <div>
          <Label htmlFor="name" className="dark:text-[#CCCCCC]">Nome da categoria *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Ex: Roupas, Eletrônicos..."
            className={`${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''} dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:placeholder:text-[#777777] dark:hover:border-[#3A3A3A]`}
            disabled={isLoading}
            maxLength={100}
          />
          {errors.name && (
            <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">{errors.name.message}</p>
          )}
          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-[#B5B5B5]">
              Nome exibido para os clientes
            </p>
            <p className="text-xs text-gray-400 dark:text-[#777777]">
              {nameValue?.length || 0}/100
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="parent_id" className="dark:text-[#CCCCCC]">Categoria pai</Label>
            {selectedParentName && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300">
                Subcategoria de: {selectedParentName}
              </span>
            )}
            {!parentIdValue && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-[#111111] dark:text-[#CCCCCC]">
                Categoria raiz
              </span>
            )}
          </div>
          <Select
            id="parent_id"
            {...register('parent_id', {
              setValueAs: (value) => value === '' ? null : value
            })}
            className={`${errors.parent_id ? 'border-red-500 focus-visible:ring-red-500' : ''} dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:hover:border-[#3A3A3A]`}
            disabled={isLoading || !categoriesData?.categories || categoriesData.categories.length === 0}
          >
            <option value="">Nenhuma (categoria raiz)</option>
            {!categoriesData?.categories || categoriesData.categories.length === 0 ? (
              <option value="" disabled>
                Carregando categorias...
              </option>
            ) : allParentOptions.length === 0 ? (
              <option value="" disabled>
                Nenhuma categoria disponível como pai
              </option>
            ) : (
              allParentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {'  '.repeat(option.level)}
                  {option.level > 0 && '└ '}
                  {option.name}
                </option>
              ))
            )}
          </Select>
          {errors.parent_id && (
            <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">{errors.parent_id.message}</p>
          )}
          <p className="mt-1.5 text-xs text-gray-500 dark:text-[#B5B5B5]">
            {category
              ? 'Altere a categoria pai para reorganizar a hierarquia (opcional)'
              : 'Selecione uma categoria pai para criar uma subcategoria (opcional)'}
            {allParentOptions.length === 0 && categoriesData?.categories && categoriesData.categories.length > 0 && (
              <span className="block mt-1 text-amber-600 dark:text-amber-400">
                Nota: A categoria atual e suas subcategorias não podem ser selecionadas como pai
              </span>
            )}
          </p>
        </div>

        <div>
          <Label htmlFor="slug" className="dark:text-[#CCCCCC]">Slug</Label>
          <Input
            id="slug"
            {...register('slug')}
            placeholder="Ex: roupas, eletronicos..."
            className={`${errors.slug ? 'border-red-500 focus-visible:ring-red-500' : ''} dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:placeholder:text-[#777777] dark:hover:border-[#3A3A3A]`}
            disabled={(autoGenerateSlug && !category) || isLoading}
            pattern="[a-z0-9-]+"
          />
          {errors.slug && (
            <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">{errors.slug.message}</p>
          )}
          {slugValue && !errors.slug && (
            <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 dark:border-blue-900/50 dark:bg-blue-900/20">
              <p className="text-xs font-medium text-blue-900 mb-1 dark:text-blue-300">Preview da URL:</p>
              <code className="text-xs text-blue-700 break-all dark:text-blue-400">
                /categorias/{slugValue}
              </code>
            </div>
          )}
          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-[#B5B5B5]">
              URL amigável para a categoria (opcional, será gerado automaticamente se não informado)
            </p>
            {slugValue && (
              <p className={`text-xs ${errors.slug ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-[#777777]'}`}>
                {slugValue.length} caracteres
              </p>
            )}
          </div>
          {!category && (
            <label className="mt-2 flex items-center gap-2 text-sm text-gray-600 cursor-pointer dark:text-[#CCCCCC]">
              <input
                type="checkbox"
                checked={autoGenerateSlug}
                onChange={(e) => setAutoGenerateSlug(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer dark:border-[#2A2A2A] dark:bg-[#111111]"
                disabled={isLoading}
              />
              Auto-gerar slug a partir do nome
            </label>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Salvando...
            </>
          ) : category ? (
            'Atualizar categoria'
          ) : (
            'Criar categoria'
          )}
        </Button>
      </div>
    </form>
  )
}

