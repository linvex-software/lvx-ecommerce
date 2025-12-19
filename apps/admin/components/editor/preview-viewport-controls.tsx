'use client'

import { Monitor, Tablet, Smartphone } from 'lucide-react'
import { usePreviewMode, type PreviewMode } from './preview-context'

/**
 * Componente de controles de viewport para o preview
 * Permite alternar entre Desktop, Tablet e Mobile
 */
export function PreviewViewportControls() {
  const { previewMode, setPreviewMode } = usePreviewMode()

  const modes: { mode: PreviewMode; icon: typeof Monitor; label: string }[] = [
    { mode: 'desktop', icon: Monitor, label: 'Desktop' },
    { mode: 'tablet', icon: Tablet, label: 'Tablet' },
    { mode: 'mobile', icon: Smartphone, label: 'Mobile' },
  ]

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {modes.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => setPreviewMode(mode)}
          className={`p-2 rounded transition-colors ${
            previewMode === mode
              ? 'bg-[#7c3aed] text-white'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          title={label}
          aria-label={`Visualizar em ${label}`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  )
}


