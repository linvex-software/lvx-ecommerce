'use client'

import { useEffect, useRef, useState } from 'react'
import { CreditCard, QrCode, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchAPI } from '@/lib/api'

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
  const [isProcessing, setIsProcessing] = useState(false)
  const [mp, setMp] = useState<any>(null)
  const [cardForm, setCardForm] = useState<any>(null)
  const [isCardFormMounted, setIsCardFormMounted] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [identificationTypes, setIdentificationTypes] = useState<Array<{ id: string; name: string }>>([])
  const [installments, setInstallments] = useState<Array<{ installments: number; recommended_message: string }>>([])
  const [issuers, setIssuers] = useState<Array<{ id: string; name: string }>>([])
  const formRef = useRef<HTMLFormElement>(null)

  // Buscar chave pública do banco de dados
  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        console.log('[MercadoPagoPayment] Buscando chave pública do banco de dados...')
        const response = await fetchAPI('/payments/public-key', { method: 'GET' })
        
        if (response?.publicKey) {
          const dbPublicKey = response.publicKey as string
          console.log('[MercadoPagoPayment] Chave pública obtida do banco de dados:', dbPublicKey.substring(0, 20) + '...')
          setPublicKey(dbPublicKey)
          return dbPublicKey
        } else {
          console.warn('[MercadoPagoPayment] Chave pública não encontrada no banco de dados')
        }
      } catch (error) {
        console.warn('[MercadoPagoPayment] Erro ao buscar chave pública do banco:', error)
      }
      
      // Fallback para variáveis de ambiente
      const envPublicKey =
        process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ||
        process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ||
        process.env.MP_PUBLIC_KEY ||
        ''
      
      if (envPublicKey) {
        console.log('[MercadoPagoPayment] Usando chave pública das variáveis de ambiente')
        setPublicKey(envPublicKey)
        return envPublicKey
      }
      
      console.error('[MercadoPagoPayment] Chave pública não encontrada em nenhum lugar')
      onPaymentError('Chave pública do Mercado Pago não configurada. Configure no painel administrativo ou nas variáveis de ambiente.')
      return null
    }

    fetchPublicKey()
  }, [])

  // Carregar MercadoPago.js quando a chave pública estiver disponível
  useEffect(() => {
    if (!publicKey) {
      console.log('[MercadoPago] Aguardando chave pública...')
      return
    }

    console.log('[MercadoPago] Chave pública disponível, carregando SDK...', publicKey.substring(0, 20) + '...')

    const script = document.createElement('script')
    script.src = 'https://sdk.mercadopago.com/js/v2'
    script.async = true
    script.onload = () => {
      if (publicKey && window.MercadoPago) {
        try {
          const mpInstance = new window.MercadoPago(publicKey)
          setMp(mpInstance)
          console.log('[MercadoPago] SDK carregado com sucesso, instância criada')
        } catch (error) {
          console.error('[MercadoPago] Erro ao criar instância:', error)
          onPaymentError('Erro ao inicializar Mercado Pago. Verifique a chave pública.')
        }
      } else {
        console.error('[MercadoPago] SDK não carregado corretamente', { publicKey: !!publicKey, MercadoPago: !!window.MercadoPago })
        onPaymentError('Erro ao carregar SDK do Mercado Pago. Recarregue a página.')
      }
    }
    script.onerror = () => {
      console.error('[MercadoPago] Erro ao carregar SDK do Mercado Pago')
      onPaymentError('Erro ao carregar SDK do Mercado Pago. Verifique sua conexão.')
    }
    document.body.appendChild(script)

    return () => {
      // Verificar se o script ainda está no DOM antes de remover
      if (script.parentNode) {
        document.body.removeChild(script)
      }
    }
  }, [publicKey])

  // Carregar tipos de documento
  useEffect(() => {
    if (!mp) return

    mp.getIdentificationTypes()
      .then((types: Array<{ id: string; name: string }>) => {
        setIdentificationTypes(types)
      })
      .catch((error: Error) => {
        console.error('Error getting identification types:', error)
      })
  }, [mp])

  // Inicializar CardForm quando mp estiver disponível e método for cartão
  useEffect(() => {
    if (!mp || paymentMethod !== 'card') {
      setIsCardFormMounted(false)
      setCardForm(null)
      return
    }

    let attempts = 0
    const maxAttempts = 20 // Máximo de 2 segundos (20 * 100ms)

    // Aguardar o DOM estar pronto e os elementos existirem
    const initializeCardForm = async () => {
      attempts++

      // Verificar se todos os elementos necessários existem no DOM
      const requiredElements = [
        'form-checkout',
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

      const missingElements: string[] = []
      const allElementsExist = requiredElements.every(id => {
        const element = document.getElementById(id)
        const exists = element !== null
        
        if (!exists) {
          missingElements.push(id)
          return false
        }
        
        // Para elementos que serão preenchidos por iframes (divs), verificar se estão vazios
        const isIframeElement = ['form-checkout__cardNumber', 'form-checkout__expirationDate', 'form-checkout__securityCode'].includes(id)
        
        if (isIframeElement) {
          // Verificar se o elemento está vazio (sem filhos ou apenas espaços em branco)
          const isEmpty = element.children.length === 0 && (!element.textContent || element.textContent.trim() === '')
          if (!isEmpty) {
            console.warn(`[MercadoPagoPayment] Elemento ${id} não está vazio, limpando...`)
            element.innerHTML = '' // Limpar o elemento
          }
          return true // Elemento existe e está pronto para receber iframe
        }
        
        // Para outros elementos, verificar se estão visíveis
        const isVisible = element.offsetParent !== null
        if (!isVisible) {
          missingElements.push(id)
        }
        return isVisible
      })

      if (!allElementsExist) {
        if (attempts < maxAttempts) {
          console.log(`[MercadoPagoPayment] Aguardando elementos do formulário... (tentativa ${attempts}/${maxAttempts})`)
          if (missingElements.length > 0) {
            console.log(`[MercadoPagoPayment] Elementos faltando:`, missingElements)
          }
          setTimeout(() => initializeCardForm(), 100)
          return
        } else {
          console.error('[MercadoPagoPayment] Timeout aguardando elementos do formulário')
          console.error('[MercadoPagoPayment] Elementos que não foram encontrados:', missingElements)
          setIsCardFormMounted(false)
          onPaymentError('Erro ao carregar formulário de cartão. Recarregue a página e tente novamente.')
          return
        }
      }

      // Verificar se o formulário principal existe (não precisa estar visível, apenas no DOM)
      const formElement = document.getElementById('form-checkout')
      if (!formElement) {
        if (attempts < maxAttempts) {
          console.log(`[MercadoPagoPayment] Formulário não encontrado, aguardando... (tentativa ${attempts}/${maxAttempts})`)
          setTimeout(() => initializeCardForm(), 100)
          return
        } else {
          console.error('[MercadoPagoPayment] Timeout aguardando formulário')
          setIsCardFormMounted(false)
          onPaymentError('Erro ao carregar formulário de cartão. Recarregue a página e tente novamente.')
          return
        }
      }

      // Limpar CardForm anterior se existir
      if (cardForm) {
        try {
          // Tentar limpar o CardForm anterior se tiver método de limpeza
          if (typeof cardForm.unmount === 'function') {
            cardForm.unmount()
          }
        } catch (e) {
          console.warn('[MercadoPagoPayment] Erro ao limpar CardForm anterior:', e)
        }
        setCardForm(null)
      }

      try {
        console.log('[MercadoPagoPayment] Todos os elementos encontrados, inicializando CardForm...')
        console.log('[MercadoPagoPayment] Amount:', (amount / 100).toFixed(2))
        console.log('[MercadoPagoPayment] MP instance:', mp)
        
        // Verificar se mp.cardForm existe
        if (typeof mp.cardForm !== 'function') {
          throw new Error('mp.cardForm não é uma função. Verifique se o SDK do MercadoPago foi carregado corretamente.')
        }
        
        // Garantir que os elementos div estejam completamente vazios e prontos
        const iframeElements = ['form-checkout__cardNumber', 'form-checkout__expirationDate', 'form-checkout__securityCode']
        iframeElements.forEach(id => {
          const element = document.getElementById(id)
          if (element) {
            // Limpar completamente o elemento
            element.innerHTML = ''
            // Remover qualquer atributo que possa interferir
            element.removeAttribute('style')
            // Garantir que o elemento tenha pelo menos uma altura mínima
            if (!element.style.minHeight) {
              element.style.minHeight = '40px'
            }
          }
        })
        
        // Aguardar um frame adicional para garantir que o DOM foi atualizado
        await new Promise(resolve => setTimeout(resolve, 50))
        
        console.log('[MercadoPagoPayment] Inicializando CardForm com chave pública já configurada')
        
        const cardFormInstance = mp.cardForm({
          amount: (amount / 100).toFixed(2),
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
            onFormMounted: (error: Error | null) => {
              console.log('[MercadoPagoPayment] onFormMounted chamado, error:', error)
              
              if (error) {
                console.error('[MercadoPagoPayment] Erro ao montar CardForm:', error)
                console.error('[MercadoPagoPayment] Error name:', error.name)
                console.error('[MercadoPagoPayment] Error message:', error.message)
                console.error('[MercadoPagoPayment] Stack:', error.stack)
                setIsCardFormMounted(false)
                onPaymentError(`Erro ao montar o formulário de cartão: ${error.message}. Tente recarregar a página.`)
                return
              }
              console.log('[MercadoPagoPayment] CardForm montado com sucesso!')
              setIsCardFormMounted(true)
            },
            onFetching: (resource: string) => {
              console.log('[MercadoPagoPayment] Fetching resource:', resource)
            },
            onError: (error: any) => {
              console.error('[MercadoPagoPayment] CardForm error callback:', error)
              if (mountTimeoutId) {
                clearTimeout(mountTimeoutId)
                mountTimeoutId = null
              }
              setIsCardFormMounted(false)
              const errorMessage = error?.message || error?.toString() || 'Erro desconhecido no formulário'
              onPaymentError(`Erro no formulário de cartão: ${errorMessage}`)
            },
            onSubmit: async (event: Event) => {
              console.log('[MercadoPagoPayment] onSubmit chamado')
              event.preventDefault()
              if (isProcessing || isCreatingOrder) {
                console.warn('[MercadoPagoPayment] Form submission blocked:', { isProcessing, isCreatingOrder })
                return
              }

              await handleCardSubmit(event as unknown as React.FormEvent)
            }
          }
        })

        console.log('[MercadoPagoPayment] CardForm instance criada:', cardFormInstance)
        setCardForm(cardFormInstance)
        setIsCardFormMounted(false) // Reset inicial, será setado para true no onFormMounted
      } catch (error) {
        console.error('[MercadoPagoPayment] Erro ao criar CardForm:', error)
        console.error('[MercadoPagoPayment] Stack:', error instanceof Error ? error.stack : 'N/A')
        setIsCardFormMounted(false)
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        onPaymentError(`Erro ao inicializar formulário de cartão: ${errorMessage}. Tente recarregar a página.`)
      }
    }

    // Aguardar um pouco mais para garantir que o DOM foi completamente atualizado
    // Especialmente importante em React onde a renderização pode ser assíncrona
    const timeoutId = setTimeout(() => {
      // Usar requestAnimationFrame para garantir que o DOM foi renderizado
      requestAnimationFrame(() => {
        setTimeout(() => initializeCardForm(), 100)
      })
    }, 200)

    return () => {
      clearTimeout(timeoutId)
      setIsCardFormMounted(false)
      // Limpar CardForm ao desmontar
      if (cardForm) {
        try {
          if (typeof cardForm.unmount === 'function') {
            cardForm.unmount()
          }
        } catch (e) {
          // Ignorar erros de limpeza
        }
      }
      setCardForm(null)
    }
  }, [mp, paymentMethod, amount])

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardForm || isProcessing || isCreatingOrder) {
      console.warn('[MercadoPagoPayment] CardForm submission blocked:', { 
        cardForm: !!cardForm, 
        isProcessing, 
        isCreatingOrder 
      })
      if (!cardForm) {
        onPaymentError('Formulário não está pronto. Aguarde alguns instantes e tente novamente.')
      }
      return
    }

    setIsProcessing(true)

    try {
      // Verificar se o CardForm ainda está válido antes de obter os dados
      if (typeof cardForm.getCardFormData !== 'function') {
        throw new Error('CardForm não está mais válido. Recarregue a página e tente novamente.')
      }

      const cardFormData = cardForm.getCardFormData()

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

      const result: PaymentResult = await fetchAPI('/payments/process', {
        method: 'POST',
        body: JSON.stringify({
          orderId: finalOrderId,
          paymentMethod: 'credit_card',
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
          installments: Number(cardFormData.installments),
          issuerId: cardFormData.issuerId,
          paymentMethodId: cardFormData.paymentMethodId
        })
      })

      onPaymentSuccess(result)
    } catch (error) {
      console.error('[MercadoPagoPayment] Erro ao processar pagamento com cartão:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro ao processar pagamento. Tente novamente.'
      onPaymentError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

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

  if (paymentMethod === 'card') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${
              paymentMethod === 'card'
                ? 'border-foreground bg-secondary/50'
                : 'border-border hover:border-foreground/50'
            }`}
          >
            <CreditCard className="w-8 h-8 mb-2" />
            <span className="font-medium">Cartão</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('pix')}
            className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${
              paymentMethod === 'pix'
                ? 'border-foreground bg-secondary/50'
                : 'border-border hover:border-foreground/50'
            }`}
          >
            <QrCode className="w-8 h-8 mb-2" />
            <span className="font-medium">Pix</span>
          </button>
        </div>

        <form 
          id="form-checkout" 
          ref={formRef} 
          onSubmit={(e) => {
            e.preventDefault()
            // O CardForm já tem o callback onSubmit configurado
            // Não precisa fazer nada aqui, o CardForm vai processar
          }} 
          className="space-y-4"
        >
          <div className="space-y-2">
            <label htmlFor="form-checkout__cardNumber" className="text-sm font-medium">Número do Cartão</label>
            <div id="form-checkout__cardNumber" className="h-10 border rounded-md px-3 py-2" />
          </div>

          <div className="space-y-2">
            <label htmlFor="form-checkout__expirationDate" className="text-sm font-medium">Validade</label>
            <div id="form-checkout__expirationDate" className="h-10 border rounded-md px-3 py-2" />
          </div>

          <div className="space-y-2">
            <label htmlFor="form-checkout__securityCode" className="text-sm font-medium">CVV</label>
            <div id="form-checkout__securityCode" className="h-10 border rounded-md px-3 py-2" />
          </div>

          <div className="space-y-2">
            <label htmlFor="form-checkout__cardholderName" className="text-sm font-medium">Nome no Cartão</label>
            <Input
              id="form-checkout__cardholderName"
              placeholder="Como está no cartão"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="form-checkout__issuer" className="text-sm font-medium">Banco Emissor</label>
            <select id="form-checkout__issuer" className="h-10 w-full border rounded-md px-3 py-2 bg-background" />
          </div>

          <div className="space-y-2">
            <label htmlFor="form-checkout__installments" className="text-sm font-medium">Parcelas</label>
            <select id="form-checkout__installments" className="h-10 w-full border rounded-md px-3 py-2 bg-background" />
          </div>

          <div className="space-y-2">
            <label htmlFor="form-checkout__identificationType" className="text-sm font-medium">Tipo de Documento</label>
            <select id="form-checkout__identificationType" className="h-10 w-full border rounded-md px-3 py-2 bg-background" />
          </div>

          <div className="space-y-2">
            <label htmlFor="form-checkout__identificationNumber" className="text-sm font-medium">Número do Documento</label>
            <Input
              id="form-checkout__identificationNumber"
              placeholder="00000000000"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="form-checkout__cardholderEmail" className="text-sm font-medium">E-mail</label>
            <Input
              id="form-checkout__cardholderEmail"
              type="email"
              placeholder="seu@email.com"
              defaultValue={payer.email}
              required
            />
          </div>

                  <Button 
                    type="submit" 
                    disabled={isProcessing || !mp} 
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      'Pagar'
                    )}
                  </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setPaymentMethod('card')}
          className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${
            paymentMethod === 'card'
              ? 'border-foreground bg-secondary/50'
              : 'border-border hover:border-foreground/50'
          }`}
        >
          <CreditCard className="w-8 h-8 mb-2" />
          <span className="font-medium">Cartão</span>
        </button>
        <button
          type="button"
          onClick={() => setPaymentMethod('pix')}
          className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${
            paymentMethod === 'pix'
              ? 'border-foreground bg-secondary/50'
              : 'border-border hover:border-foreground/50'
          }`}
        >
          <QrCode className="w-8 h-8 mb-2" />
          <span className="font-medium">Pix</span>
        </button>
      </div>

      <form onSubmit={handlePixSubmit} className="space-y-4">
        <div className="bg-secondary/20 p-4 rounded-lg text-sm text-muted-foreground">
          <p>O QR Code para pagamento será gerado após a confirmação.</p>
          <p>Aprovação imediata após o pagamento.</p>
        </div>

        <Button type="submit" disabled={isProcessing} className="w-full">
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            'Gerar QR Code PIX'
          )}
        </Button>
      </form>
    </div>
  )
}

