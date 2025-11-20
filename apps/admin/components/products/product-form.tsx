'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@white-label/ui'
import { ImageUpload } from './image-upload'
import type { Product } from '@/lib/hooks/use-products'

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').min(3, 'Nome deve ter pelo menos 3 caracteres'),
  slug: z
    .string()
    .min(1, 'Slug é obrigatório')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  description: z.string().optional(),
  category_id: z.string().optional(),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  stock: z.number().int().min(0, 'Estoque não pode ser negativo'),
  image_url: z.string().nullable().optional(),
  active: z.boolean().default(true)
})

export type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: Product | null
  onSubmit: (data: ProductFormData) => Promise<void>
  isLoading?: boolean
}

export function ProductForm({ product, onSubmit, isLoading = false }: ProductFormProps) {
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
          category_id: product.category_id || '',
          price: product.price,
          stock: product.stock,
          image_url: product.image_url,
          active: product.active
        }
      : {
          name: '',
          slug: '',
          description: '',
          category_id: '',
          price: 0,
          stock: 0,
          image_url: null,
          active: true
        }
  })

  const imageUrl = watch('image_url')

  const handleImageChange = (url: string | null) => {
    setValue('image_url', url)
  }

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
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('price', { valueAsNumber: true })}
                    placeholder="0.00"
                    className={errors.price ? 'border-rose-300' : ''}
                  />
                  {errors.price && (
                    <p className="text-xs text-rose-600">{errors.price.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Estoque *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    {...register('stock', { valueAsNumber: true })}
                    placeholder="0"
                    className={errors.stock ? 'border-rose-300' : ''}
                  />
                  {errors.stock && (
                    <p className="text-xs text-rose-600">{errors.stock.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_id">Categoria</Label>
                <select
                  id="category_id"
                  {...register('category_id')}
                  className={`flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    errors.category_id ? 'border-rose-300' : ''
                  }`}
                >
                  <option value="">Sem categoria</option>
                  {/* TODO: Carregar categorias da API */}
                  <option value="cat1">Categoria 1</option>
                  <option value="cat2">Categoria 2</option>
                </select>
                {errors.category_id && (
                  <p className="text-xs text-rose-600">{errors.category_id.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita: Imagem e status */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-light">Imagem</CardTitle>
              <CardDescription>Imagem principal do produto</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload value={imageUrl || null} onChange={handleImageChange} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-light">Status</CardTitle>
              <CardDescription>Visibilidade do produto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active"
                  {...register('active')}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <Label htmlFor="active" className="cursor-pointer font-normal">
                  Produto ativo
                </Label>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Produtos inativos não aparecem na loja
              </p>
            </CardContent>
          </Card>
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

