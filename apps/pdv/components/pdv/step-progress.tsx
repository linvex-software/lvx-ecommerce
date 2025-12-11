'use client'

import { Check } from 'lucide-react'
import type { PDVStep } from '@/context/pdv-context'
import { cn } from '@/lib/utils'

interface StepProgressProps {
  currentStep: PDVStep
}

const steps: Array<{ id: PDVStep; label: string }> = [
  { id: 'client', label: 'Cliente' },
  { id: 'vendor', label: 'Vendedor' },
  { id: 'products', label: 'Produtos' },
  { id: 'payment', label: 'Pagamento' },
  { id: 'receipt', label: 'Recibo' }
]

export function StepProgress({ currentStep }: StepProgressProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className="w-full py-3 md:py-4 px-2 md:px-4 lg:px-8 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep
            const isCompleted = index < currentIndex
            const isBlocked = index > currentIndex

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div
                    className={cn(
                      'w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0 shadow-sm',
                      isActive && 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 text-white shadow-md',
                      isCompleted && 'bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600 text-white shadow-md',
                      isBlocked && 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4 md:h-5 md:w-5" />
                    ) : (
                      <span className="text-xs md:text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'mt-1 md:mt-2 text-[10px] md:text-xs font-medium text-center truncate w-full px-0.5',
                      isActive && 'text-blue-600 dark:text-blue-400',
                      isCompleted && 'text-green-600 dark:text-green-400',
                      isBlocked && 'text-gray-400 dark:text-gray-500',
                      'hidden sm:block'
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 mx-1 md:mx-2 transition-all flex-shrink',
                      isCompleted ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

