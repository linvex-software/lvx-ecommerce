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
  const [isProcessing, setIsProcessing] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [isBricksLoaded, setIsBricksLoaded] = useState(false)
  const [isBrickReady, setIsBrickReady] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState<string | undefined>(orderId)
  const [isCreatingOrderLocal, setIsCreatingOrderLocal] = useState(false)
  const [orderCreationError, setOrderCreationError] = useState<string | null>(null)
  const brickControllerRef = useRef<any>(null)
  const containerId = 'cardPaymentBrick_container'

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

  // Carregar MercadoPago SDK
  useEffect(() => {
    if (!publicKey || isBricksLoaded) return

    // Verificar se já está carregado
    if (window.MercadoPago) {
      setIsBricksLoaded(true)
      return
    }

    // Carregar script do MercadoPago SDK
    const script = document.createElement('script')
    script.src = 'https://sdk.mercadopago.com/js/v2'
    script.async = true
    script.onload = () => {
      if (window.MercadoPago) {
        setIsBricksLoaded(true)
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
  }, [publicKey, isBricksLoaded, onPaymentError])

  // Criar pedido automaticamente se não existir
  useEffect(() => {
    if (paymentMethod !== 'card' || currentOrderId || !onCreateOrder || isCreatingOrder || isCreatingOrderLocal || orderCreationError) return

    const createOrderIfNeeded = async () => {
      setIsCreatingOrderLocal(true)
      setOrderCreationError(null)
      try {
        const order = await onCreateOrder()
        if (order && order.id) {
          setCurrentOrderId(order.id)
          setOrderCreationError(null)
        } else {
          throw new Error('Pedido criado mas sem ID')
        }
      } catch (error) {
        console.error('[MercadoPagoPayment] Erro ao criar pedido:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erro ao criar pedido. Tente novamente.'
        setOrderCreationError(errorMessage)
        onPaymentError(errorMessage)
      } finally {
        setIsCreatingOrderLocal(false)
      }
    }

    createOrderIfNeeded()
  }, [paymentMethod, currentOrderId, onCreateOrder, isCreatingOrder, isCreatingOrderLocal, orderCreationError, onPaymentError])

  // Atualizar currentOrderId quando orderId prop mudar
  useEffect(() => {
    if (orderId && orderId !== currentOrderId) {
      setCurrentOrderId(orderId)
      setOrderCreationError(null) // Limpar erro quando orderId for fornecido
    }
  }, [orderId, currentOrderId])

  // Renderizar Card Payment Brick
  useEffect(() => {
    if (!publicKey || !isBricksLoaded || paymentMethod !== 'card' || !currentOrderId) {
      // Limpar Brick se condições não forem atendidas
      if (brickControllerRef.current) {
        try {
          if (typeof brickControllerRef.current.unmount === 'function') {
            brickControllerRef.current.unmount()
          }
        } catch (error) {
          console.warn('[MercadoPagoPayment] Erro ao desmontar Brick:', error)
        }
        brickControllerRef.current = null
      }
      setIsBrickReady(false)
      return
    }

    // Aguardar um pouco para garantir que o container está no DOM
    // Usar requestAnimationFrame para garantir que o DOM foi atualizado
    const checkAndRender = () => {
      requestAnimationFrame(() => {
        const container = document.getElementById(containerId)
        if (!container) {
          console.warn('[MercadoPagoPayment] Container não encontrado, tentando novamente em 100ms...')
          setTimeout(checkAndRender, 100)
          return
        }

        const renderCardPaymentBrick = async () => {
          try {
            // Verificar se MercadoPago está disponível
            if (!window.MercadoPago) {
              throw new Error('MercadoPago SDK não está carregado')
            }

            // Verificar novamente se o container existe
            const containerElement = document.getElementById(containerId)
            if (!containerElement) {
              throw new Error(`Container com ID '${containerId}' não encontrado no DOM`)
            }

            // Inicializar Mercado Pago
            const mp = new window.MercadoPago(publicKey, {
              locale: 'pt-BR'
            })

            // Converter amount de centavos para reais
            const amountInReais = (amount / 100).toFixed(2)

            const settings = {
              initialization: {
                amount: parseFloat(amountInReais)
              },
              callbacks: {
            onReady: () => {
              console.log('[MercadoPagoPayment] Brick está pronto')
              setIsBrickReady(true)
            },
            onSubmit: async (formData: any, additionalData: any) => {
              return new Promise(async (resolve, reject) => {
                if (isProcessing || isCreatingOrder) {
                  reject(new Error('Pagamento já está sendo processado'))
                  return
                }

                setIsProcessing(true)

                try {
                  // Usar orderId atual
                  const finalOrderId = currentOrderId
                  if (!finalOrderId) {
                    throw new Error('Pedido não foi criado. Tente novamente.')
                  }

                  // Preparar dados para Orders API
                  const submitData = {
                    type: 'online',
                    total_amount: String(formData.transaction_amount),
                    external_reference: finalOrderId,
                    processing_mode: 'automatic',
                    transactions: {
                      payments: [
                        {
                          amount: String(formData.transaction_amount),
                          payment_method: {
                            id: formData.payment_method_id,
                            type: additionalData.paymentTypeId || 'credit_card',
                            token: formData.token,
                            installments: formData.installments
                          }
                        }
                      ]
                    },
                    payer: {
                      email: formData.payer.email,
                      identification: formData.payer.identification
                    }
                  }

                  // Enviar para backend
                  const response = await fetchAPI('/process_order', {
                    method: 'POST',
                    body: JSON.stringify(submitData)
                  })

                  // Verificar se o pagamento foi rejeitado
                  if (response.status === 'rejected' || response.payment?.status === 'rejected') {
                    const errorMessage = getMercadoPagoErrorMessage(
                      response.payment?.statusDetail || response.statusDetail || 'rejected'
                    )
                    onPaymentError(errorMessage)
                    reject(new Error(errorMessage))
                    return
                  }

                  // Mapear resposta para formato esperado
                  // O backend retorna: { orderId, status, statusDetail, payment: { id, status, statusDetail, ... } }
                  const paymentResult: PaymentResult = {
                    transactionId: response.payment?.id || response.orderId || '',
                    status: response.payment?.status || response.status || 'pending',
                    paymentResult: {
                      id: response.payment?.id || '',
                      status: response.payment?.status || response.status || 'pending',
                      statusDetail: response.payment?.statusDetail || response.statusDetail || '',
                      qrCode: undefined, // Orders API não retorna QR code para cartão
                      qrCodeBase64: undefined,
                      ticketUrl: undefined
                    }
                  }

                  onPaymentSuccess(paymentResult)
                  resolve(undefined)
                } catch (error) {
                  console.error('[MercadoPagoPayment] Erro ao processar pagamento:', error)
                  const errorMessage = error instanceof Error 
                    ? error.message 
                    : 'Erro ao processar pagamento. Tente novamente.'
                  onPaymentError(errorMessage)
                  reject(error)
                } finally {
                  setIsProcessing(false)
                }
              })
            },
            onError: (error: any) => {
              console.error('[MercadoPagoPayment] Erro do Brick:', error)
              const errorMessage = error?.message || 'Erro ao processar pagamento. Tente novamente.'
              onPaymentError(errorMessage)
            }
          }
        }

            // Criar instância do Brick
            const controller = await mp.bricks().create('cardPayment', containerId, settings)
            brickControllerRef.current = controller

            // Armazenar no window para poder destruir depois
            ;(window as any).cardPaymentBrickController = controller
          } catch (error) {
            console.error('[MercadoPagoPayment] Erro ao renderizar Brick:', error)
            onPaymentError('Erro ao inicializar formulário de pagamento. Recarregue a página.')
          }
        }

        renderCardPaymentBrick()
      })
    }

    // Iniciar verificação após um pequeno delay para garantir que o React renderizou
    const timeoutId = setTimeout(checkAndRender, 100)

    // Cleanup: destruir Brick ao desmontar
    return () => {
      clearTimeout(timeoutId)
      if (brickControllerRef.current) {
        try {
          if (typeof brickControllerRef.current.unmount === 'function') {
            brickControllerRef.current.unmount()
          }
        } catch (error) {
          console.warn('[MercadoPagoPayment] Erro ao desmontar Brick:', error)
        }
        brickControllerRef.current = null
        if ((window as any).cardPaymentBrickController) {
          delete (window as any).cardPaymentBrickController
        }
      }
      setIsBrickReady(false)
    }
  }, [publicKey, isBricksLoaded, paymentMethod, currentOrderId, amount, payer, onPaymentSuccess, onPaymentError, isProcessing])

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

      {/* Formulário de cartão - Card Payment Brick */}
      {paymentMethod === 'card' && (
        <div>
          {!isBricksLoaded || !publicKey ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando formulário de pagamento...</span>
            </div>
          ) : orderCreationError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-900 mb-2">
                Erro ao criar pedido
              </p>
              <p className="text-sm text-red-800 mb-4">
                {orderCreationError}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOrderCreationError(null)
                  setCurrentOrderId(undefined)
                }}
                className="w-full"
              >
                Tentar novamente
              </Button>
            </div>
          ) : isCreatingOrder || isCreatingOrderLocal || !currentOrderId ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Criando pedido...</span>
            </div>
          ) : (
            // Sempre renderizar o container quando tiver orderId e SDK carregado
            // O container precisa estar no DOM antes do Brick tentar renderizar
            <div>
              {!isBrickReady && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Preparando formulário...</span>
                </div>
              )}
              {/* Container sempre renderizado, mas oculto até o Brick estar pronto */}
              <div 
                id={containerId} 
                style={{ 
                  display: isBrickReady ? 'block' : 'none',
                  minHeight: isBrickReady ? 'auto' : '0'
                }} 
              />
            </div>
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
