'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface VirtualTryOnProps {
  virtualModelUrl: string | null
  virtualProvider: string | null
  virtualConfigJson: Record<string, unknown> | null
  productName: string
}

export default function VirtualTryOn({
  virtualModelUrl,
  virtualProvider,
  virtualConfigJson,
  productName
}: VirtualTryOnProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Só renderizar se tiver dados suficientes
  const hasVirtualTryOn = virtualModelUrl || virtualProvider

  // Fechar modal com tecla ESC
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  if (!hasVirtualTryOn) {
    return null
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="w-full border-2"
      >
        Descobrir meu tamanho
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative z-50 w-full max-w-2xl mx-4 bg-background border border-border rounded-lg shadow-lg">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Provador Virtual</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Experimente como este produto ficaria em você usando nosso provador virtual.
                </p>

                {virtualModelUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Modelo 3D:</p>
                    {virtualModelUrl.startsWith('http') ? (
                      <iframe
                        src={virtualModelUrl}
                        className="w-full h-96 border border-border rounded"
                        title={`Provador virtual - ${productName}`}
                        allow="camera; microphone"
                      />
                    ) : (
                      <div className="w-full h-96 border border-border rounded bg-muted flex items-center justify-center">
                        <p className="text-muted-foreground">
                          Modelo: {virtualModelUrl}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {virtualProvider && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Provedor:</p>
                    <p className="text-sm text-muted-foreground">{virtualProvider}</p>
                  </div>
                )}

                {virtualConfigJson && Object.keys(virtualConfigJson).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Configurações:</p>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                      {JSON.stringify(virtualConfigJson, null, 2)}
                    </pre>
                  </div>
                )}

                {!virtualModelUrl && (
                  <div className="p-6 border border-border rounded bg-muted text-center">
                    <p className="text-muted-foreground">
                      O provador virtual estará disponível em breve.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Por enquanto, consulte a tabela de medidas para encontrar seu tamanho ideal.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setIsOpen(false)} variant="outline">
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

