'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, CreditCard, Truck, User, ChevronRight } from 'lucide-react'
import { Breadcrumbs } from '@/components/template/flor-de-menina/components/common/Breadcrumbs'
import { Button } from '@/components/template/flor-de-menina/components/ui/button'
import { Header } from '@/components/template/flor-de-menina/components/layout/Header'
import { useCartStore } from '@/lib/store/useCartStore'
import { useCreateOrder } from '@/lib/hooks/use-create-order'
import { cn } from '@/lib/utils'
import { DeliveryOptionsWithCep } from '@/components/checkout/DeliveryOptionsWithCep'
import { PaymentMethod } from '@/components/checkout/PaymentMethod'
import { PixQrCode } from '@/components/checkout/PixQrCode'
import { CouponInput } from '@/components/checkout/CouponInput'
import { useIsAuthenticated, useHasHydrated, useAuthStore } from '@/lib/store/useAuthStore'
import { useCustomerProfile } from '@/lib/hooks/use-customer-profile'
import { useAddresses } from '@/lib/hooks/use-addresses'
import { Alert, AlertDescription, AlertTitle } from '@/components/template/flor-de-menina/components/ui/alert'
import { AlertCircle, X } from 'lucide-react'
import { getMercadoPagoErrorMessage } from '@/lib/mercado-pago-error-messages'

type Step = 'personal' | 'address' | 'shipping' | 'payment' | 'review'

const steps: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'personal', label: 'Dados Pessoais', icon: User },
  { id: 'address', label: 'Endereço', icon: Truck },
  { id: 'shipping', label: 'Entrega', icon: Truck },
  { id: 'payment', label: 'Pagamento', icon: CreditCard },
  { id: 'review', label: 'Revisão', icon: Check },
]

