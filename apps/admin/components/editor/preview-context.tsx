'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type PreviewMode = 'desktop' | 'tablet'

interface PreviewContextType {
  previewMode: PreviewMode
  setPreviewMode: (mode: PreviewMode) => void
}

export const PreviewContext = createContext<PreviewContextType | undefined>(undefined)

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')

  return (
    <PreviewContext.Provider value={{ previewMode, setPreviewMode }}>
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



