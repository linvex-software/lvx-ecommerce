'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import { GripVertical, Plus, Trash2, Eye, EyeOff, Edit2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@white-label/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { NavbarItem } from '@/lib/types/navbar'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

interface NavbarEditorProps {
  items?: NavbarItem[]
  onUpdate?: (items: NavbarItem[]) => void
  onNavbarUpdate?: (items: NavbarItem[]) => void // Mantido para compatibilidade
}

async function fetchNavbar(): Promise<{ navbar_items: NavbarItem[] }> {
  const token = localStorage.getItem('accessToken')
  try {
    const response = await axios.get(`${API_URL}/admin/navbar`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    return response.data
  } catch (error) {
    console.warn('Erro ao buscar navbar, usando valores padrão:', error)
    return { navbar_items: [] }
  }
}

async function createNavbarItem(data: Partial<NavbarItem>): Promise<{ navbar_item: NavbarItem }> {
  const token = localStorage.getItem('accessToken')
  const response = await axios.post(`${API_URL}/admin/navbar`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  return response.data
}

async function updateNavbarItem(id: string, data: Partial<NavbarItem>): Promise<{ navbar_item: NavbarItem }> {
  const token = localStorage.getItem('accessToken')
  const response = await axios.put(`${API_URL}/admin/navbar/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  return response.data
}

async function deleteNavbarItem(id: string): Promise<void> {
  const token = localStorage.getItem('accessToken')
  await axios.delete(`${API_URL}/admin/navbar/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
}

async function updateNavbarOrder(items: Array<{ id: string; order: number }>): Promise<void> {
  const token = localStorage.getItem('accessToken')
  await axios.put(`${API_URL}/admin/navbar/order`, { items }, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
}

export function NavbarEditor({ items: externalItems, onUpdate, onNavbarUpdate }: NavbarEditorProps) {
  const onNavbarUpdateFinal = onUpdate || onNavbarUpdate
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({
    queryKey: ['navbar'],
    queryFn: fetchNavbar
  })

  const createMutation = useMutation({
    mutationFn: createNavbarItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navbar'] })
      toast.success('Item adicionado!')
    },
    onError: () => {
      toast.error('Erro ao adicionar item')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NavbarItem> }) => updateNavbarItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navbar'] })
      toast.success('Item atualizado!')
      setEditingId(null)
      if (onNavbarUpdate && data) {
        onNavbarUpdate(data.navbar_items)
      }
    },
    onError: () => {
      toast.error('Erro ao atualizar item')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNavbarItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navbar'] })
      toast.success('Item removido!')
      if (onNavbarUpdate && data) {
        onNavbarUpdate(data.navbar_items.filter(item => item.id !== editingId))
      }
      setEditingId(null)
    },
    onError: () => {
      toast.error('Erro ao remover item')
    }
  })

  const orderMutation = useMutation({
    mutationFn: updateNavbarOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navbar'] })
      if (onNavbarUpdate && data) {
        onNavbarUpdate(data.navbar_items)
      }
    }
  })

  const handleAddItem = () => {
    createMutation.mutate({
      label: 'Novo Item',
      type: 'internal',
      url: '/',
      visible: true,
      order: data?.navbar_items.length || 0
    })
  }

  const handleSave = (item: NavbarItem, formData: Partial<NavbarItem>) => {
    updateMutation.mutate({ id: item.id, data: formData })
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este item?')) {
      deleteMutation.mutate(id)
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const flattenItems = (items: NavbarItem[]): NavbarItem[] => {
    const result: NavbarItem[] = []
    items.forEach(item => {
      result.push(item)
      if (item.children && item.children.length > 0) {
        result.push(...flattenItems(item.children))
      }
    })
    return result
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Carregando navbar...</div>
  }

  const items = data?.navbar_items || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Navbar</h3>
          <p className="text-sm text-muted-foreground">Gerencie os itens do menu de navegação</p>
        </div>
        <Button size="sm" onClick={handleAddItem}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Item
        </Button>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum item adicionado. Clique em "Adicionar Item" para começar.
          </div>
        ) : (
          flattenItems(items).map((item) => (
            <NavbarItemEditor
              key={item.id}
              item={item}
              isEditing={editingId === item.id}
              isExpanded={expandedItems.has(item.id)}
              onEdit={() => setEditingId(item.id)}
              onCancel={() => setEditingId(null)}
              onSave={(formData) => handleSave(item, formData)}
              onDelete={() => handleDelete(item.id)}
              onToggleExpand={() => toggleExpanded(item.id)}
              level={0}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface NavbarItemEditorProps {
  item: NavbarItem
  isEditing: boolean
  isExpanded: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (data: Partial<NavbarItem>) => void
  onDelete: () => void
  onToggleExpand: () => void
  level: number
}

function NavbarItemEditor({
  item,
  isEditing,
  isExpanded,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onToggleExpand,
  level
}: NavbarItemEditorProps) {
  const [formData, setFormData] = useState<Partial<NavbarItem>>({
    label: item.label,
    type: item.type,
    url: item.url,
    target: item.target,
    icon: item.icon,
    visible: item.visible,
    style: item.style
  })

  const hasChildren = item.children && item.children.length > 0

  if (isEditing) {
    return (
      <Card className="ml-4">
        <CardHeader>
          <CardTitle className="text-base">Editar Item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={formData.label || ''}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <select
              value={formData.type || 'internal'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as NavbarItem['type'] })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="internal">Link Interno</option>
              <option value="external">Link Externo</option>
              <option value="submenu">Submenu</option>
            </select>
          </div>

          {formData.type !== 'submenu' && (
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={formData.url || ''}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="/products"
              />
            </div>
          )}

          {formData.type !== 'submenu' && (
            <div className="space-y-2">
              <Label>Target</Label>
              <select
                value={formData.target || '_self'}
                onChange={(e) => setFormData({ ...formData, target: e.target.value as '_self' | '_blank' })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="_self">Mesma aba</option>
                <option value="_blank">Nova aba</option>
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Ícone (opcional)</Label>
            <Input
              value={formData.icon || ''}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="home, shopping-cart, etc"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`visible-${item.id}`}
              checked={formData.visible ?? true}
              onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor={`visible-${item.id}`} className="cursor-pointer">
              Visível
            </Label>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={() => onSave(formData)}>
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${level > 0 ? 'ml-8' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {hasChildren && (
            <button onClick={onToggleExpand} className="text-muted-foreground">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          <GripVertical className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.label}</span>
              {!item.visible && <span className="text-xs text-muted-foreground">(oculto)</span>}
              <span className="text-xs text-muted-foreground">({item.type})</span>
            </div>
          </div>
          <button onClick={onEdit} className="text-muted-foreground hover:text-foreground">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="text-destructive hover:text-destructive/80">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

