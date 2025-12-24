import type { ShippingGateway } from '../../domain/shipping/gateways'
import type {
  ShippingCalculationInput,
  ShippingCalculationResult,
  ShippingQuote
} from '../../domain/shipping/types'
import { MelhorEnvioAuthService } from './melhor-envio-auth'

interface MelhorEnvioPackage {
  height: number
  width: number
  length: number
  weight: number
  insurance_value?: number // Valor segurado em BRL (opcional)
  quantity?: number // Quantidade (opcional, para products)
  id?: string // ID do produto (opcional, para products)
}

interface MelhorEnvioCalculateRequest {
  from: {
    postal_code: string
  }
  to: {
    postal_code: string
  }
  products?: Array<{
    id?: string
    width: number
    height: number
    length: number
    weight: number
    insurance_value?: number
    quantity?: number
  }>
  packages?: Array<{
    width: number
    height: number
    length: number
    weight: number
    insurance?: number
  }>
  options?: {
    receipt?: boolean
    own_hand?: boolean
  }
  services?: string // IDs dos serviços separados por vírgula (ex: "1,2,18")
}

export class MelhorEnvioGateway implements ShippingGateway {
  private readonly apiUrl: string
  private apiToken: string // Não readonly para poder atualizar
  private refreshToken?: string
  private tokenExpiresAt?: Date
  private onTokenRefresh?: (newToken: string, newRefreshToken: string) => Promise<void>
  private authService: MelhorEnvioAuthService

  constructor(
    apiToken?: string,
    refreshToken?: string,
    tokenExpiresAt?: Date,
    onTokenRefresh?: (newToken: string, newRefreshToken: string) => Promise<void>
  ) {
    // Usar token passado como parâmetro, ou do env, ou string vazia
    this.apiToken = apiToken || process.env.MELHOR_ENVIO_API_TOKEN || ''
    this.refreshToken = refreshToken
    this.tokenExpiresAt = tokenExpiresAt
    this.onTokenRefresh = onTokenRefresh
    this.authService = new MelhorEnvioAuthService()
    
    // URL base do Melhor Envio (sem /api/v2)
    // Produção: https://www.melhorenvio.com.br
    // Sandbox: https://sandbox.melhorenvio.com.br
    const baseUrl = process.env.MELHOR_ENVIO_API_URL || 'https://www.melhorenvio.com.br'
    // Construir URL completa com /api/v2
    this.apiUrl = `${baseUrl}/api/v2`
  }

