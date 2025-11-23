'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export interface ProductSEO {
  meta_title?: string | null
  meta_description?: string | null
  meta_keywords?: string | null
  open_graph_image?: string | null
}

interface SEOFormProps {
  seo: ProductSEO
  onChange: (seo: ProductSEO) => void
}

export function SEOForm({ seo, onChange }: SEOFormProps) {
  const updateField = (field: keyof ProductSEO, value: string | null) => {
    onChange({
      ...seo,
      [field]: value || null
    })
  }

  return (
    <Card className="rounded-2xl border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-light">SEO</CardTitle>
        <CardDescription>Otimização para mecanismos de busca</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="meta_title">Meta Title</Label>
          <Input
            id="meta_title"
            placeholder="Título para SEO (máx. 60 caracteres)"
            value={seo.meta_title || ''}
            onChange={(e) => updateField('meta_title', e.target.value)}
            maxLength={60}
          />
          <p className="text-xs text-gray-500">
            {seo.meta_title?.length || 0}/60 caracteres
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta_description">Meta Description</Label>
          <Textarea
            id="meta_description"
            placeholder="Descrição para SEO (máx. 160 caracteres)"
            value={seo.meta_description || ''}
            onChange={(e) => updateField('meta_description', e.target.value)}
            maxLength={160}
            rows={3}
          />
          <p className="text-xs text-gray-500">
            {seo.meta_description?.length || 0}/160 caracteres
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta_keywords">Meta Keywords</Label>
          <Input
            id="meta_keywords"
            placeholder="palavra1, palavra2, palavra3"
            value={seo.meta_keywords || ''}
            onChange={(e) => updateField('meta_keywords', e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Separe as palavras-chave por vírgula
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="open_graph_image">Open Graph Image URL</Label>
          <Input
            id="open_graph_image"
            type="url"
            placeholder="https://example.com/og-image.jpg"
            value={seo.open_graph_image || ''}
            onChange={(e) => updateField('open_graph_image', e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Imagem para compartilhamento em redes sociais (recomendado: 1200x630px)
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

