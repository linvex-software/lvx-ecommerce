'use client'

import React from 'react'
import { useEditor } from '@craftjs/core'
import { Button } from '@white-label/ui'
import { Save, Undo2, Redo2, Check, ChevronDown, ChevronUp } from 'lucide-react'

interface CraftTopbarProps {
  onSave?: () => void
  isSaving?: boolean
  hasUnsavedChanges?: boolean
  onFinish?: () => void
}

export function CraftTopbar({ onSave, isSaving, hasUnsavedChanges, onFinish }: CraftTopbarProps) {
  const { actions, query, canUndo, canRedo } = useEditor((state, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }))

  return (
    <div className="h-12 bg-green-600 text-white flex items-center justify-between px-4 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
          <div className="w-3 h-3 bg-white rounded-sm" />
        </div>
        
        <div className="h-6 w-px bg-white/30 mx-2" />
        
        <button
          onClick={() => actions.history.undo()}
          disabled={!canUndo}
          className="p-1.5 rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Desfazer"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => actions.history.redo()}
          disabled={!canRedo}
          className="p-1.5 rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Refazer"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Center Section */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onFinish}
          size="sm"
          className="bg-white text-green-600 hover:bg-white/90 h-8 px-4"
        >
          <Check className="w-4 h-4 mr-1.5" />
          Finalizar Edição
        </Button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges}
          size="sm"
          variant="ghost"
          className="h-8 px-3 text-white hover:bg-white/20"
        >
          <Save className="w-4 h-4 mr-1.5" />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
        
        {hasUnsavedChanges && (
          <span className="text-xs text-white/80">*</span>
        )}
      </div>
    </div>
  )
}