  /**
   * Renova o token automaticamente se necessário (próximo de expirar)
   */
  private async ensureValidToken(): Promise<void> {
    // Se não tem refresh token, não pode renovar
    if (!this.refreshToken) {
      return
    }

    // Verificar se token está expirado ou próximo de expirar (renovar 1 dia antes)
    if (this.tokenExpiresAt) {
      const oneDayFromNow = new Date()
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1)
      
      if (this.tokenExpiresAt <= oneDayFromNow) {
        await this.refreshTokenIfNeeded()
      }
    }
  }

  /**
   * Renova o token usando refresh_token
   */
  private async refreshTokenIfNeeded(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('Refresh token não disponível para renovar access token')
    }

    try {
      const tokenResponse = await this.authService.refreshAccessToken(this.refreshToken)

      // Atualizar tokens
      this.apiToken = tokenResponse.access_token
      this.refreshToken = tokenResponse.refresh_token
      
      // Calcular nova data de expiração (30 dias para access_token)
      this.tokenExpiresAt = new Date()
      this.tokenExpiresAt.setDate(this.tokenExpiresAt.getDate() + 30)

      // Salvar tokens atualizados (via callback)
      if (this.onTokenRefresh && this.refreshToken) {
        await this.onTokenRefresh(this.apiToken, this.refreshToken)
      }

      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('[MelhorEnvioGateway] Token renovado com sucesso')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      throw new Error(`Erro ao renovar token do Melhor Envio: ${errorMessage}`)
    }
  }

  async calculateShipping(
    input: ShippingCalculationInput
  ): Promise<ShippingCalculationResult> {
    // Garantir que o token está válido antes de fazer a requisição
    await this.ensureValidToken()

    // Validar que o token está configurado
    if (!this.apiToken) {
      throw new Error('Melhor Envio API token não configurado. Configure MELHOR_ENVIO_API_TOKEN no .env ou autorize a loja via OAuth2')
    }

    const originZipCode = process.env.SHIPPING_ORIGIN_ZIP_CODE || '01310100'

    // Validar CEP de destino
    const destinationZipCode = input.destinationZipCode.replace(/\D/g, '')
    if (destinationZipCode.length !== 8) {
      throw new Error(`CEP de destino inválido: ${input.destinationZipCode}`)
    }

    // Agrupar itens por dimensões/peso para otimizar pacotes
    const packages = this.groupItemsIntoPackages(input.items)

    // Validar que há pelo menos um pacote
    if (packages.length === 0) {
      throw new Error('Nenhum item para calcular frete')
    }

    // A API do Melhor Envio v2 usa POST com body JSON
    // Documentação: https://docs.melhorenvio.com.br/docs/cotacao-de-fretes
    // Formato: POST /me/shipment/calculate com products ou packages no body
    
    // Converter pacotes para o formato products da API
    // Usando products ao invés de packages para ter mais controle (quantity, id, insurance_value)
    const products = packages.map((pkg, index) => ({
      id: `product_${index + 1}`,
      width: pkg.width,
      height: pkg.height,
      length: pkg.length,
      weight: pkg.weight,
      insurance_value: 0, // Pode ser calculado baseado no valor dos itens no futuro
      quantity: 1
    }))

    const requestBody: MelhorEnvioCalculateRequest = {
      from: {
        postal_code: originZipCode
      },
      to: {
        postal_code: destinationZipCode
      },
      products: products,
      options: {
        receipt: false,
        own_hand: false
      }
      // services pode ser adicionado no futuro para filtrar transportadoras específicas
    }

    const url = `${this.apiUrl}/me/shipment/calculate`
    
    // Log para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('[MelhorEnvioGateway] Calculando frete:', {
        url,
        from: originZipCode,
        to: destinationZipCode,
        productsCount: products.length,
        hasToken: !!this.apiToken
      })
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'WhiteLabelEcommerce (contato@exemplo.com)' // Deve ter email de contato
        },
        body: JSON.stringify(requestBody)
      })

      // Verificar content-type da resposta
      const contentType = response.headers.get('content-type') || ''
      const responseText = await response.text()

      // Se não for JSON, provavelmente é HTML (erro 404, 401, etc)
      if (!contentType.includes('application/json')) {
        // Extrair informações úteis do HTML se possível
        let errorMessage = `Melhor Envio API retornou HTML ao invés de JSON (Status: ${response.status})`
        
        // Tentar extrair título ou mensagem do HTML
        const titleMatch = responseText.match(/<title>(.*?)<\/title>/i)
        if (titleMatch) {
          errorMessage += `. Título da página: ${titleMatch[1]}`
        }
        
        // Se for erro 401, pode ser problema de autenticação
        if (response.status === 401) {
          errorMessage += '. Verifique se o token MELHOR_ENVIO_API_TOKEN está correto e válido.'
        }
        
        // Se for erro 404, pode ser endpoint incorreto
        if (response.status === 404) {
          errorMessage += `. Endpoint pode estar incorreto: ${url}`
        }
        
        // Adicionar preview da resposta (primeiros 200 caracteres)
        const preview = responseText.substring(0, 200).replace(/\s+/g, ' ')
        errorMessage += ` Resposta: ${preview}...`
        
        throw new Error(errorMessage)
      }

      // Se receber 401 (Unauthenticated), tentar renovar token e refazer requisição
      if (response.status === 401) {
        // Tentar renovar token
        try {
          await this.refreshTokenIfNeeded()
          
          // Refazer a requisição com novo token
          const retryResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${this.apiToken}`,
              'Content-Type': 'application/json',
              'User-Agent': 'WhiteLabelEcommerce (contato@exemplo.com)'
            },
            body: JSON.stringify(requestBody)
          })

          // Verificar content-type da resposta de retry
          const retryContentType = retryResponse.headers.get('content-type') || ''
          const retryResponseText = await retryResponse.text()

          if (!retryContentType.includes('application/json')) {
            throw new Error(`Resposta não é JSON após refresh: ${retryResponseText.substring(0, 200)}`)
          }

          if (!retryResponse.ok) {
            // Se ainda falhar após refresh, pode ser que o usuário revogou a autorização
            let errorMessage = `Token renovado mas requisição ainda falhou: ${retryResponse.status}`
            
            try {
              const errorJson = JSON.parse(retryResponseText)
              errorMessage += ` - ${JSON.stringify(errorJson)}`
            } catch {
              errorMessage += ` - ${retryResponseText.substring(0, 200)}`
            }
            
            throw new Error(errorMessage + '. Usuário pode ter revogado autorização.')
          }

          // Processar resposta de retry
          const quotes: any[] = JSON.parse(retryResponseText)

          if (!Array.isArray(quotes) || quotes.length === 0) {
            throw new Error('Nenhuma opção de frete disponível para este destino')
          }

          return {
            quotes: quotes.map((quote) => this.normalizeQuote(quote as ShippingQuote))
          }
        } catch (refreshError) {
          const errorMessage = refreshError instanceof Error ? refreshError.message : 'Erro desconhecido'
          throw new Error(`Erro ao renovar token: ${errorMessage}`)
        }
      }

      // Se receber 401 (Unauthenticated), tentar renovar token e refazer requisição
      if (response.status === 401) {
        // Tentar renovar token se tiver refresh_token
        if (this.refreshToken) {
          try {
            await this.refreshTokenIfNeeded()
            
            // Refazer a requisição com novo token
            const retryResponse = await fetch(url, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json',
                'User-Agent': 'WhiteLabelEcommerce (contato@exemplo.com)'
              },
              body: JSON.stringify(requestBody)
            })

            // Verificar content-type da resposta de retry
            const retryContentType = retryResponse.headers.get('content-type') || ''
            const retryResponseText = await retryResponse.text()

            if (!retryResponse.ok) {
              // Se ainda falhar após refresh, pode ser que o usuário revogou a autorização
              let errorMessage = `Token renovado mas requisição ainda falhou (Status: ${retryResponse.status})`
              
              try {
                const errorJson = JSON.parse(retryResponseText)
                errorMessage += ` - ${JSON.stringify(errorJson)}`
              } catch {
                errorMessage += ` - ${retryResponseText.substring(0, 200)}`
              }
              
              throw new Error(errorMessage)
            }

            // Processar resposta de retry
            if (!retryContentType.includes('application/json')) {
              throw new Error(`Resposta não é JSON após refresh: ${retryResponseText.substring(0, 200)}`)
            }

            const quotes: any[] = JSON.parse(retryResponseText)
            
            // Validar que recebemos pelo menos uma cotação
            if (!Array.isArray(quotes) || quotes.length === 0) {
              throw new Error('Nenhuma opção de frete disponível para este destino')
            }

            return {
              quotes: quotes.map((quote) => this.normalizeQuote(quote as ShippingQuote))
            }
          } catch (refreshError) {
            const errorMessage = refreshError instanceof Error ? refreshError.message : 'Erro desconhecido'
            throw new Error(`Erro ao renovar token: ${errorMessage}`)
          }
        } else {
          // Não tem refresh_token, erro de autenticação permanente
          throw new Error('Token do Melhor Envio expirado e não há refresh_token disponível. Reautorize a loja via OAuth2')
        }
      }

      if (!response.ok) {
        let errorMessage = `Melhor Envio API error: ${response.status}`
        
        try {
          const errorJson = JSON.parse(responseText)
          errorMessage += ` - ${JSON.stringify(errorJson)}`
        } catch {
          errorMessage += ` - ${responseText.substring(0, 200)}`
        }
        
        throw new Error(errorMessage)
      }

      // A resposta da API pode ter campos opcionais, então usamos any temporariamente
      const quotes: any[] = JSON.parse(responseText)

      // Validar que recebemos pelo menos uma cotação
      if (!Array.isArray(quotes) || quotes.length === 0) {
        throw new Error('Nenhuma opção de frete disponível para este destino')
      }

      return {
        quotes: quotes.map((quote) => this.normalizeQuote(quote as ShippingQuote))
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Erro ao calcular frete: ${error.message}`)
      }
      throw new Error('Erro desconhecido ao calcular frete')
    }
  }

  private groupItemsIntoPackages(
    items: ShippingCalculationInput['items']
  ): MelhorEnvioPackage[] {
    // Por enquanto, agrupa todos os itens em um único pacote
    // Futuramente pode implementar lógica mais sofisticada
    const totalWeight = items.reduce(
      (sum, item) => sum + item.weight * item.quantity,
      0
    )

    // Usa as dimensões do maior item como base
    const maxDimensions = items.reduce(
      (max, item) => ({
        height: Math.max(max.height, item.height),
        width: Math.max(max.width, item.width),
        length: Math.max(max.length, item.length)
      }),
      { height: 0, width: 0, length: 0 }
    )

    // Se não houver dimensões definidas, usa valores padrão
    const defaultDimensions = {
      height: maxDimensions.height || 4,
      width: maxDimensions.width || 12,
      length: maxDimensions.length || 17
    }

    return [
      {
        height: defaultDimensions.height,
        width: defaultDimensions.width,
        length: defaultDimensions.length,
        weight: totalWeight || 0.3 // peso padrão em kg se não especificado
      }
    ]
  }

  private normalizeQuote(quote: Partial<ShippingQuote> & { id: number; name: string; price: string | number }): ShippingQuote {
    const price = String(quote.price || '0.00')
    const deliveryTime = (quote.delivery_time as number) || (quote.custom_delivery_time as number) || 0
    
    return {
      id: quote.id,
      name: quote.name,
      price,
      custom_price: String(quote.custom_price || quote.price || '0.00'),
      discount: String(quote.discount || '0.00'),
      currency: quote.currency || 'R$',
      delivery_time: deliveryTime,
      delivery_range: quote.delivery_range || {
        min: deliveryTime,
        max: deliveryTime
      },
      custom_delivery_time: (quote.custom_delivery_time as number) || deliveryTime,
      custom_delivery_range: quote.custom_delivery_range || quote.delivery_range || {
        min: deliveryTime,
        max: deliveryTime
      },
      packages: quote.packages || [],
      additional_services: quote.additional_services || {
        receipt: false,
        own_hand: false,
        collect: false
      },
      company: quote.company || {
        id: 0,
        name: 'Transportadora',
        picture: ''
      }
    }
  }
}

