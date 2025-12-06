'use client'

import { useEffect } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import { useTryOnStore } from './useTryOnStore'
import StepUserData from './StepUserData'
import StepAdjust from './StepAdjust'
import StepResult from './StepResult'
import type { ParsedSizeChart } from './algorithm'

interface TryOnModalProps {
  sizeChart: ParsedSizeChart
  productName: string
}

export default function TryOnModal({ sizeChart, productName }: TryOnModalProps) {
  const { isOpen, currentStep, closeModal } = useTryOnStore()

  // Fechar modal com tecla ESC
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, closeModal])

  // Prevenir scroll do body quando modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'user-data':
        return 'Dados Básicos'
      case 'adjust':
        return 'Ajuste das Medidas'
      case 'result':
        return 'Recomendação'
      default:
        return 'Provador Virtual'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={closeModal}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-border rounded-lg shadow-xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl sm:text-2xl font-bold truncate">{getStepTitle()}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{productName}</p>
          </div>
          <button
            onClick={closeModal}
            className="p-2 hover:bg-muted rounded-full transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-border/50">
          <div className="flex items-center justify-between gap-2">
            {['user-data', 'adjust', 'result'].map((step, index) => {
              const stepNames = ['Dados', 'Ajuste', 'Resultado']
              const isActive = currentStep === step
              const isCompleted =
                (step === 'user-data' && currentStep !== 'user-data') ||
                (step === 'adjust' && currentStep === 'result')

              return (
                <div key={step} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300 ${
                        isActive
                          ? 'bg-foreground text-background scale-110 shadow-md'
                          : isCompleted
                          ? 'bg-green-600 dark:bg-green-500 text-white scale-100'
                          : 'bg-muted text-muted-foreground scale-100'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs mt-2 text-center truncate w-full ${
                        isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {stepNames[index]}
                    </span>
                  </div>
                  {index < 2 && (
                    <div
                      className={`h-1 flex-1 mx-1 sm:mx-2 rounded transition-all duration-500 ${
                        isCompleted
                          ? 'bg-green-600 dark:bg-green-500'
                          : isActive
                          ? 'bg-foreground/20'
                          : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div
            key={currentStep}
            className="animate-in fade-in slide-in-from-right-4 duration-300"
          >
            {currentStep === 'user-data' && <StepUserData />}
            {currentStep === 'adjust' && <StepAdjust />}
            {currentStep === 'result' && <StepResult sizeChart={sizeChart} />}
          </div>
        </div>
      </div>
    </div>
  )
}

