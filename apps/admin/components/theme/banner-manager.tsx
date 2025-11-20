'use client'

import { useState } from 'react'
import { Plus, X, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@white-label/ui'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/products/image-upload'

export interface Banner {
  id: string
  type: 'hero' | 'secondary' | 'promotional'
  image_url: string
  link?: string
  title?: string
  subtitle?: string
}

interface BannerManagerProps {
  banners: Banner[]
  onChange: (banners: Banner[]) => void
}

const bannerTypes = [
  { value: 'hero', label: 'Banner Principal (Hero)' },
  { value: 'secondary', label: 'Banner Secundário' },
  { value: 'promotional', label: 'Banner Promocional' }
]

export function BannerManager({ banners, onChange }: BannerManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Banner>>({})

  const handleAdd = () => {
    const newBanner: Banner = {
      id: `banner-${Date.now()}`,
      type: 'hero',
      image_url: '',
      link: '',
      title: '',
      subtitle: ''
    }
    onChange([...banners, newBanner])
    setEditingId(newBanner.id)
    setFormData(newBanner)
  }

  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id)
    setFormData(banner)
  }

  const handleSave = () => {
    if (!editingId) return

    const updated = banners.map((banner) =>
      banner.id === editingId ? { ...banner, ...formData } : banner
    )
    onChange(updated)
    setEditingId(null)
    setFormData({})
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({})
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este banner?')) {
      onChange(banners.filter((b) => b.id !== id))
      if (editingId === id) {
        setEditingId(null)
        setFormData({})
      }
    }
  }

  const editingBanner = banners.find((b) => b.id === editingId)

  return (
    <Card className="rounded-2xl border-gray-100 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-light">Banners</CardTitle>
            <CardDescription>Gerencie os banners da sua loja</CardDescription>
          </div>
          <Button type="button" onClick={handleAdd} className="gap-2" variant="outline">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {banners.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-12 text-center">
            <p className="text-sm font-medium text-gray-500">Nenhum banner adicionado</p>
            <p className="mt-1 text-xs text-gray-400">
              Clique em "Adicionar" para criar seu primeiro banner
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {banners.map((banner) => {
              const isEditing = editingId === banner.id
              const displayData = isEditing ? { ...banner, ...formData } : banner

              return (
                <div
                  key={banner.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tipo de banner</Label>
                        <select
                          value={displayData.type}
                          onChange={(e) =>
                            setFormData({ ...formData, type: e.target.value as Banner['type'] })
                          }
                          className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
                        >
                          {bannerTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Imagem</Label>
                        <ImageUpload
                          value={displayData.image_url || null}
                          onChange={(url) => setFormData({ ...formData, image_url: url || '' })}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Link (opcional)</Label>
                          <Input
                            value={displayData.link || ''}
                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Título (opcional)</Label>
                          <Input
                            value={displayData.title || ''}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Título do banner"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Subtítulo (opcional)</Label>
                        <Input
                          value={displayData.subtitle || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, subtitle: e.target.value })
                          }
                          placeholder="Subtítulo do banner"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={handleCancel}>
                          Cancelar
                        </Button>
                        <Button type="button" onClick={handleSave}>
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      {banner.image_url ? (
                        <div className="relative h-24 w-32 overflow-hidden rounded-lg">
                          <img
                            src={banner.image_url}
                            alt={banner.title || 'Banner'}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-24 w-32 items-center justify-center rounded-lg bg-gray-100">
                          <span className="text-xs text-gray-400">Sem imagem</span>
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {bannerTypes.find((t) => t.value === banner.type)?.label}
                            </p>
                            {banner.title && (
                              <p className="mt-1 text-xs text-gray-600">{banner.title}</p>
                            )}
                            {banner.link && (
                              <p className="mt-1 text-xs text-gray-500">{banner.link}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEdit(banner)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700"
                              onClick={() => handleDelete(banner.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

