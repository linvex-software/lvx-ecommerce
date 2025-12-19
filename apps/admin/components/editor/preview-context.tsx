'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type PreviewMode = 'desktop' | 'tablet' | 'mobile'

export interface PreviewDimensions {
  width: number
  height: number
}

export const PREVIEW_DIMENSIONS: Record<PreviewMode, PreviewDimensions> = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
}

interface PreviewContextType {
  previewMode: PreviewMode
  setPreviewMode: (mode: PreviewMode) => void
  dimensions: PreviewDimensions
}

export const PreviewContext = createContext<PreviewContextType | undefined>(undefined)

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')

  return (
    <PreviewContext.Provider value={{ 
      previewMode, 
      setPreviewMode,
      dimensions: PREVIEW_DIMENSIONS[previewMode]
    }}>
      {children}
    </PreviewContext.Provider>
  )
}

export function usePreviewMode() {
  const context = useContext(PreviewContext)
  if (!context) {
    throw new Error('usePreviewMode must be used within PreviewProvider')
  }
  return context
}



