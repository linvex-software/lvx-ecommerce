'use client'

import { useState } from 'react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@white-label/ui'
import { Checkbox } from '@/components/ui/checkbox'
import { ImageManager, type ProductImage } from './image-manager'
import { CategorySelector } from './category-selector'
import { VariantManager, type ProductVariant } from './variant-manager'
import { SEOForm, type ProductSEO } from './seo-form'
import { SizeChartForm, type SizeChartData } from './size-chart-form'
import type { Product } from '@/lib/hooks/use-products'
import { isClothingProduct, generateDefaultSizeChart } from '@/lib/utils/product-detection'
import { useCategories } from '@/lib/hooks/use-categories'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  name: z.string().min(1, 'Informe o nome do produto.').min(3, 'Nome deve ter pelo menos 3 caracteres'),
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
    .min(1, 'Informe um preço válido.')
    .refine(
      (digits) => {
        const int = parseInt(digits || '0', 10)
        return int > 0
      },
      { message: 'Informe um preço válido.' }
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
  const [autoGenerateSlug, setAutoGenerateSlug] = useState<boolean>(!product)

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
    if (autoGenerateSlug && !product) {
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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'product-form.tsx:263',message:'handleFormSubmit ENTRY',data:{hasData:!!data,dataKeys:Object.keys(data||{}),isLoading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Converter dígitos para número antes de enviar
    // Priorizar: 1) estado priceDigits (mais atualizado), 2) data do form, 3) watch do form
    const watchedPriceDigits = watch('priceDigits' as any)
    const formPriceDigits = priceDigits || watchedPriceDigits || (data as any).priceDigits || ''
    
    // Debug: verificar valores (sempre logar para debug)
    console.log('[ProductForm] Submit - priceDigits state:', priceDigits)
    console.log('[ProductForm] Submit - watchedPriceDigits:', watchedPriceDigits)
    console.log('[ProductForm] Submit - data.priceDigits:', (data as any).priceDigits)
    console.log('[ProductForm] Submit - formPriceDigits final:', formPriceDigits)
    
    // Validar se há dígitos antes de converter
    if (!formPriceDigits || formPriceDigits.trim() === '' || formPriceDigits === '0') {
      console.error('[ProductForm] Preço vazio ou zero:', { 
        formPriceDigits, 
        priceDigits, 
        watchedPriceDigits,
        dataPriceDigits: (data as any).priceDigits 
      })
      throw new Error('Preço inválido. Informe um preço maior que zero.')
    }
    
    const finalPrice = digitsToNumber(formPriceDigits)
    console.log('[ProductForm] Submit - finalPrice calculado:', finalPrice, 'de', formPriceDigits)

    // Validar preço convertido
    if (isNaN(finalPrice) || finalPrice <= 0) {
      console.error('[ProductForm] Preço inválido após conversão:', { 
        formPriceDigits, 
        finalPrice, 
        parsed: parseInt(formPriceDigits, 10),
        calculation: `${parseInt(formPriceDigits, 10)} / 100 = ${parseInt(formPriceDigits, 10) / 100}`
      })
      throw new Error('Preço inválido. Informe um preço maior que zero.')
    }

    // Filtrar variantes vazias (sem tamanho e sem cor)
    const validVariants = variants.filter((v) => v.size || v.color)

    // Filtrar imagens com URL válida (não data URLs)
    const validImages = images.filter((img) => {
      const url = img.image_url.trim()
      // Rejeitar data URLs (base64) - apenas URLs reais do R2
      return url !== '' && !url.startsWith('data:')
    })
    
    // Validar se há pelo menos uma imagem válida
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'product-form.tsx:307',message:'Image validation check',data:{validImagesCount:validImages.length,imagesCount:images.length,validImages:validImages.map(i=>i.image_url.substring(0,50))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (validImages.length === 0 && images.length > 0) {
      // Se havia imagens mas todas são data URLs, significa que o upload ainda não terminou
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'product-form.tsx:310',message:'Throwing error: images still uploading',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      toast.error('Aguarde o upload das imagens', {
        description: 'As imagens ainda estão sendo enviadas. Aguarde alguns segundos e tente novamente.'
      })
      throw new Error('Imagens ainda sendo enviadas')
    }

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

    // Remover priceDigits e qualquer base_price que possa estar no data
    const { priceDigits: _priceDigits, base_price: _basePrice, ...restData } = data as any
    const submitData = {
      ...restData,
      slug: autoGenerateSlug ? undefined : (data.slug || undefined), // Enviar undefined se auto-gerar
      sku: data.sku || undefined, // Enviar undefined se vazio para o backend gerar
      base_price: finalPrice, // SEMPRE usar o finalPrice calculado
      variants: validVariants.length > 0 ? validVariants : undefined,
      images: validImages.length > 0 ? validImages : undefined,
      seo: hasSEO ? seo : undefined,
      size_chart: hasSizeChart ? finalSizeChart : undefined
    }

    // Debug: log do payload final
    console.log('[ProductForm] Payload final sendo enviado:', {
      ...submitData,
      base_price: submitData.base_price,
      base_price_type: typeof submitData.base_price,
      finalPrice_calculado: finalPrice,
      formPriceDigits_usado: formPriceDigits
    })

    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'product-form.tsx:360',message:'About to call onSubmit',data:{submitDataKeys:Object.keys(submitData),hasImages:!!submitData.images,imagesCount:submitData.images?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      await onSubmit(submitData as any)
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'product-form.tsx:363',message:'onSubmit completed successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'product-form.tsx:365',message:'handleFormSubmit ERROR',data:{errorMessage:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('[ProductForm] Erro ao submeter formulário:', error)
      // O erro será tratado pelo hook (useCreateProduct)
      throw error
    }
  }

  const watchedName = watch('name')

  const formOnSubmit = (e: React.FormEvent) => {
    // #region agent log
    const errorKeys = Object.keys(errors)
    const errorDetails = errorKeys.reduce((acc, key) => {
      acc[key] = errors[key as keyof typeof errors]?.message || 'error'
      return acc
    }, {} as Record<string, string>)
    fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'product-form.tsx:366',message:'Form onSubmit event fired',data:{isLoading,hasErrors:errorKeys.length>0,errorsCount:errorKeys.length,errorDetails,formValues:{name:watch('name'),priceDigits:watch('priceDigits' as any)}},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const result = handleSubmit(handleFormSubmit)(e)
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'product-form.tsx:375',message:'handleSubmit returned',data:{resultType:typeof result,isPromise:result instanceof Promise},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return result
  }
  
  return (
    <form onSubmit={formOnSubmit} className="space-y-8">
      {/* Layout responsivo: 2 colunas no desktop, 1 coluna no mobile/tablet */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Coluna principal (esquerda) - 2/3 da largura no desktop */}
        <div className="lg:col-span-2 space-y-8">
          {/* Seção: Informações básicas */}
          <Card className="dark:bg-surface-2">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Informações básicas</CardTitle>
              <CardDescription>Dados principais que o cliente verá na loja.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do produto *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  onChange={handleNameChange}
                  placeholder="Ex: Blazer Essential"
                  className={errors.name ? 'border-error' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-error">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="auto-slug"
                    checked={autoGenerateSlug}
                    onCheckedChange={(checked) => {
                      setAutoGenerateSlug(checked as boolean)
                      if (checked && watchedName) {
                        setValue('slug', generateSlug(watchedName))
                      }
                    }}
                  />
                  <Label htmlFor="auto-slug" className="font-normal cursor-pointer">
                    Gerar slug automaticamente a partir do nome
                  </Label>
                </div>
                <Input
                  id="slug"
                  {...register('slug')}
                  placeholder="blazer-essential"
                  disabled={autoGenerateSlug}
                  className={errors.slug ? 'border-error' : ''}
                />
                {errors.slug && (
                  <p className="text-xs text-error">{errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição curta</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Descrição curta do produto..."
                  rows={4}
                  className={errors.description ? 'border-error' : ''}
                />
                {errors.description && (
                  <p className="text-xs text-error">{errors.description.message}</p>
                )}
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

          {/* Seção: Preço e estoque */}
          <Card className="dark:bg-surface-2">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Preço e estoque</CardTitle>
              <CardDescription>Defina o valor do produto e a quantidade disponível para venda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
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
                        setValue('priceDigits' as any, digits, { shouldValidate: true, shouldDirty: true })
                      }}
                      onBlur={() => {
                        // Manter formatação ao perder foco e garantir que o valor está no form
                        if (priceDigits) {
                          setValue('priceDigits' as any, priceDigits, { shouldValidate: true, shouldDirty: true })
                        }
                      }}
                      placeholder="R$ 0,00"
                      className={errors.priceDigits ? 'border-error' : ''}
                    />
                  </div>
                  {errors.priceDigits && (
                    <p className="text-xs text-error">{errors.priceDigits.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    {...register('sku')}
                    placeholder="SKU-001"
                    className={errors.sku ? 'border-error' : ''}
                  />
                  {errors.sku && (
                    <p className="text-xs text-error">{errors.sku.message}</p>
                  )}
                  <p className="text-xs text-text-secondary">
                    Deixe vazio para gerar automaticamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Variações */}
          <Card className="dark:bg-surface-2">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Variações</CardTitle>
              <CardDescription>Use variações para produtos com tamanhos, cores ou outras opções.</CardDescription>
            </CardHeader>
            <CardContent>
              {variants.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <p className="text-sm text-text-secondary mb-2">
                    Este produto será simples, sem variações.
                  </p>
                  <p className="text-xs text-text-tertiary mb-4">
                    Use variações para tamanhos, cores ou outros atributos.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newVariant: ProductVariant = {
                        size: null,
                        color: null,
                        sku: null,
                        barcode: null,
                        price_override: null,
                        active: true
                      }
                      setVariants([newVariant])
                      setValue('variants', [newVariant] as any)
                    }}
                  >
                    Adicionar variação
                  </Button>
                </div>
              ) : (
                <VariantManager
                  variants={variants}
                  onChange={(newVariants) => {
                    setVariants(newVariants)
                    setValue('variants', newVariants as any)
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Seção: SEO (opcional) */}
          <Card className="dark:bg-surface-2">
            <CardHeader>
              <CardTitle className="text-xl font-semibold dark:text-white">SEO (opcional)</CardTitle>
              <CardDescription className="dark:text-[#B5B5B5]">
                Ajuda seu produto a aparecer melhor no Google e nas redes sociais.
                <br />
                <span className="text-xs">Se você não souber o que preencher aqui, pode deixar em branco.</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SEOForm
                seo={seo}
                onChange={(newSEO) => {
                  setSeo(newSEO)
                  setValue('seo', newSEO as any)
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Coluna lateral (direita) - 1/3 da largura no desktop */}
        <div className="space-y-6">
          {/* Status do produto */}
          <Card className="dark:bg-surface-2">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Status do produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={watch('status') || 'draft'}
                  onValueChange={(value) => setValue('status', value as 'draft' | 'active' | 'inactive')}
                >
                  <SelectTrigger id="status" className={errors.status ? 'border-error' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-xs text-error">{errors.status.message}</p>
                )}
                <div className="space-y-1 text-xs text-text-secondary">
                  <p>• <strong>Rascunho:</strong> Não aparece na loja.</p>
                  <p>• <strong>Ativo:</strong> Visível na loja.</p>
                  <p>• <strong>Inativo:</strong> Oculto, não aparece na loja.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Imagens */}
          <Card className="dark:bg-surface-2">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Imagens do produto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary mb-4">
                Adicione pelo menos 1 imagem para exibir o produto na loja.
              </p>
              <ImageManager
                images={images}
                onChange={(newImages) => {
                  setImages(newImages)
                  setValue('images', newImages as any)
                }}
              />
            </CardContent>
          </Card>

          {/* Tabela de tamanhos (se existir) */}
          {sizeChart && (
            <Card className="dark:bg-surface-2">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Tabela de tamanhos</CardTitle>
              </CardHeader>
              <CardContent>
                {autoSizeChartCreated && (
                  <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-text-secondary">
                    <p className="font-medium text-text-primary">✓ Provador Virtual habilitado automaticamente</p>
                    <p className="text-xs mt-1">
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Ações do formulário - Footer fixo no mobile */}
      <div className="sticky bottom-0 left-0 right-0 z-10 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-4 -mx-4 sm:px-6 sm:-mx-6 mt-8 dark:bg-background/95 sm:relative sm:border-t-0 sm:px-0 sm:-mx-0">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full sm:w-auto"
            onClick={(e) => {
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'product-form.tsx:689',message:'Submit button clicked',data:{isLoading,buttonType:'submit',disabled:isLoading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
            }}
          >
            {isLoading ? 'Salvando...' : product ? 'Atualizar produto' : 'Criar produto'}
          </Button>
        </div>
      </div>
    </form>
  )
}
