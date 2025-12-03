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

// Função para converter string BR (99,90) para número (99.90)
function parsePriceBR(priceString: string): number {
  if (!priceString || priceString.trim() === '') {
    return 0
  }
  
  // Remove espaços, símbolo R$ e separador de milhar
  let cleaned = priceString
    .trim()
    .replace(/R\$\s*/g, '')
    .replace(/\./g, '') // Remove separador de milhar
    .replace(/,/g, '.') // Substitui vírgula por ponto
  
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

// Função para formatar número para string BR (99.90 -> "99,90")
function formatPriceBR(price: number): string {
  if (!price || price === 0) {
    return ''
  }
  return price.toFixed(2).replace('.', ',')
}

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').min(3, 'Nome deve ter pelo menos 3 caracteres'),
  slug: z
    .string()
    .min(1, 'Slug é obrigatório')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  description: z.string().optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  base_price: z
    .union([z.string(), z.number()])
    .refine(
      (val) => {
        const num = typeof val === 'string' ? parsePriceBR(val) : val
        return !isNaN(num) && num > 0
      },
      { message: 'Preço deve ser maior que zero' }
    )
    .transform((val) => (typeof val === 'string' ? parsePriceBR(val) : val)),
  sku: z.string().min(1, 'SKU é obrigatório').optional(),
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
  const [priceDisplay, setPriceDisplay] = useState<string>(
    product ? formatPriceBR(parseFloat(product.base_price.toString())) : ''
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
          base_price: parseFloat(product.base_price.toString()) || 0,
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
          base_price: 0,
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

  // Sincronizar priceDisplay quando produto é carregado
  React.useEffect(() => {
    if (product) {
      const price = parseFloat(product.base_price.toString())
      setPriceDisplay(formatPriceBR(price))
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
    // Converter preço de string BR para número antes de enviar
    const finalPrice = typeof data.base_price === 'string' 
      ? parsePriceBR(data.base_price) 
      : data.base_price

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

    const submitData = {
      ...data,
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
                <Label htmlFor="slug">Slug *</Label>
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
                  URL amigável (gerado automaticamente se deixar vazio)
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
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <Input
                      id="base_price"
                      type="text"
                      value={priceDisplay}
                      onChange={(e) => {
                        const value = e.target.value
                        setPriceDisplay(value)
                        // Converter e atualizar o valor do form
                        const numValue = parsePriceBR(value)
                        setValue('base_price', numValue, { shouldValidate: true })
                      }}
                      onBlur={() => {
                        // Formatar ao perder foco
                        const numValue = parsePriceBR(priceDisplay)
                        if (numValue > 0) {
                          const formatted = formatPriceBR(numValue)
                          setPriceDisplay(formatted)
                          setValue('base_price', numValue, { shouldValidate: true })
                        }
                      }}
                      placeholder="99,90"
                      className={`pl-10 ${errors.base_price ? 'border-rose-300' : ''}`}
                    />
                  </div>
                  {errors.base_price && (
                    <p className="text-xs text-rose-600">{errors.base_price.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Digite o preço com vírgula (ex: 99,90)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    {...register('sku')}
                    placeholder="SKU-001 (opcional - será gerado automaticamente se vazio)"
                    className={errors.sku ? 'border-rose-300' : ''}
                  />
                  {errors.sku && (
                    <p className="text-xs text-rose-600">{errors.sku.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Deixe vazio para gerar automaticamente
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

