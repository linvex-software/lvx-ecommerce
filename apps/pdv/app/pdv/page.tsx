'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePDV } from '@/context/pdv-context'

export default function PDVIndexPage() {
  const router = useRouter()
  const { state } = usePDV()

  useEffect(() => {
    // Redirecionar para a etapa atual ou cliente se for a primeira vez
    if (state.currentStep === 'client') {
      router.push('/pdv/client')
    } else if (state.currentStep === 'vendor') {
      router.push('/pdv/vendor')
    } else if (state.currentStep === 'products') {
      router.push('/pdv/products')
    } else if (state.currentStep === 'payment') {
      router.push('/pdv/payment')
    } else if (state.currentStep === 'receipt') {
      router.push('/pdv/receipt')
    } else {
      router.push('/pdv/client')
    }
  }, [router, state.currentStep])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-500">Redirecionando...</div>
    </div>
  )
}

