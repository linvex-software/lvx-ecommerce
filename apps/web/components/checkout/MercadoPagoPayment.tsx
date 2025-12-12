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
  const cardFormRef = useRef<any>(null) // Ref para manter referência estável do CardForm
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
          // Validar formato básico da chave pública antes de criar instância
          if (!publicKey.startsWith('APP_USR-') && !publicKey.startsWith('TEST-')) {
            console.warn('[MercadoPago] Formato de chave pública pode estar incorreto:', publicKey.substring(0, 20) + '...')
          }

          const mpInstance = new window.MercadoPago(publicKey, {
            locale: 'pt-BR'
          })
          setMp(mpInstance)
          console.log('[MercadoPago] SDK carregado com sucesso, instância criada')
        } catch (error: any) {
          console.error('[MercadoPago] Erro ao criar instância:', error)
          const errorMessage = error?.message || 'Erro desconhecido ao inicializar Mercado Pago'
          onPaymentError(`Erro ao inicializar Mercado Pago: ${errorMessage}. Verifique se a chave pública está correta.`)
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

  // Carregar tipos de documento com retry logic
  useEffect(() => {
    if (!mp) return

    let retryCount = 0
    const maxRetries = 3
    const retryDelay = 1000 // 1 segundo

    const fetchIdentificationTypes = async (): Promise<void> => {
      try {
        console.log('[MercadoPagoPayment] Buscando tipos de identificação... (tentativa', retryCount + 1, ')')
        const types = await mp.getIdentificationTypes()
        console.log('[MercadoPagoPayment] Tipos de identificação obtidos:', types.length, 'tipos')
        setIdentificationTypes(types)
      } catch (error: any) {
        console.error('[MercadoPagoPayment] Erro ao obter tipos de identificação:', error)
        
        // Se for erro relacionado à chave pública, não tentar novamente
        if (error?.message?.includes('public key') || error?.status === 500) {
          console.error('[MercadoPagoPayment] Erro relacionado à chave pública. Verifique se a chave está correta.')
          onPaymentError('Erro na configuração da chave pública do Mercado Pago. Verifique as configurações no painel administrativo.')
          return
        }

        // Tentar novamente se ainda houver tentativas
        if (retryCount < maxRetries) {
          retryCount++
          console.log(`[MercadoPagoPayment] Tentando novamente em ${retryDelay}ms...`)
          setTimeout(() => fetchIdentificationTypes(), retryDelay)
        } else {
          console.warn('[MercadoPagoPayment] Não foi possível obter tipos de identificação após', maxRetries, 'tentativas. Continuando sem eles.')
          // Não bloquear o fluxo se não conseguir obter os tipos
        }
      }
    }

    fetchIdentificationTypes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mp]) // onPaymentError não precisa estar nas dependências para evitar re-renders desnecessários

  // Inicializar CardForm quando mp estiver disponível e método for cartão
  useEffect(() => {
    console.log('[MercadoPagoPayment] useEffect CardForm - Verificando condições:', {
      mp: !!mp,
      paymentMethod,
      publicKey: !!publicKey,
      isCard: paymentMethod === 'card',
      hasCardForm: !!cardFormRef.current
    })
    
    if (!mp || paymentMethod !== 'card') {
      console.log('[MercadoPagoPayment] Condições não atendidas, limpando CardForm')
      setIsCardFormMounted(false)
      setCardForm(null)
      cardFormRef.current = null
      return
    }
    
    if (!publicKey) {
      console.warn('[MercadoPagoPayment] Chave pública não disponível, aguardando...')
      return
    }
    
    // Se já temos um CardForm válido e apenas amount ou publicKey mudaram, não recriar
    if (cardFormRef.current && typeof cardFormRef.current.getCardFormData === 'function') {
      console.log('[MercadoPagoPayment] CardForm já existe e é válido, mantendo (apenas amount ou publicKey mudaram)')
      // Apenas atualizar o state se necessário
      if (!cardForm) {
        setCardForm(cardFormRef.current)
      }
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
      const previousCardForm = cardForm || cardFormRef.current
      if (previousCardForm) {
        try {
          // Limpar timeout se existir
          if ((previousCardForm as any)._mountTimeout) {
            clearTimeout((previousCardForm as any)._mountTimeout)
            delete (previousCardForm as any)._mountTimeout
          }
          
          // Tentar limpar o CardForm anterior se tiver método de limpeza
          if (typeof previousCardForm.unmount === 'function') {
            previousCardForm.unmount()
          }
        } catch (e) {
          console.warn('[MercadoPagoPayment] Erro ao limpar CardForm anterior:', e)
        }
        cardFormRef.current = null
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
        console.log('[MercadoPagoPayment] Public key prefix:', publicKey?.substring(0, 10) + '...')
        
        // Validar que temos uma chave pública válida antes de inicializar
        if (!publicKey) {
          throw new Error('Chave pública não está disponível. Recarregue a página.')
        }

        // Criar referência para o cardFormInstance que será usado nos callbacks
        let cardFormInstanceRef: any = null
        
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
              
              // Limpar timeouts de segurança se existirem
              if (cardFormInstanceRef) {
                if ((cardFormInstanceRef as any)._mountTimeout) {
                  clearTimeout((cardFormInstanceRef as any)._mountTimeout)
                  delete (cardFormInstanceRef as any)._mountTimeout
                }
                if ((cardFormInstanceRef as any)._validationTimeout) {
                  clearTimeout((cardFormInstanceRef as any)._validationTimeout)
                  delete (cardFormInstanceRef as any)._validationTimeout
                }
              }
              
              if (error) {
                console.error('[MercadoPagoPayment] Erro ao montar CardForm:', error)
                console.error('[MercadoPagoPayment] Error name:', error.name)
                console.error('[MercadoPagoPayment] Error message:', error.message)
                console.error('[MercadoPagoPayment] Stack:', error.stack)
                
                // Não limpar o cardForm aqui, apenas marcar como não montado
                // O CardForm pode ainda ser válido mesmo com erro inicial
                setIsCardFormMounted(false)
                
                // Verificar se é erro relacionado à chave pública
                const isPublicKeyError = error.message?.includes('public key') || 
                                        error.message?.includes('chave pública') ||
                                        error.message?.includes('error searching public key')
                
                if (isPublicKeyError) {
                  onPaymentError('Erro na configuração da chave pública do Mercado Pago. Verifique as configurações no painel administrativo.')
                } else {
                  onPaymentError(`Erro ao montar o formulário de cartão: ${error.message}. Tente recarregar a página.`)
                }
                return
              }
              
              console.log('[MercadoPagoPayment] CardForm montado com sucesso!')
              
              // Garantir que a ref está atualizada primeiro
              if (cardFormInstanceRef) {
                cardFormRef.current = cardFormInstanceRef
              }
              
              // Garantir que o cardForm state está definido
              setCardForm((prev) => {
                if (!prev && cardFormInstanceRef) {
                  console.warn('[MercadoPagoPayment] CardForm foi limpo antes de onFormMounted, restaurando...')
                  return cardFormInstanceRef
                }
                return prev || cardFormInstanceRef
              })
              
              setIsCardFormMounted(true)
            },
            onFetching: (resource: string) => {
              console.log('[MercadoPagoPayment] Fetching resource:', resource)
            },
            onError: (error: any) => {
              console.error('[MercadoPagoPayment] CardForm error callback:', error)
              console.error('[MercadoPagoPayment] Error details:', {
                message: error?.message,
                status: error?.status,
                code: error?.code,
                name: error?.name,
                stack: error?.stack
              })

              // Não limpar o cardForm em erros não críticos
              // Apenas marcar como não montado se for erro crítico
              const isCriticalError = error?.status === 500 || 
                                     error?.message?.includes('public key') ||
                                     error?.message?.includes('chave pública') ||
                                     error?.message?.includes('error searching public key')
              
              if (isCriticalError) {
                setIsCardFormMounted(false)
                // Não limpar cardForm aqui, pode ser um erro temporário
              }

              // Tratar erros específicos
              let errorMessage = 'Erro desconhecido no formulário'
              
              if (error?.message) {
                errorMessage = error.message
              } else if (error?.status === 500) {
                errorMessage = 'Erro ao validar chave pública do Mercado Pago. Verifique se a chave está correta e corresponde ao ambiente correto (teste/produção).'
              } else if (error?.code === 500) {
                errorMessage = 'Erro interno do Mercado Pago. Tente novamente em alguns instantes.'
              } else if (typeof error === 'string') {
                errorMessage = error
              } else if (error?.toString) {
                errorMessage = error.toString()
              }

              // Se for erro relacionado à chave pública, dar mensagem mais específica
              if (errorMessage.includes('public key') || errorMessage.includes('chave pública') || error?.status === 500) {
                errorMessage = 'Erro na configuração da chave pública do Mercado Pago. Verifique as configurações no painel administrativo e certifique-se de que a chave corresponde ao ambiente correto (teste ou produção).'
              }

              // Só mostrar erro se for crítico, erros menores podem ser ignorados
              if (isCriticalError) {
                onPaymentError(`Erro no formulário de cartão: ${errorMessage}`)
              } else {
                console.warn('[MercadoPagoPayment] Erro não crítico no CardForm, continuando:', errorMessage)
              }
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

        // Armazenar referência
        cardFormInstanceRef = cardFormInstance
        
        console.log('[MercadoPagoPayment] CardForm instance criada:', cardFormInstance)
        console.log('[MercadoPagoPayment] CardForm instance type:', typeof cardFormInstance)
        console.log('[MercadoPagoPayment] CardForm methods:', {
          getCardFormData: typeof cardFormInstance?.getCardFormData,
          unmount: typeof cardFormInstance?.unmount
        })
        
        // Definir o CardForm imediatamente após criação
        cardFormRef.current = cardFormInstance // Atualizar ref também
        setCardForm(cardFormInstance)
        setIsCardFormMounted(false) // Reset inicial, será setado para true no onFormMounted
        
        // Timeout de segurança: se onFormMounted não for chamado em 5 segundos, considerar como montado
        const mountTimeout = setTimeout(() => {
          setCardForm((current) => {
            // Se o CardForm foi limpo, restaurar
            if (!current && cardFormInstanceRef) {
              console.warn('[MercadoPagoPayment] CardForm foi limpo, restaurando após timeout')
              cardFormRef.current = cardFormInstanceRef // Atualizar ref também
              return cardFormInstanceRef
            }
            return current
          })
          
          setIsCardFormMounted((current) => {
            if (!current) {
              console.warn('[MercadoPagoPayment] onFormMounted não foi chamado em 5s, assumindo que está montado')
              return true
            }
            return current
          })
        }, 5000)
        
        // Armazenar timeout para limpeza
        ;(cardFormInstance as any)._mountTimeout = mountTimeout
        
        // Verificação adicional: se após 1 segundo o CardForm ainda não foi montado mas está fazendo requests,
        // considerar como válido (isso acontece quando onFormMounted não é chamado mas o CardForm funciona)
        const validationTimeout = setTimeout(() => {
          // Verificar se o CardForm ainda existe e se há elementos sendo preenchidos
          const cardNumberElement = document.getElementById('form-checkout__cardNumber')
          const hasIframes = cardNumberElement && cardNumberElement.querySelector('iframe')
          
          if (hasIframes && cardFormRef.current) {
            setIsCardFormMounted((current) => {
              if (!current) {
                console.log('[MercadoPagoPayment] CardForm parece estar funcionando (iframes detectados), marcando como montado')
                return true
              }
              return current
            })
            
            // Garantir que o state está sincronizado
            setCardForm((current) => {
              if (!current && cardFormRef.current) {
                return cardFormRef.current
              }
              return current
            })
          }
        }, 1000)
        
        ;(cardFormInstance as any)._validationTimeout = validationTimeout
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
      console.log('[MercadoPagoPayment] Cleanup do useEffect CardForm')
      clearTimeout(timeoutId)
      
      // Limpar timeouts se existirem
      const currentCardForm = cardFormRef.current
      if (currentCardForm) {
        if ((currentCardForm as any)._mountTimeout) {
          clearTimeout((currentCardForm as any)._mountTimeout)
          delete (currentCardForm as any)._mountTimeout
        }
        if ((currentCardForm as any)._validationTimeout) {
          clearTimeout((currentCardForm as any)._validationTimeout)
          delete (currentCardForm as any)._validationTimeout
        }
      }
      
      // Só limpar CardForm se realmente precisar (mudança de método de pagamento ou mp)
      // Não limpar se apenas amount ou publicKey mudaram (isso não requer recriar o CardForm)
      const shouldCleanup = !mp || paymentMethod !== 'card'
      
      if (shouldCleanup) {
        console.log('[MercadoPagoPayment] Limpando CardForm no cleanup (condições mudaram)')
        setIsCardFormMounted(false)
        
        // Limpar CardForm ao desmontar
        if (currentCardForm) {
          try {
            if (typeof currentCardForm.unmount === 'function') {
              currentCardForm.unmount()
            }
          } catch (e) {
            console.warn('[MercadoPagoPayment] Erro ao fazer unmount do CardForm:', e)
          }
        }
        cardFormRef.current = null
        setCardForm(null)
      } else {
        console.log('[MercadoPagoPayment] Mantendo CardForm (apenas amount ou publicKey mudaram)')
      }
    }
  }, [mp, paymentMethod, amount, publicKey]) // Adicionar publicKey como dependência

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Usar ref como fallback se cardForm state estiver null
    let currentCardForm = cardForm || cardFormRef.current
    
    // Se ainda não temos CardForm, tentar aguardar um pouco (pode estar sendo criado)
    if (!currentCardForm) {
      console.warn('[MercadoPagoPayment] CardForm não encontrado imediatamente, aguardando...')
      
      // Aguardar até 2 segundos para o CardForm ser criado
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 100))
        currentCardForm = cardForm || cardFormRef.current
        if (currentCardForm) {
          console.log('[MercadoPagoPayment] CardForm encontrado após aguardar')
          break
        }
      }
    }
    
    // Verificar se cardForm existe
    if (!currentCardForm) {
      console.error('[MercadoPagoPayment] CardForm não está disponível após aguardar')
      console.error('[MercadoPagoPayment] Estado atual:', {
        cardForm: cardForm,
        cardFormRef: cardFormRef.current,
        mp: !!mp,
        publicKey: !!publicKey,
        paymentMethod,
        isCardFormMounted
      })
      onPaymentError('Formulário não está pronto. Aguarde alguns instantes e tente novamente. Se o problema persistir, recarregue a página.')
      return
    }
    
    // Se cardForm state está null mas ref tem valor, restaurar
    if (!cardForm && cardFormRef.current) {
      console.warn('[MercadoPagoPayment] Restaurando CardForm do ref')
      setCardForm(cardFormRef.current)
    }
    
    if (isProcessing || isCreatingOrder) {
      console.warn('[MercadoPagoPayment] CardForm submission blocked:', { 
        isProcessing, 
        isCreatingOrder 
      })
      return
    }

    setIsProcessing(true)

    try {
      // Usar o CardForm atual (state ou ref)
      const formToUse = cardForm || cardFormRef.current
      
      if (!formToUse) {
        throw new Error('CardForm não está disponível. Recarregue a página e tente novamente.')
      }
      
      // Verificar se o CardForm ainda está válido antes de obter os dados
      if (typeof formToUse.getCardFormData !== 'function') {
        throw new Error('CardForm não está mais válido. Recarregue a página e tente novamente.')
      }

      const cardFormData = formToUse.getCardFormData()

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

      // Verificar se o pagamento foi rejeitado
      if (result.status === 'rejected' || result.paymentResult?.status === 'rejected') {
        // Importar função de mensagens de erro
        const { getMercadoPagoErrorMessage } = await import('@/lib/mercado-pago-error-messages')
        const errorMessage = getMercadoPagoErrorMessage(
          result.paymentResult?.statusDetail || 'rejected'
        )
        onPaymentError(errorMessage)
        return
      }

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

