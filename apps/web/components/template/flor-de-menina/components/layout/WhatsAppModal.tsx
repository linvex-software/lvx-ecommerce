'use client'

import { X, ChevronRight } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Consultant {
  name: string
  city: string
  phone: string
}

interface WhatsAppModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  consultants?: Consultant[]
}

const DEFAULT_CONSULTANTS: Consultant[] = [
  {
    name: 'Isabela',
    city: 'Maceió',
    phone: '558281809359',
  },
  {
    name: 'Alessandra',
    city: 'Maceió',
    phone: '5582999682530',
  },
  {
    name: 'Luana',
    city: 'Recife',
    phone: '558188710888',
  },
]

export function WhatsAppModal({ 
  open, 
  onOpenChange, 
  consultants = DEFAULT_CONSULTANTS 
}: WhatsAppModalProps) {
  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-whatsapp-modal]') && !target.closest('[data-whatsapp-button]')) {
        onOpenChange(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onOpenChange])

  if (!open) return null

  const modalContent = (
    <div
      data-whatsapp-modal
      className="fixed bottom-12 right-4 sm:right-6 z-[60] w-[calc(100vw-2rem)] sm:w-[360px] max-w-[360px] animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200"
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50">
        {/* Header */}
        <div className="px-5 py-3.5 relative" style={{ backgroundColor: '#8B4513' }}>
          <h3 
            className="text-base font-semibold text-center pr-7"
            style={{ 
              color: 'white',
              WebkitTextFillColor: 'white'
            } as React.CSSProperties}
          >
            Atendimento via Whatsapp
          </h3>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity z-10"
            style={{ color: 'white' }}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" style={{ color: 'white' }} />
          </button>
        </div>

        {/* Body */}
        <div className="bg-white px-5 py-5">
          {/* Text */}
          <p className="text-gray-800 mb-4 text-center text-sm">
            Precisa de ajuda? <br />
            Fale com uma consultora:
          </p>

          {/* Consultants List */}
          <ul className="space-y-2.5">
            {consultants.map((consultant, index) => (
              <li key={`${consultant.phone}-${index}`}>
                <a
                  href={`https://api.whatsapp.com/send?phone=${consultant.phone}&text=${encodeURIComponent('Olá! Pode me ajudar?')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between gap-3 bg-white rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-colors border border-gray-200 hover:border-[#8B4513] group cursor-pointer"
                >
                  {/* Consultant Info */}
                  <span className="text-gray-800 font-medium text-sm">
                    Consultora {consultant.name} - {consultant.city}
                  </span>

                  {/* Arrow */}
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#8B4513] transition-colors flex-shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null

  return createPortal(modalContent, document.body)
}

