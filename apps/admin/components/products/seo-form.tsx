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
    <Card className="dark:bg-surface-2">
      <CardHeader>
        <CardTitle className="text-xl font-semibold dark:text-white">SEO (opcional)</CardTitle>
        <CardDescription className="dark:text-[#B5B5B5]">
          Ajuda seu produto a aparecer melhor no Google e nas redes sociais.
          <br />
          <span className="text-xs">Se você não souber o que preencher aqui, pode deixar em branco.</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="meta_title" className="dark:text-[#CCCCCC]">Título para o Google</Label>
          <Input
            id="meta_title"
            placeholder="Ex: Camiseta básica preta masculina | Nome da Loja"
            value={seo.meta_title || ''}
            onChange={(e) => updateField('meta_title', e.target.value)}
            maxLength={60}
            className="dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:placeholder:text-[#777777] dark:hover:border-[#3A3A3A]"
          />
          <p className="text-xs text-text-secondary dark:text-[#B5B5B5]">
            Este é o título que aparece nos resultados do Google. Tente ser claro e direto (até cerca de 60 caracteres).
            <br />
            {seo.meta_title?.length || 0}/60 caracteres
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta_description" className="dark:text-[#CCCCCC]">Descrição para o Google</Label>
          <Textarea
            id="meta_description"
            placeholder="Ex: Camiseta básica preta, confortável e versátil para o dia a dia."
            value={seo.meta_description || ''}
            onChange={(e) => updateField('meta_description', e.target.value)}
            maxLength={160}
            rows={3}
            className="dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:placeholder:text-[#777777] dark:hover:border-[#3A3A3A]"
          />
          <p className="text-xs text-text-secondary dark:text-[#B5B5B5]">
            Texto curto que aparece abaixo do título no Google. Explique o produto de forma simples (até cerca de 160 caracteres).
            <br />
            {seo.meta_description?.length || 0}/160 caracteres
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta_keywords" className="dark:text-[#CCCCCC]">Palavras-chave (opcional)</Label>
          <Input
            id="meta_keywords"
            placeholder="Ex: camiseta preta, camiseta básica, roupa masculina"
            value={seo.meta_keywords || ''}
            onChange={(e) => updateField('meta_keywords', e.target.value)}
            className="dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:placeholder:text-[#777777] dark:hover:border-[#3A3A3A]"
          />
          <p className="text-xs text-text-secondary dark:text-[#B5B5B5]">
            Use algumas palavras que resumem o produto, separadas por vírgula. Não é obrigatório.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="open_graph_image" className="dark:text-[#CCCCCC]">Imagem para compartilhamento (link)</Label>
          <Input
            id="open_graph_image"
            type="url"
            placeholder="https://example.com/imagem-do-produto.jpg"
            value={seo.open_graph_image || ''}
            onChange={(e) => updateField('open_graph_image', e.target.value)}
            className="dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:placeholder:text-[#777777] dark:hover:border-[#3A3A3A]"
          />
          <p className="text-xs text-text-secondary dark:text-[#B5B5B5]">
            Usada quando alguém compartilha o produto em redes sociais (Facebook, Instagram, WhatsApp, etc.). Coloque o link de uma imagem do produto.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

