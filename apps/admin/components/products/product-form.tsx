'use client'

import { useState } from 'react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@white-label/ui'
import { ImageManager, type ProductImage } from './image-manager'
import { CategorySelector } from './category-selector'
import { VariantManager, type ProductVariant } from './variant-manager'
import { SEOForm, type ProductSEO } from './seo-form'
import { SizeChartForm, type SizeChartData } from './size-chart-form'
import type { Product } from '@/lib/hooks/use-products'
import { isClothingProduct, generateDefaultSizeChart } from '@/lib/utils/product-detection'
import { useCategories } from '@/lib/hooks/use-categories'

// Função para formatar dígitos para moeda BR (123456 -> "R$ 1.234,56")
function formatCurrencyFromDigits(digits: string): string {
  if (!digits || digits === '') {
    return 'R$ 0,00'
  }
  const int = parseInt(digits, 10) || 0
  const cents = int / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents)
}

// Função para converter dígitos para número (123456 -> 1234.56)
function digitsToNumber(digits: string): number {
  if (!digits || digits === '') {
    return 0
  }
  const int = parseInt(digits, 10) || 0
  return int / 100
}

// Função para converter número para dígitos (1234.56 -> "123456")
function numberToDigits(price: number): string {
  if (!price || price === 0) {
    return ''
  }
  return Math.round(price * 100).toString()
}

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').min(3, 'Nome deve ter pelo menos 3 caracteres'),
  slug: z
    .string()
    .optional()
    .transform((value) => {
      const v = value?.trim()
      return v === '' || !v ? undefined : v
    }),
  description: z.string().optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  priceDigits: z
    .string()
    .min(1, 'Preço é obrigatório')
    .refine(
      (digits) => {
        const int = parseInt(digits || '0', 10)
        return int > 0
      },
      { message: 'Preço deve ser maior que zero' }
    ),
  sku: z
    .string()
    .optional()
    .transform((value) => {
      const v = value?.trim() ?? ''
      return v === '' ? undefined : v
    }),
  status: z.enum(['draft', 'active', 'inactive']).default('draft'),
  variants: z
    .array(
      z.object({
        size: z.string().nullable().optional(),
        color: z.string().nullable().optional(),
        sku: z.string().nullable().optional(),
        barcode: z.string().nullable().optional(),
        price_override: z.number().nullable().optional(),
        active: z.boolean().optional()
      })
    )
    .optional(),
  images: z
    .array(
      z.object({
        image_url: z.string().url(),
        position: z.number().optional(),
        is_main: z.boolean().optional()
      })
    )
    .optional(),
  seo: z
    .object({
      meta_title: z.string().max(60).nullable().optional(),
      meta_description: z.string().max(160).nullable().optional(),
      meta_keywords: z.string().nullable().optional(),
      open_graph_image: z.string().url().nullable().optional()
    })
    .optional(),
  size_chart: z
    .object({
      name: z.string().min(1),
      chart_json: z.record(z.unknown())
    })
    .nullable()
    .optional()
})

export type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: Product | null
  onSubmit: (data: ProductFormData) => Promise<void>
  isLoading?: boolean
}