interface SelectedDeliveryOption {
  type: 'shipping' | 'pickup_point'
  id: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCartStore()
  const { createOrder, isLoading: isCreatingOrder } = useCreateOrder()
  const isAuthenticated = useIsAuthenticated()
  const hasHydrated = useHasHydrated()
  const { customer } = useAuthStore()
  const { data: customerProfile } = useCustomerProfile()
  const { data: addresses } = useAddresses()
  const [currentStep, setCurrentStep] = useState<Step>('personal')
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<SelectedDeliveryOption | null>(null)
  const [shippingCost, setShippingCost] = useState<number>(0)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    shipping: 'standard',
    paymentMethod: 'credit',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
  })
  const [createdOrder, setCreatedOrder] = useState<any>(null)
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [hasInitializedForm, setHasInitializedForm] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discountValue: number
  } | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)

  // Verificar autenticação e redirecionar se necessário
  useEffect(() => {
    if (!hasHydrated) return

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent('/checkout')}`)
    }
  }, [isAuthenticated, hasHydrated, router])

  // Preencher formulário com dados do usuário logado
  useEffect(() => {
    if (!isAuthenticated || hasInitializedForm) return

    // Usar dados do perfil se disponível, senão usar dados do store
    const customerData = customerProfile || customer

    if (customerData) {
      setFormData((prev) => ({
        ...prev,
        name: customerData.name || prev.name,
        email: customerData.email || prev.email,
        phone: customerData.phone || prev.phone,
        cpf: customerData.cpf || prev.cpf,
      }))
    }

    // Buscar endereço padrão se disponível
    if (addresses && addresses.length > 0) {
      // Encontrar endereço padrão ou usar o primeiro
      const defaultAddress = addresses.find((addr) => addr.is_default) || addresses[0]

      if (defaultAddress) {
        // Extrair informações do endereço
        // O formato do street pode ser: "Rua, Número, Bairro: X, Complemento"
        const streetParts = defaultAddress.street?.split(',').map(s => s.trim()) || []

        let street = ''
        let number = ''
        let complement = ''
        let neighborhood = ''

        if (streetParts.length > 0) {
          street = streetParts[0] || ''
        }

        if (streetParts.length > 1) {
          // Segundo item pode ser número ou bairro
          const secondPart = streetParts[1]
          if (secondPart.includes('Bairro:')) {
            neighborhood = secondPart.replace('Bairro:', '').trim()
          } else {
            number = secondPart
          }
        }

        if (streetParts.length > 2) {
          // Terceiro item pode ser bairro ou complemento
          const thirdPart = streetParts[2]
          if (thirdPart.includes('Bairro:')) {
            neighborhood = thirdPart.replace('Bairro:', '').trim()
          } else if (!neighborhood) {
            // Se ainda não tem bairro, pode ser complemento
            complement = thirdPart
          }
        }

        if (streetParts.length > 3) {
          // Quarto item geralmente é complemento
          complement = streetParts[3]
        }

        // Formatar CEP (pode vir como zip ou zip_code)
        const zipCode = defaultAddress.zip || (defaultAddress as any).zip_code || ''
        const formattedCep = zipCode ? zipCode.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2') : ''

        setFormData((prev) => ({
          ...prev,
          cep: formattedCep || prev.cep,
          street: street || prev.street,
          number: number || prev.number,
          complement: complement || prev.complement,
          neighborhood: neighborhood || prev.neighborhood,
          city: defaultAddress.city || prev.city,
          state: defaultAddress.state || prev.state,
        }))
      }
    }

    setHasInitializedForm(true)
  }, [isAuthenticated, customer, customerProfile, addresses, hasInitializedForm])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  // Calcular total do carrinho
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const finalShippingCost = selectedDeliveryOption?.type === 'shipping' ? shippingCost : 0
  const discount = appliedCoupon?.discountValue || 0
  const total = subtotal - discount + finalShippingCost

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Formatação automática do CEP
    if (name === 'cep') {
      const cepNumbers = value.replace(/\D/g, '')
      const formattedCep = cepNumbers.replace(/(\d{5})(\d{3})/, '$1-$2')
      setFormData({ ...formData, [name]: formattedCep })

      // Limpar erro quando o usuário começar a digitar
      if (cepError) {
        setCepError(null)
      }

      // Buscar automaticamente quando tiver 8 dígitos
      if (cepNumbers.length === 8) {
        handleCepSearch(cepNumbers)
      }
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '')

    if (cep.length === 8) {
      await handleCepSearch(cep)
    } else if (cep.length > 0 && cep.length < 8) {
      setCepError('CEP deve conter 8 dígitos.')
    }
  }

  const handleCepSearch = async (cep: string) => {
    if (cep.length !== 8) {
      setCepError('CEP deve conter 8 dígitos.')
      return
    }

    setIsLoadingCep(true)
    setCepError(null)

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (data.erro) {
        setCepError('CEP não encontrado.')
        return
      }

      // Preencher campos automaticamente
      setFormData((prev) => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }))
    } catch (error) {
      setCepError('Erro ao buscar CEP. Tente novamente.')
    } finally {
      setIsLoadingCep(false)
    }
  }

  const nextStep = () => {
    // Validações básicas antes de avançar
    if (currentStep === 'personal') {
      if (!formData.name || !formData.email || !formData.phone) {
        alert('Por favor, preencha todos os campos obrigatórios.')
        return
      }
    }
    if (currentStep === 'address') {
      if (!formData.cep || !formData.street || !formData.number || !formData.neighborhood || !formData.city || !formData.state) {
        alert('Por favor, preencha todos os campos obrigatórios do endereço.')
        return
      }
    }
    if (currentStep === 'shipping') {
      if (!selectedDeliveryOption) {
        alert('Por favor, selecione uma opção de entrega.')
        return
      }
    }

    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id)
    }
  }

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id)
    }
  }

  const handleCreateOrder = async () => {
    try {
      if (!selectedDeliveryOption) {
        throw new Error('Por favor, selecione uma opção de entrega.')
      }

      // Converter itens do carrinho para formato da API
      const orderItems = items.map((item) => ({
        product_id: String(item.id),
        variant_id: item.variant_id ?? null,
        quantity: item.quantity,
        price: Math.round(item.price * 100), // converter para centavos
      }))

      // Preparar endereço de entrega (apenas se for shipping)
      const shippingAddress =
        selectedDeliveryOption.type === 'shipping' && formData.cep
          ? {
              zip_code: formData.cep.replace(/\D/g, ''),
              street: formData.street,
              number: formData.number,
              complement: formData.complement || undefined,
              neighborhood: formData.neighborhood,
              city: formData.city,
              state: formData.state,
              country: 'BR',
            }
          : null

      // Criar pedido via API
      const order = await createOrder({
        items: orderItems,
        shipping_cost: Math.round(finalShippingCost * 100), // converter para centavos
        delivery_type: selectedDeliveryOption.type,
        delivery_option_id: selectedDeliveryOption.id,
        coupon_code: appliedCoupon?.code || null,
        shipping_address: shippingAddress,
      })

      setCreatedOrder(order)
      return order
    } catch (error) {
      throw error
    }
  }

  const handlePaymentSuccess = (result: any) => {
    setPaymentResult(result)
    setIsProcessingPayment(false)
    setPaymentError(null) // Limpar erro anterior

    // Verificar se o pagamento foi rejeitado
    if (result.status === 'rejected' || result.paymentResult?.status === 'rejected') {
      // Tratar como erro para mostrar mensagem ao usuário
      const errorMessage = getMercadoPagoErrorMessage(
        result.paymentResult?.statusDetail || 'rejected'
      )
      handlePaymentError(errorMessage)
      return
    }

    // Se for PIX, mostrar QR Code
    if (result.paymentResult.qrCode) {
      // Já está no estado paymentResult, será exibido abaixo
    } else if (result.status === 'approved' || result.paymentResult?.status === 'approved') {
      // Pagamento aprovado - limpar carrinho e aguardar para mostrar mensagem de sucesso
      clearCart()
      
      // Redirecionar após 2 segundos para dar tempo de ver a mensagem de sucesso
      setTimeout(() => {
        if (createdOrder?.id) {
          router.push(`/minha-conta/pedidos/${createdOrder.id}`)
        } else {
          // Se não tiver orderId, redirecionar para lista de pedidos
          router.push('/minha-conta/pedidos')
        }
      }, 2000)
    }
  }

  const handlePaymentError = (error: string) => {
    setPaymentError(error)
    setIsProcessingPayment(false)

    // Scroll para o topo para mostrar o erro
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }


  // Mostrar loading enquanto verifica autenticação
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  // Se não está autenticado, mostrar mensagem de redirecionamento
  if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background">
        <Header />
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg">Redirecionando para login...</p>
          </div>
        </div>
            </div>
        )
    }

  if (items.length === 0) {
        return (
            <div className="min-h-screen bg-background">
        <Header />
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-3xl mb-4">Seu carrinho está vazio</h1>
            <Button asChild>
              <Link href="/">Continuar Comprando</Link>
            </Button>
          </div>
        </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Sacola', href: '/carrinho' }, { label: 'Checkout' }]} />

        {/* Exibir erro de pagamento se houver */}
        {paymentError && (
          <div className="mt-4">
            <Alert variant="destructive" className="relative">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro no Pagamento</AlertTitle>
              <AlertDescription className="mt-2">
                {paymentError}
              </AlertDescription>
              <button
                onClick={() => setPaymentError(null)}
                className="absolute right-2 top-2 rounded-md p-1 text-destructive/50 opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </Alert>
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* Progress */}
        <div className="mb-12 overflow-x-auto">
          <div className="flex items-center justify-center min-w-max gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
                  disabled={index > currentStepIndex}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full transition-colors',
                    currentStep === step.id
                      ? 'bg-primary text-primary-foreground'
                      : index < currentStepIndex
                      ? 'bg-primary/20 text-primary cursor-pointer'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <step.icon size={16} />
                  <span className="text-sm font-body hidden sm:inline">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <ChevronRight size={20} className="text-muted-foreground mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-background p-6 lg:p-8 border border-border">
              {/* Personal Data */}
              {currentStep === 'personal' && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="font-display text-2xl mb-6">Dados Pessoais</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-body mb-2">
                        Nome Completo <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body mb-2">
                        E-mail <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body mb-2">
                        Telefone <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="(00) 00000-0000"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-body mb-2">CPF</label>
                      <input
                        type="text"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Address */}
              {currentStep === 'address' && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="font-display text-2xl mb-6">Endereço de Entrega</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-body mb-2">
                        CEP <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="cep"
                          value={formData.cep}
                          onChange={handleInputChange}
                          onBlur={handleCepBlur}
                          maxLength={9}
                          className={cn(
                            "w-full px-4 py-3 border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary",
                            cepError ? "border-destructive" : "border-border"
                          )}
                          placeholder="00000-000"
                          required
                        />
                        {isLoadingCep && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      {cepError && (
                        <p className="text-xs text-destructive mt-1">{cepError}</p>
                      )}
                    </div>
                    <div></div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-body mb-2">
                        Rua <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Nome da rua"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body mb-2">
                        Número <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        name="number"
                        value={formData.number}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="000"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body mb-2">Complemento</label>
                      <input
                        type="text"
                        name="complement"
                        value={formData.complement}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Apto, Bloco..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body mb-2">
                        Bairro <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Bairro"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body mb-2">
                        Cidade <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Cidade"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body mb-2">
                        Estado <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="UF"
                        maxLength={2}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping */}
              {currentStep === 'shipping' && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="font-display text-2xl mb-6">Método de Entrega</h2>
                  {!formData.cep || formData.cep.replace(/\D/g, '').length !== 8 ? (
                    <div className="p-4 bg-secondary/50 border border-border">
                      <p className="text-sm text-muted-foreground">
                        Preencha o CEP no passo anterior para ver as opções de entrega disponíveis.
                      </p>
                    </div>
                  ) : (
                    <DeliveryOptionsWithCep
                      zipCode={formData.cep}
                      onSelectionChange={(option) => {
                        if (option) {
                          setSelectedDeliveryOption({
                            type: option.type,
                            id: option.id,
                          })
                          // Atualizar custo de frete se disponível
                          if (option.type === 'shipping' && option.price) {
                            setShippingCost(option.price / 100) // converter de centavos para reais
                          } else {
                            setShippingCost(0)
                          }
                        } else {
                          setSelectedDeliveryOption(null)
                          setShippingCost(0)
                        }
                      }}
                    />
                  )}
                </div>
              )}

              {/* Payment */}
              {currentStep === 'payment' && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="font-display text-2xl mb-6">Pagamento</h2>

                  {paymentResult?.paymentResult?.qrCode ? (
                    <div>
                      <PixQrCode
                        qrCode={paymentResult.paymentResult.qrCode}
                        qrCodeBase64={paymentResult.paymentResult.qrCodeBase64}
                        ticketUrl={paymentResult.paymentResult.ticketUrl}
                      />
                      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          <strong>Pagamento PIX gerado com sucesso!</strong> Escaneie o QR Code ou copie o código para pagar.
                          Após o pagamento, você receberá a confirmação por e-mail.
                        </p>
                      </div>
                    </div>
                  ) : paymentResult?.status === 'approved' || paymentResult?.paymentResult?.status === 'approved' ? (
                    <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                      <div className="mb-4">
                        <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                          <Check className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="font-display text-xl mb-2 text-green-800 dark:text-green-200">
                          Pagamento Aprovado!
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                          Seu pagamento foi processado com sucesso.
                        </p>
                        {createdOrder?.id && (
                          <p className="text-xs text-green-600 dark:text-green-400 mb-4">
                            Redirecionando para seu pedido...
                          </p>
                        )}
                      </div>
                      {createdOrder?.id && (
                        <Button 
                          onClick={() => {
                            router.push(`/minha-conta/pedidos/${createdOrder.id}`)
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Ver Pedido Agora
                        </Button>
                      )}
                    </div>
                  ) : (
                    <PaymentMethod
                      orderId={createdOrder?.id || ''}
                      amount={Math.round(total * 100)} // converter para centavos
                      payer={{
                        email: formData.email,
                        firstName: formData.name.split(' ')[0] || '',
                        lastName: formData.name.split(' ').slice(1).join(' ') || '',
                        identification: formData.cpf
                          ? {
                              type: 'CPF',
                              number: formData.cpf.replace(/\D/g, '')
                            }
                          : undefined
                      }}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                      onCreateOrder={handleCreateOrder}
                      isCreatingOrder={isCreatingOrder}
                    />
                  )}
                </div>
              )}

              {/* Review */}
              {currentStep === 'review' && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="font-display text-2xl mb-6">Revisão do Pedido</h2>

                  <div className="space-y-4">
                    <div className="p-4 bg-secondary/50">
                      <h3 className="font-body font-medium mb-2">Dados Pessoais</h3>
                      <p className="text-sm text-muted-foreground">{formData.name}</p>
                      <p className="text-sm text-muted-foreground">{formData.email}</p>
                      <p className="text-sm text-muted-foreground">{formData.phone}</p>
                    </div>

                    <div className="p-4 bg-secondary/50">
                      <h3 className="font-body font-medium mb-2">Endereço</h3>
                      <p className="text-sm text-muted-foreground">
                        {formData.street}, {formData.number} {formData.complement && `- ${formData.complement}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formData.neighborhood}, {formData.city} - {formData.state}
                      </p>
                      <p className="text-sm text-muted-foreground">CEP: {formData.cep}</p>
                    </div>

                    <div className="p-4 bg-secondary/50">
                      <h3 className="font-body font-medium mb-2">Entrega</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedDeliveryOption?.type === 'pickup_point'
                          ? 'Retirada em ponto'
                          : 'Entrega em endereço'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-8 border-t border-border">
                {currentStepIndex > 0 ? (
                  <Button variant="outline" onClick={prevStep}>
                    Voltar
                  </Button>
                ) : (
                  <div />
                )}
                {currentStep === 'review' ? (
                  <Button onClick={nextStep} size="lg">
                    Continuar para Pagamento
                  </Button>
                ) : currentStep === 'payment' && paymentResult?.paymentResult?.qrCode ? (
                  <Button onClick={() => {
                    clearCart()
                    router.push(`/minha-conta/pedidos/${createdOrder?.id}`)
                  }}>
                    Ver Pedido
                  </Button>
                ) : (
                  <Button onClick={nextStep}>Continuar</Button>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-background border border-border p-6 sticky top-24">
              <h2 className="font-display text-xl mb-6">Resumo</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={`${item.id}-${item.variant_id || ''}`} className="flex gap-3">
                    <div className="w-16 h-20 bg-secondary flex-shrink-0">
                      <img
                        src={item.image || '/placeholder.jpg'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                      <p className="text-sm font-medium mt-1">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
                    </div>

              {/* Campo de Cupom */}
              <div className="pt-4 border-t border-border">
                <CouponInput
                  subtotal={subtotal}
                  onCouponApplied={(couponData) => {
                    setAppliedCoupon({
                      code: couponData.code,
                      discountValue: couponData.discountValue,
                    })
                  }}
                  onCouponRemoved={() => setAppliedCoupon(null)}
                  appliedCoupon={appliedCoupon?.code || null}
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Desconto ({appliedCoupon.code})</span>
                    <span>-{formatPrice(appliedCoupon.discountValue)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span>{finalShippingCost === 0 ? 'Grátis' : formatPrice(finalShippingCost)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="font-display text-lg">Total</span>
                  <span className="font-display text-xl">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
                    </div>
                </div>
        </div>
    )
}
