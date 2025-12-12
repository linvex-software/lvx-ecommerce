'use client'

import { useEffect, useRef, useState } from 'react'
import { CreditCard, QrCode, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchAPI } from '@/lib/api'
import { getMercadoPagoErrorMessage } from '@/lib/mercado-pago-error-messages'

declare global {
  interface Window {
    MercadoPago: any
  }
}

interface MercadoPagoPaymentProps {
  orderId?: string
  amount: number // em centavos
  payer: {
    email: string
    firstName?: string
    lastName?: string
    identification?: {
      type: string
      number: string
    }
  }
  onPaymentSuccess: (result: PaymentResult) => void
  onPaymentError: (error: string) => void
  onCreateOrder?: () => Promise<{ id: string } | undefined>
  isCreatingOrder?: boolean
}

interface PaymentResult {
  transactionId: string
  status: string
  paymentResult: {
    id: string
    status: string
    statusDetail: string
    qrCode?: string
    qrCodeBase64?: string
    ticketUrl?: string
  }
}

export function MercadoPagoPayment({
  orderId,
  amount,
  payer,
  onPaymentSuccess,
  onPaymentError,
  onCreateOrder,
  isCreatingOrder = false
}: MercadoPagoPaymentProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card')
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit')
  const cardTypeRef = useRef<'credit' | 'debit'>('credit')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [mp, setMp] = useState<any>(null)
  const [cardForm, setCardForm] = useState<any>(null)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const cardFormRef = useRef<any>(null)

  // Buscar chave pública do banco de dados
  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        const response = await fetchAPI('/payments/public-key', { method: 'GET' })
        
        if (response?.publicKey) {
          setPublicKey(response.publicKey as string)
        } else {
          // Fallback para variáveis de ambiente
          const envPublicKey =
            process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ||
            process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ||
            ''
          
          if (envPublicKey) {
            setPublicKey(envPublicKey)
          } else {
            onPaymentError('Chave pública do Mercado Pago não configurada. Configure no painel administrativo.')
          }
        }
      } catch (error) {
        console.error('[MercadoPagoPayment] Erro ao buscar chave pública:', error)
        onPaymentError('Erro ao buscar configurações do Mercado Pago.')
      }
    }

    fetchPublicKey()
  }, [onPaymentError])

  // Função para validar todos os campos obrigatórios
  const validateForm = (): boolean => {
    if (!formRef.current || !cardFormRef.current) {
      setIsFormValid(false)
      return false
    }

    try {
      // Verificar campos HTML diretamente (não usamos getCardFormData pois ele só retorna token após submit)
      const cardholderName = (document.getElementById('form-checkout__cardholderName') as HTMLInputElement)?.value?.trim()
      const issuer = (document.getElementById('form-checkout__issuer') as HTMLSelectElement)?.value?.trim()
      const identificationType = (document.getElementById('form-checkout__identificationType') as HTMLSelectElement)?.value?.trim()
      const identificationNumber = (document.getElementById('form-checkout__identificationNumber') as HTMLInputElement)?.value?.trim()
      const cardholderEmail = (document.getElementById('form-checkout__cardholderEmail') as HTMLInputElement)?.value?.trim()

      // Validar nome do titular
      if (!cardholderName || cardholderName.length < 3) {
        setIsFormValid(false)
        return false
      }

      // Validar banco emissor
      if (!issuer) {
        setIsFormValid(false)
        return false
      }

      // Parcelas obrigatório apenas para crédito
      if (cardType === 'credit') {
        const installments = (document.getElementById('form-checkout__installments') as HTMLSelectElement)?.value?.trim()
        if (!installments) {
          setIsFormValid(false)
          return false
        }
      }

      // Validar tipo de documento
      if (!identificationType) {
        setIsFormValid(false)
        return false
      }

      // Validar número do documento
      if (!identificationNumber || identificationNumber.length < 8) {
        setIsFormValid(false)
        return false
      }

      // Validar e-mail
      if (!cardholderEmail || !cardholderEmail.includes('@') || !cardholderEmail.includes('.')) {
        setIsFormValid(false)
        return false
      }

      // Verificar se os iframes do CardForm têm conteúdo (número, validade, CVV)
      // Não conseguimos acessar o conteúdo dos iframes por segurança, então assumimos válido se existirem
      const cardNumberIframe = document.querySelector('#form-checkout__cardNumber iframe')
      const expirationDateIframe = document.querySelector('#form-checkout__expirationDate iframe')
      const securityCodeIframe = document.querySelector('#form-checkout__securityCode iframe')

      if (!cardNumberIframe || !expirationDateIframe || !securityCodeIframe) {
        setIsFormValid(false)
        return false
      }

      console.log('[MercadoPagoPayment] Formulário válido!', { cardType: cardTypeRef.current })
      setIsFormValid(true)
      return true
    } catch (error) {
      console.warn('[MercadoPagoPayment] Erro ao validar formulário:', error)
      setIsFormValid(false)
      return false
    }
  }

  // Sincronizar ref com estado
  useEffect(() => {
    cardTypeRef.current = cardType
    // Revalidar quando tipo de cartão mudar
    if (cardFormRef.current) {
      setTimeout(() => validateForm(), 100)
    }
  }, [cardType])

  // Validar formulário quando campos mudarem
  useEffect(() => {
    if (!formRef.current || !cardFormRef.current) return

    const handleInputChange = () => {
      validateForm()
    }

    // Adicionar listeners para campos HTML
    const cardholderName = document.getElementById('form-checkout__cardholderName')
    const issuer = document.getElementById('form-checkout__issuer')
    const installments = document.getElementById('form-checkout__installments')
    const identificationType = document.getElementById('form-checkout__identificationType')
    const identificationNumber = document.getElementById('form-checkout__identificationNumber')
    const cardholderEmail = document.getElementById('form-checkout__cardholderEmail')

    cardholderName?.addEventListener('input', handleInputChange)
    cardholderName?.addEventListener('blur', handleInputChange)
    issuer?.addEventListener('change', handleInputChange)
    installments?.addEventListener('change', handleInputChange)
    identificationType?.addEventListener('change', handleInputChange)
    identificationNumber?.addEventListener('input', handleInputChange)
    identificationNumber?.addEventListener('blur', handleInputChange)
    cardholderEmail?.addEventListener('input', handleInputChange)
    cardholderEmail?.addEventListener('blur', handleInputChange)

    return () => {
      cardholderName?.removeEventListener('input', handleInputChange)
      cardholderName?.removeEventListener('blur', handleInputChange)
      issuer?.removeEventListener('change', handleInputChange)
      installments?.removeEventListener('change', handleInputChange)
      identificationType?.removeEventListener('change', handleInputChange)
      identificationNumber?.removeEventListener('input', handleInputChange)
      identificationNumber?.removeEventListener('blur', handleInputChange)
      cardholderEmail?.removeEventListener('input', handleInputChange)
      cardholderEmail?.removeEventListener('blur', handleInputChange)
    }
  }, [cardType, cardForm])

  // Carregar MercadoPago.js
  useEffect(() => {
    if (!publicKey || isSDKLoaded) return

    // Verificar se já está carregado
    if (window.MercadoPago) {
      try {
        const mpInstance = new window.MercadoPago(publicKey, { locale: 'pt-BR' })
        setMp(mpInstance)
        setIsSDKLoaded(true)
        return
      } catch (error) {
        console.error('[MercadoPagoPayment] Erro ao criar instância:', error)
        onPaymentError('Erro ao inicializar Mercado Pago.')
        return
      }
    }

    // Carregar script
    const script = document.createElement('script')
    script.src = 'https://sdk.mercadopago.com/js/v2'
    script.async = true
    script.onload = () => {
      if (window.MercadoPago && publicKey) {
        try {
          const mpInstance = new window.MercadoPago(publicKey, { locale: 'pt-BR' })
          setMp(mpInstance)
          setIsSDKLoaded(true)
        } catch (error) {
          console.error('[MercadoPagoPayment] Erro ao criar instância:', error)
          onPaymentError('Erro ao inicializar Mercado Pago.')
        }
      }
    }
    script.onerror = () => {
      onPaymentError('Erro ao carregar SDK do Mercado Pago.')
    }
    document.body.appendChild(script)

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script)
      }
    }
  }, [publicKey, isSDKLoaded, onPaymentError])

  // Inicializar CardForm seguindo documentação oficial
  useEffect(() => {
    if (!mp || paymentMethod !== 'card' || !publicKey || !formRef.current) return

    // Aguardar um pouco para garantir que o DOM está pronto (especialmente o campo de parcelas)
    const timeoutId = setTimeout(() => {
      if (!formRef.current) return

      // Verificar se todos os elementos necessários existem no DOM
      const requiredElements = [
        'form-checkout__cardNumber',
        'form-checkout__expirationDate',
        'form-checkout__securityCode',
        'form-checkout__cardholderName',
        'form-checkout__issuer',
        'form-checkout__installments',
        'form-checkout__identificationType',
        'form-checkout__identificationNumber',
        'form-checkout__cardholderEmail'
      ]

      const missingElements = requiredElements.filter(id => !document.getElementById(id))
      if (missingElements.length > 0) {
        console.warn('[MercadoPagoPayment] Elementos não encontrados no DOM:', missingElements)
        return
      }

      // Limpar CardForm anterior se existir
    if (cardFormRef.current) {
      try {
        if (typeof cardFormRef.current.unmount === 'function') {
          cardFormRef.current.unmount()
        }
      } catch (error) {
        console.warn('[MercadoPagoPayment] Erro ao desmontar CardForm anterior:', error)
      }
      cardFormRef.current = null
      setCardForm(null)
    }

    // Converter amount de centavos para reais (string)
    const amountInReais = (amount / 100).toFixed(2)

    try {
      const form = mp.cardForm({
        amount: amountInReais,
        iframe: true,
        form: {
          id: 'form-checkout',
          cardNumber: {
            id: 'form-checkout__cardNumber',
            placeholder: 'Número do cartão'
          },
          expirationDate: {
            id: 'form-checkout__expirationDate',
            placeholder: 'MM/YY'
          },
          securityCode: {
            id: 'form-checkout__securityCode',
            placeholder: 'Código de segurança'
          },
          cardholderName: {
            id: 'form-checkout__cardholderName',
            placeholder: 'Titular do cartão'
          },
          issuer: {
            id: 'form-checkout__issuer',
            placeholder: 'Banco emissor'
          },
          installments: {
            id: 'form-checkout__installments',
            placeholder: 'Parcelas'
          },
          identificationType: {
            id: 'form-checkout__identificationType',
            placeholder: 'Tipo de documento'
          },
          identificationNumber: {
            id: 'form-checkout__identificationNumber',
            placeholder: 'Número do documento'
          },
          cardholderEmail: {
            id: 'form-checkout__cardholderEmail',
            placeholder: 'E-mail'
          }
        },
        callbacks: {
          onFormMounted: (error: any) => {
            if (error) {
              console.error('[MercadoPagoPayment] Erro ao montar formulário:', error)
              onPaymentError('Erro ao carregar formulário de pagamento. Recarregue a página.')
              return
            }
            console.log('[MercadoPagoPayment] Formulário montado com sucesso')
            // Validar formulário após montar
            validateForm()
          },
          onValidityChange: (field: string, error: any) => {
            // Validar formulário quando qualquer campo mudar
            validateForm()
          },
          onSubmit: async (event: Event) => {
            event.preventDefault()
            
            if (isProcessing || isCreatingOrder) {
              return
            }

            // Validar novamente antes de enviar
            if (!validateForm()) {
              onPaymentError('Por favor, preencha todos os campos obrigatórios.')
              return
            }

            setIsProcessing(true)

            try {
              // Obter dados do formulário
              const cardFormData = cardFormRef.current.getCardFormData()

              if (!cardFormData.token) {
                throw new Error('Token do cartão não foi gerado. Verifique os dados do cartão.')
              }

              // Criar pedido primeiro se não existir
              let finalOrderId = orderId
              if (!finalOrderId && onCreateOrder) {
                const order = await onCreateOrder()
                if (order && order.id) {
                  finalOrderId = order.id
                } else {
                  throw new Error('Erro ao criar pedido')
                }
              }

              if (!finalOrderId) {
                throw new Error('Pedido não foi criado. Tente novamente.')
              }

              // Processar pagamento - usar ref para garantir valor atual
              const currentCardType = cardTypeRef.current
              console.log('[MercadoPagoPayment] Tipo de cartão selecionado:', currentCardType)
              const paymentMethodValue = currentCardType === 'credit' ? 'credit_card' : 'debit_card'
              console.log('[MercadoPagoPayment] Payment method a ser enviado:', paymentMethodValue)
              
              const result: PaymentResult = await fetchAPI('/payments/process', {
                method: 'POST',
                body: JSON.stringify({
                  orderId: finalOrderId,
                  paymentMethod: paymentMethodValue,
                  payer: {
                    email: payer.email,
                    firstName: payer.firstName,
                    lastName: payer.lastName,
                    identification: payer.identification || {
                      type: cardFormData.identificationType,
                      number: cardFormData.identificationNumber
                    }
                  },
                  cardToken: cardFormData.token,
                  installments: currentCardType === 'credit' ? Number(cardFormData.installments) : 1,
                  issuerId: cardFormData.issuerId,
                  paymentMethodId: cardFormData.paymentMethodId
                })
              })

              // Verificar se o pagamento foi rejeitado
              if (result.status === 'rejected' || result.paymentResult?.status === 'rejected') {
                const errorMessage = getMercadoPagoErrorMessage(
                  result.paymentResult?.statusDetail || 'rejected'
                )
                onPaymentError(errorMessage)
                return
              }

              onPaymentSuccess(result)
            } catch (error) {
              console.error('[MercadoPagoPayment] Erro ao processar pagamento:', error)
              const errorMessage = error instanceof Error 
                ? error.message 
                : 'Erro ao processar pagamento. Tente novamente.'
              onPaymentError(errorMessage)
            } finally {
              setIsProcessing(false)
            }
          },
          onFetching: (resource: string) => {
            console.log('[MercadoPagoPayment] Buscando recurso:', resource)
          }
        }
      })

      cardFormRef.current = form
      setCardForm(form)
    } catch (error) {
      console.error('[MercadoPagoPayment] Erro ao inicializar CardForm:', error)
      onPaymentError('Erro ao inicializar formulário de pagamento. Recarregue a página.')
    }
    }, 100) // Aguardar 100ms para garantir que o DOM está pronto

    return () => {
      clearTimeout(timeoutId)
      if (cardFormRef.current) {
        try {
          if (typeof cardFormRef.current.unmount === 'function') {
            cardFormRef.current.unmount()
          }
        } catch (error) {
          // Ignorar erro se CardForm não estiver montado
          if (!error?.message?.includes('not mounted')) {
            console.warn('[MercadoPagoPayment] Erro ao desmontar CardForm:', error)
          }
        }
        cardFormRef.current = null
        setCardForm(null)
      }
    }
  }, [mp, paymentMethod, publicKey, amount, orderId, payer, onCreateOrder, onPaymentSuccess, onPaymentError, isProcessing, isCreatingOrder])

  const handlePixSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isProcessing || isCreatingOrder) return

    setIsProcessing(true)

    try {
      // Criar pedido primeiro se não existir
      let finalOrderId = orderId
      if (!finalOrderId && onCreateOrder) {
        const order = await onCreateOrder()
        if (order && order.id) {
          finalOrderId = order.id
        } else {
          throw new Error('Erro ao criar pedido')
        }
      }

      if (!finalOrderId) {
        throw new Error('Pedido não foi criado. Tente novamente.')
      }

      const result: PaymentResult = await fetchAPI('/payments/process', {
        method: 'POST',
        body: JSON.stringify({
          orderId: finalOrderId,
          paymentMethod: 'pix',
          payer: {
            email: payer.email,
            firstName: payer.firstName,
            lastName: payer.lastName,
            identification: payer.identification
          }
        })
      })

      onPaymentSuccess(result)
    } catch (error) {
      console.error('[MercadoPagoPayment] Erro ao processar pagamento PIX:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro ao processar pagamento. Tente novamente.'
      onPaymentError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Seleção de método de pagamento */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant={paymentMethod === 'card' ? 'default' : 'outline'}
          onClick={() => setPaymentMethod('card')}
          className="flex-1"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Cartão
        </Button>
        <Button
          type="button"
          variant={paymentMethod === 'pix' ? 'default' : 'outline'}
          onClick={() => setPaymentMethod('pix')}
          className="flex-1"
        >
          <QrCode className="mr-2 h-4 w-4" />
          PIX
        </Button>
      </div>

      {/* Seleção de tipo de cartão (crédito ou débito) */}
      {paymentMethod === 'card' && (
        <div className="flex gap-4">
          <Button
            type="button"
            variant={cardType === 'credit' ? 'default' : 'outline'}
            onClick={() => {
              console.log('[MercadoPagoPayment] Mudando para crédito')
              setCardType('credit')
              cardTypeRef.current = 'credit'
            }}
            className="flex-1"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Crédito
          </Button>
          <Button
            type="button"
            variant={cardType === 'debit' ? 'default' : 'outline'}
            onClick={() => {
              console.log('[MercadoPagoPayment] Mudando para débito')
              setCardType('debit')
              cardTypeRef.current = 'debit'
            }}
            className="flex-1"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Débito
          </Button>
        </div>
      )}

      {/* Formulário de cartão */}
      {paymentMethod === 'card' && (
        <div>
          {!isSDKLoaded || !mp ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando formulário de pagamento...</span>
            </div>
          ) : (
            <form id="form-checkout" ref={formRef}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="form-checkout__cardNumber" className="block text-sm font-medium mb-2">
                    Número do cartão
                  </label>
                  <div id="form-checkout__cardNumber" className="h-10 border rounded-md px-3 py-2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="form-checkout__expirationDate" className="block text-sm font-medium mb-2">
                      Validade
                    </label>
                    <div id="form-checkout__expirationDate" className="h-10 border rounded-md px-3 py-2" />
                  </div>
                  <div>
                    <label htmlFor="form-checkout__securityCode" className="block text-sm font-medium mb-2">
                      CVV
                    </label>
                    <div id="form-checkout__securityCode" className="h-10 border rounded-md px-3 py-2" />
                  </div>
                </div>

                <div>
                  <label htmlFor="form-checkout__cardholderName" className="block text-sm font-medium mb-2">
                    Nome do titular
                  </label>
                  <input
                    type="text"
                    id="form-checkout__cardholderName"
                    className="w-full h-10 border rounded-md px-3 py-2"
                    defaultValue={payer.firstName && payer.lastName ? `${payer.firstName} ${payer.lastName}` : ''}
                  />
                </div>

                <div>
                  <label htmlFor="form-checkout__issuer" className="block text-sm font-medium mb-2">
                    Banco emissor
                  </label>
                  <select id="form-checkout__issuer" className="w-full h-10 border rounded-md px-3 py-2">
                    <option value="">Selecione o banco</option>
                  </select>
                </div>

                <div className={cardType === 'debit' ? 'hidden' : ''}>
                  <label htmlFor="form-checkout__installments" className="block text-sm font-medium mb-2">
                    Parcelas
                  </label>
                  <select id="form-checkout__installments" className="w-full h-10 border rounded-md px-3 py-2">
                    <option value="">Selecione as parcelas</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="form-checkout__identificationType" className="block text-sm font-medium mb-2">
                      Tipo de documento
                    </label>
                    <select id="form-checkout__identificationType" className="w-full h-10 border rounded-md px-3 py-2">
                      <option value="">Selecione</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="form-checkout__identificationNumber" className="block text-sm font-medium mb-2">
                      Número do documento
                    </label>
                    <input
                      type="text"
                      id="form-checkout__identificationNumber"
                      className="w-full h-10 border rounded-md px-3 py-2"
                      defaultValue={payer.identification?.number || ''}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="form-checkout__cardholderEmail" className="block text-sm font-medium mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    id="form-checkout__cardholderEmail"
                    className="w-full h-10 border rounded-md px-3 py-2"
                    defaultValue={payer.email}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isProcessing || isCreatingOrder || !isFormValid}
                  className="w-full"
                >
                  {isProcessing || isCreatingOrder ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Pagar'
                  )}
                </Button>
                {!isFormValid && (
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Preencha todos os campos obrigatórios para continuar
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* Formulário PIX */}
      {paymentMethod === 'pix' && (
        <form onSubmit={handlePixSubmit}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Você será redirecionado para gerar o código PIX após confirmar o pagamento.
            </p>
            <Button
              type="submit"
              disabled={isProcessing || isCreatingOrder}
              className="w-full"
            >
              {isProcessing || isCreatingOrder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Gerar código PIX
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
