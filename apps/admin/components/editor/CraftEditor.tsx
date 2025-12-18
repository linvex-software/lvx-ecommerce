'use client'

import { useEffect, useState } from 'react'
import { Editor } from '@craftjs/core'
import { RestrictedFrame } from './restricted-frame'
import { EditorTopbar } from './editor-topbar'
import { EditorToolbox } from './editor-toolbox'
import { EditorSettingsPanel } from './editor-settings-panel'
import { CraftLayersPanel } from './CraftLayersPanel'
import { blocksToCraftJson } from '@/lib/utils/craft-converter'
import type { Block } from '@/components/blocks/types'

interface CraftEditorProps {
  blocks: Block[]
  onSerialize: (json: string) => void
  onSave: () => void
  isSaving: boolean
  hasUnsavedChanges: boolean
  onFinish: () => void
}

export function CraftEditor({
  blocks,
  onSerialize,
  onSave,
  isSaving,
  hasUnsavedChanges,
  onFinish
}: CraftEditorProps) {
  const [layoutJson, setLayoutJson] = useState<string | null>(null)

  // Converter blocks para Craft JSON quando mudarem
  useEffect(() => {
    if (blocks && blocks.length > 0) {
      const json = blocksToCraftJson(blocks)
      setLayoutJson(json)
      onSerialize(json)
    } else {
      setLayoutJson(null)
      onSerialize('')
    }
  }, [blocks, onSerialize])

  return (
    <div className="h-full flex flex-col">
      <EditorTopbar isPreview={false} />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
          <EditorToolbox />
          <CraftLayersPanel />
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {layoutJson ? (
            <Editor resolver={{}} enabled={true}>
              <RestrictedFrame data={layoutJson} />
            </Editor>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>Adicione blocos para começar</p>
            </div>
          )}
        </div>
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <EditorSettingsPanel />
        </div>
      </div>
    </div>
  )
}
