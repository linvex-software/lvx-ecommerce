'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@white-label/ui'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { StepProgress } from '@/components/pdv/step-progress'
import { usePDV } from '@/context/pdv-context'
import { useVendors } from '@/lib/hooks/use-vendors'
import toast from 'react-hot-toast'

export default function VendorStepPage() {
  const router = useRouter()
  const { state, setVendor, setOrigin, setCurrentStep, createCartIfNotExists } = usePDV()
  const { data: vendorsData, isLoading: vendorsLoading, error: vendorsError } = useVendors()

  const vendors = vendorsData?.vendors || []

  useEffect(() => {
    // Se não tem cliente, voltar para etapa anterior
    if (!state.customer) {
      router.push('/pdv/client')
    }
  }, [state.customer, router])

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId)
    if (vendor) {
      setVendor(vendorId, vendor.name)
    }
  }

  const handleContinue = async () => {
    if (!state.vendorId) {
      toast.error('Selecione um vendedor para continuar')
      return
    }

    if (!state.customer) {
      toast.error('Cliente não selecionado')
      router.push('/pdv/client')
      return
    }

    try {
      // Criar carrinho antes de avançar
      const cartId = await createCartIfNotExists()
      if (!cartId) {
        toast.error('Erro ao criar carrinho. Verifique o console para mais detalhes.')
        return
      }

      setCurrentStep('products')
      router.push('/pdv/products')
    } catch (error: any) {
      console.error('Erro ao criar carrinho:', error.response?.data || error)
      toast.error('Erro ao criar carrinho. Verifique o console para mais detalhes.')
    }
  }

  const handleBack = () => {
    router.push('/pdv/client')
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <StepProgress currentStep="vendor" />

      <div className="p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Selecionar Vendedor
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Escolha o vendedor responsável por esta venda</p>
        </div>

        {/* Cliente Selecionado (Info) */}
        {state.customer && (
          <Card className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                  {state.customer.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cliente</p>
                  <p className="font-semibold text-gray-900">{state.customer.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-4 shadow-sm border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendedor <span className="text-red-500">*</span>
                </label>
                <Select
                  value={state.vendorId || ''}
                  onChange={(e) => handleVendorChange(e.target.value)}
                  className="h-12"
                  required
                  disabled={vendorsLoading}
                >
                  <option value="">
                    {vendorsLoading
                      ? 'Carregando vendedores...'
                      : vendorsError
                      ? 'Erro ao carregar vendedores'
                      : vendors.length === 0
                      ? 'Nenhum vendedor encontrado'
                      : 'Selecione um vendedor'}
                  </option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </Select>
                {vendorsError && (
                  <p className="mt-1 text-xs text-red-600">
                    Erro ao carregar vendedores. Tente novamente.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Origem da Venda (opcional)
                </label>
                <Select
                  value={state.origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="h-12"
                >
                  <option value="pdv">PDV / Balcão</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="telefone">Telefone</option>
                  <option value="online">Online</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendedor Selecionado (Info) */}
        {state.vendorId && state.vendorName && (
          <Card className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-sm">
                  {state.vendorName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Vendedor</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{state.vendorName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botões */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1 h-12"
            size="lg"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Voltar
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!state.vendorId}
            className="flex-1 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            Continuar para Produtos
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

