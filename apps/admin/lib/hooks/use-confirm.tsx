'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@white-label/ui'

interface ConfirmOptions {
  title?: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({
    description: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'default'
  })
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions({
        title: opts.title || 'Confirmar ação',
        description: opts.description,
        confirmText: opts.confirmText || 'Confirmar',
        cancelText: opts.cancelText || 'Cancelar',
        variant: opts.variant || 'default'
      })
      resolveRef.current = resolve
      setIsOpen(true)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    setIsOpen(false)
    if (resolveRef.current) {
      resolveRef.current(true)
      resolveRef.current = null
    }
  }, [])

  const handleCancel = useCallback(() => {
    setIsOpen(false)
    if (resolveRef.current) {
      resolveRef.current(false)
      resolveRef.current = null
    }
  }, [])

  const ConfirmDialog = () => (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{options.title || 'Confirmar ação'}</DialogTitle>
          <DialogDescription>{options.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            {options.cancelText}
          </Button>
          <Button
            variant={options.variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
          >
            {options.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return {
    confirm,
    ConfirmDialog
  }
}