export function ProductForm({ product, onSubmit, isLoading = false }: ProductFormProps) {
  const { data: categoriesData } = useCategories()

  const initialVariants: ProductVariant[] = (product as any)?.variants?.map((v: any) => ({
    size: v.size || null,
    color: v.color || null,
    sku: v.sku || null,
    barcode: v.barcode || null,
    price_override: v.price_override ? parseFloat(v.price_override) : null,
    active: v.active !== false
  })) || []

  const initialImages: ProductImage[] =
    (product as any)?.images?.map((img: any) => ({
      image_url: img.image_url,
      position: img.position || 0,
      is_main: img.is_main || false
    })) || []

  const initialSEO: ProductSEO = (product as any)?.seo
    ? {
        meta_title: (product as any).seo.meta_title || null,
        meta_description: (product as any).seo.meta_description || null,
        meta_keywords: (product as any).seo.meta_keywords || null,
        open_graph_image: (product as any).seo.open_graph_image || null
      }
    : {
        meta_title: null,
        meta_description: null,
        meta_keywords: null,
        open_graph_image: null
      }

  const initialSizeChart: SizeChartData | null = (product as any)?.size_chart
    ? {
        name: (product as any).size_chart.name,
        chart_json: (product as any).size_chart.chart_json
      }
    : null

  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants)
  const [images, setImages] = useState<ProductImage[]>(initialImages)
  const [seo, setSeo] = useState<ProductSEO>(initialSEO)
  const [sizeChart, setSizeChart] = useState<SizeChartData | null>(initialSizeChart)
  const [autoSizeChartCreated, setAutoSizeChartCreated] = useState(false)
  const [priceDigits, setPriceDigits] = useState<string>(
    product ? numberToDigits(parseFloat(product.base_price.toString())) : ''
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          description: product.description || '',
          category_ids: (product as any).categories?.map((c: any) => c.id) || [],
          priceDigits: numberToDigits(parseFloat(product.base_price.toString()) || 0),
          sku: product.sku || '',
          status: product.status || 'draft',
          variants: initialVariants,
          images: initialImages,
          seo: initialSEO,
          size_chart: initialSizeChart
        }
      : {
          name: '',
          slug: '',
          description: '',
          category_ids: [],
          priceDigits: '',
          sku: '',
          status: 'draft',
          variants: [],
          images: [],
          seo: {
            meta_title: null,
            meta_description: null,
            meta_keywords: null,
            open_graph_image: null
          },
          size_chart: null
        }
  })

  // Sincronizar priceDigits quando produto é carregado
  React.useEffect(() => {
    if (product) {
      const price = parseFloat(product.base_price.toString())
      setPriceDigits(numberToDigits(price))
    }
  }, [product])


  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setValue('name', name)
    if (!product) {
      setValue('slug', generateSlug(name))

      // Se for produto novo e for roupa, criar size_chart padrão automaticamente
      if (name.trim().length > 0 && isClothingProduct(name, []) && !sizeChart) {
        const defaultSizeChart = generateDefaultSizeChart(name)
        setSizeChart(defaultSizeChart)
        setValue('size_chart', defaultSizeChart as any)
        setAutoSizeChartCreated(true)
      } else if (!isClothingProduct(name, [])) {
        // Se não for roupa, limpar o flag
        setAutoSizeChartCreated(false)
      }
    }
  }

  const handleFormSubmit = async (data: ProductFormData) => {
    // Converter dígitos para número antes de enviar
    const finalPrice = digitsToNumber((data as any).priceDigits || priceDigits)

    // Validar preço
    if (isNaN(finalPrice) || finalPrice <= 0) {
      throw new Error('Preço inválido. Informe um preço maior que zero.')
    }

    // Filtrar variantes vazias (sem tamanho e sem cor)
    const validVariants = variants.filter((v) => v.size || v.color)

    // Filtrar imagens com URL válida
    const validImages = images.filter((img) => img.image_url.trim() !== '')

    // Filtrar SEO vazio
    const hasSEO =
      seo.meta_title || seo.meta_description || seo.meta_keywords || seo.open_graph_image

    // Verificar se é roupa e criar size_chart padrão se necessário
    let finalSizeChart = sizeChart
    if (!finalSizeChart || !finalSizeChart.name.trim() || Object.keys(finalSizeChart.chart_json).length === 0) {
      // Buscar nomes das categorias para melhor detecção
      const categoryIds = data.category_ids || []
      const allCategories = categoriesData?.categories || []
      const productCategories = (product as any)?.categories || []

      // Combinar categorias do produto com todas as categorias disponíveis
      const categoryNames = categoryIds
        .map((id) => {
          const productCat = productCategories.find((c: any) => c.id === id)
          if (productCat) return productCat.name
          const allCat = allCategories.find((c) => c.id === id)
          return allCat?.name || ''
        })
        .filter(Boolean)

      // Se for roupa, criar size_chart padrão automaticamente
      if (isClothingProduct(data.name, categoryNames)) {
        finalSizeChart = generateDefaultSizeChart(data.name)
        setSizeChart(finalSizeChart)
      }
    }

    // Filtrar size chart vazio
    const hasSizeChart = finalSizeChart && finalSizeChart.name.trim() !== '' && Object.keys(finalSizeChart.chart_json).length > 0

    const { priceDigits, ...restData } = data as any
    const submitData = {
      ...restData,
      slug: data.slug || undefined, // Enviar undefined se vazio para o backend gerar
      sku: data.sku || undefined, // Enviar undefined se vazio para o backend gerar
      base_price: finalPrice,
      variants: validVariants.length > 0 ? validVariants : undefined,
      images: validImages.length > 0 ? validImages : undefined,
      seo: hasSEO ? seo : undefined,
      size_chart: hasSizeChart ? finalSizeChart : undefined
    }

    await onSubmit(submitData as any)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna esquerda: Dados principais */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-light">Informações básicas</CardTitle>
              <CardDescription>Dados principais do produto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do produto *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  onChange={handleNameChange}
                  placeholder="Ex: Blazer Essential"
                  className={errors.name ? 'border-rose-300' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-rose-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  {...register('slug')}
                  placeholder="blazer-essential"
                  className={errors.slug ? 'border-rose-300' : ''}
                />
                {errors.slug && (
                  <p className="text-xs text-rose-600">{errors.slug.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Deixe vazio para gerar automaticamente a partir do nome.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Descrição curta do produto..."
                  rows={4}
                  className={errors.description ? 'border-rose-300' : ''}
                />
                {errors.description && (
                  <p className="text-xs text-rose-600">{errors.description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-light">Preço e estoque</CardTitle>
              <CardDescription>Valores e disponibilidade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="base_price">Preço base (R$) *</Label>
                  <div className="relative">
                    <Input
                      id="base_price"
                      type="text"
                      value={formatCurrencyFromDigits(priceDigits)}
                      onChange={(e) => {
                        // Remove tudo que não for dígito
                        const digits = e.target.value.replace(/\D/g, '')
                        setPriceDigits(digits)
                        // Atualizar o valor do form para validação
                        setValue('priceDigits' as any, digits, { shouldValidate: true })
                      }}
                      onBlur={() => {
                        // Manter formatação ao perder foco
                        if (priceDigits) {
                          setValue('priceDigits' as any, priceDigits, { shouldValidate: true })
                        }
                      }}
                      placeholder="R$ 0,00"
                      className={errors.priceDigits ? 'border-rose-300' : ''}
                    />
                  </div>
                  {errors.priceDigits && (
                    <p className="text-xs text-rose-600">{errors.priceDigits.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Digite apenas números. O valor será formatado automaticamente.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    {...register('sku')}
                    placeholder="SKU-001"
                    className={errors.sku ? 'border-rose-300' : ''}
                  />
                  {errors.sku && (
                    <p className="text-xs text-rose-600">{errors.sku.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Deixe vazio para gerar automaticamente.
                  </p>
                </div>
              </div>

              <CategorySelector
                value={watch('category_ids') || []}
                onChange={(ids) => {
                  setValue('category_ids', ids)

                  // Se for produto novo e for roupa, criar size_chart padrão
                  if (!product) {
                    const name = watch('name')
                    if (name && name.trim().length > 0) {
                      const allCategories = categoriesData?.categories || []
                      const categoryNames = ids
                        .map((id) => allCategories.find((c) => c.id === id)?.name || '')
                        .filter(Boolean)

                      if (isClothingProduct(name, categoryNames) && !sizeChart) {
                        const defaultSizeChart = generateDefaultSizeChart(name)
                        setSizeChart(defaultSizeChart)
                        setValue('size_chart', defaultSizeChart as any)
                        setAutoSizeChartCreated(true)
                      }
                    }
                  }
                }}
                error={errors.category_ids?.message}
              />
            </CardContent>
          </Card>

          <VariantManager
            variants={variants}
            onChange={(newVariants) => {
              setVariants(newVariants)
              setValue('variants', newVariants as any)
            }}
          />

          <SEOForm
            seo={seo}
            onChange={(newSEO) => {
              setSeo(newSEO)
              setValue('seo', newSEO as any)
            }}
          />
        </div>

        {/* Coluna direita: Status */}
        <div className="space-y-6">

          <Card className="rounded-2xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-light">Status</CardTitle>
              <CardDescription>Visibilidade do produto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  {...register('status')}
                  className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="draft">Rascunho</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
                {errors.status && (
                  <p className="text-xs text-rose-600">{errors.status.message}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Rascunho: não aparece na loja | Ativo: visível | Inativo: oculto
                </p>
              </div>
            </CardContent>
          </Card>

          <ImageManager
            images={images}
            onChange={(newImages) => {
              setImages(newImages)
              setValue('images', newImages as any)
            }}
          />

          <div className="space-y-2">
            {autoSizeChartCreated && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                <p className="font-medium">✓ Provador Virtual habilitado automaticamente</p>
                <p className="text-xs text-blue-600 mt-1">
                  Detectamos que este é um produto de roupa. Uma tabela de medidas padrão foi criada. Você pode editá-la abaixo.
                </p>
              </div>
            )}
            <SizeChartForm
              sizeChart={sizeChart}
              onChange={(newSizeChart) => {
                setSizeChart(newSizeChart)
                setValue('size_chart', newSizeChart as any, { shouldDirty: true })
                if (newSizeChart) {
                  setAutoSizeChartCreated(false) // Remove flag quando usuário edita manualmente
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : product ? 'Atualizar produto' : 'Criar produto'}
        </Button>
      </div>
    </form>
  )
}

