/**
 * Serviço de autenticação OAuth2 do Melhor Envio
 * 
 * Gerencia o fluxo de autorização e renovação de tokens
 */

interface MelhorEnvioTokenResponse {
  token_type: string
  expires_in: number
  access_token: string
  refresh_token: string
}

interface MelhorEnvioRefreshResponse {
  token_type: string
  expires_in: number
  access_token: string
  refresh_token: string
}

export class MelhorEnvioAuthService {
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly redirectUri: string
  private readonly baseUrl: string

  constructor() {
    this.clientId = process.env.MELHOR_ENVIO_CLIENT_ID || ''
    this.clientSecret = process.env.MELHOR_ENVIO_CLIENT_SECRET || ''
    this.redirectUri = process.env.MELHOR_ENVIO_REDIRECT_URI || ''
    
    // URL base do Melhor Envio (sem /api/v2)
    const apiBaseUrl = process.env.MELHOR_ENVIO_API_URL || 'https://www.melhorenvio.com.br'
    this.baseUrl = `${apiBaseUrl}/oauth`
  }

  /**
   * Gera URL de autorização para o usuário autorizar o app
   * @param state - Estado opcional para segurança (pode conter store_id)
   */
  getAuthorizationUrl(state?: string): string {
    if (!this.clientId) {
      throw new Error('MELHOR_ENVIO_CLIENT_ID não configurado')
    }

    if (!this.redirectUri) {
      throw new Error('MELHOR_ENVIO_REDIRECT_URI não configurado')
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'cart-read cart-write companies-read companies-write coupons-read coupons-write notifications-read orders-read products-read products-destroy products-write purchases-read shipping-calculate shipping-cancel shipping-companies shipping-generate shipping-preview shipping-print shipping-share shipping-tracking ecommerce-shipping transactions-read users-read users-write webhooks-read webhooks-write webhooks-delete tdealer-webhook'
    })
    
    if (state) {
      params.append('state', state)
    }

    return `${this.baseUrl}/authorize?${params.toString()}`
  }

  /**
   * Troca o código de autorização por tokens
   * @param code - Código recebido no callback após autorização
   */
  async exchangeCodeForTokens(code: string): Promise<MelhorEnvioTokenResponse> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('MELHOR_ENVIO_CLIENT_ID e MELHOR_ENVIO_CLIENT_SECRET devem estar configurados')
    }

    if (!this.redirectUri) {
      throw new Error('MELHOR_ENVIO_REDIRECT_URI não configurado')
    }

    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'WhiteLabelEcommerce (contato@exemplo.com)'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Erro ao obter tokens: ${response.status}`
      
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage += ` - ${JSON.stringify(errorJson)}`
      } catch {
        errorMessage += ` - ${errorText.substring(0, 200)}`
      }
      
      throw new Error(errorMessage)
    }

    return await response.json()
  }

  /**
   * Renova o access_token usando o refresh_token
   * @param refreshToken - Refresh token para renovar o access token
   */
  async refreshAccessToken(refreshToken: string): Promise<MelhorEnvioRefreshResponse> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('MELHOR_ENVIO_CLIENT_ID e MELHOR_ENVIO_CLIENT_SECRET devem estar configurados')
    }

    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'WhiteLabelEcommerce (contato@exemplo.com)'
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Erro ao renovar token: ${response.status}`
      
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage += ` - ${JSON.stringify(errorJson)}`
      } catch {
        errorMessage += ` - ${errorText.substring(0, 200)}`
      }
      
      throw new Error(errorMessage)
    }

    return await response.json()
  }
}

