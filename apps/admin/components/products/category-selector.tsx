'use client'

import { useCategories } from '@/lib/hooks/use-categories'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface CategorySelectorProps {
  value: string[]
  onChange: (categoryIds: string[]) => void
  error?: string
}

export function CategorySelector({ value, onChange, error }: CategorySelectorProps) {
  const { data, isLoading } = useCategories()
  const categories = data?.categories || []

  const handleToggleCategory = (categoryId: string) => {
    if (value.includes(categoryId)) {
      onChange(value.filter((id) => id !== categoryId))
    } else {
      onChange([...value, categoryId])
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Categorias</Label>
        <div className="h-32 animate-pulse rounded-lg bg-gray-100" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>Categorias</Label>
      <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border bg-background p-3 dark:bg-[#101010] dark:border-[#2A2A2A]">
        {categories.length === 0 ? (
          <p className="text-sm text-text-secondary">Nenhuma categoria disponível</p>
        ) : (
          categories.map((category) => (
            <label
              key={category.id}
              className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-hover transition-colors"
            >
              <input
                type="checkbox"
                checked={value.includes(category.id)}
                onChange={() => handleToggleCategory(category.id)}
                className="h-4 w-4 rounded border-input-border text-primary focus:ring-primary dark:border-[#2A2A2A]"
              />
              <span className="text-sm text-text-primary">{category.name}</span>
            </label>
          ))
        )}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      <p className="text-xs text-text-secondary">
        Selecione uma ou mais categorias para este produto
      </p>
    </div>
  )
}

