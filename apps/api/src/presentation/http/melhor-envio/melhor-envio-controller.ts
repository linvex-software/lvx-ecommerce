import type { FastifyRequest, FastifyReply } from 'fastify'
import { MelhorEnvioAuthService } from '../../../infra/gateways/melhor-envio-auth'
import { MelhorEnvioTokenRepository } from '../../../infra/db/repositories/melhor-envio-token-repository'

export class MelhorEnvioController {
  private authService: MelhorEnvioAuthService
  private tokenRepository: MelhorEnvioTokenRepository

  constructor() {
    this.authService = new MelhorEnvioAuthService()
    this.tokenRepository = new MelhorEnvioTokenRepository()
  }

  /**
   * Gera URL de autorização e redireciona o usuário para o Melhor Envio
   * GET /melhor-envio/authorize?store_id=XXX
   */
  async authorize(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = (request.query as { store_id?: string })?.store_id

      if (!storeId) {
        await reply.code(400).send({ error: 'store_id é obrigatório' })
        return
      }

      // Validar que a loja existe (opcional, mas recomendado)
      // Por enquanto, apenas gerar a URL de autorização

      // Usar store_id como state para segurança
      const state = storeId
      const authorizationUrl = this.authService.getAuthorizationUrl(state)

      // Redirecionar para a URL de autorização
      await reply.redirect(authorizationUrl)
    } catch (error) {
      request.log.error(error, 'Erro ao gerar URL de autorização do Melhor Envio')

      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }

      await reply.code(500).send({ error: 'Erro interno ao gerar URL de autorização' })
    }
  }

  /**
   * Recebe o código de autorização e salva os tokens no banco
   * GET /melhor-envio/callback?code=XXX&state=store_id
   */
  async callback(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = request.query as { code?: string; state?: string; error?: string }

      // Se houver erro na autorização
      if (query.error) {
        await reply.code(400).send({
          error: 'Autorização negada pelo usuário',
          details: query.error
        })
        return
      }

      if (!query.code) {
        await reply.code(400).send({ error: 'Código de autorização não fornecido' })
        return
      }

      if (!query.state) {
        await reply.code(400).send({ error: 'State (store_id) não fornecido' })
        return
      }

      const storeId = query.state

      // Trocar código por tokens
      const tokenResponse = await this.authService.exchangeCodeForTokens(query.code)

      // Calcular data de expiração (30 dias para access_token)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      // Salvar tokens no banco
      await this.tokenRepository.save(
        storeId,
        tokenResponse.access_token,
        tokenResponse.refresh_token,
        expiresAt
      )

      // Redirecionar para página de sucesso (ou retornar JSON)
      // Por enquanto, retornar JSON com sucesso
      await reply.code(200).send({
        success: true,
        message: 'Autorização do Melhor Envio concluída com sucesso',
        store_id: storeId
      })
    } catch (error) {
      request.log.error(error, 'Erro ao processar callback do Melhor Envio')

      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }

      await reply.code(500).send({ error: 'Erro interno ao processar callback' })
    }
  }

  /**
   * Revoga a autorização removendo os tokens do banco
   * POST /melhor-envio/revoke
   */
  async revoke(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = (request as any).storeId

      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID é obrigatório' })
        return
      }

      // Remover tokens do banco
      const deleted = await this.tokenRepository.delete(storeId)

      if (!deleted) {
        await reply.code(404).send({ error: 'Autorização não encontrada para esta loja' })
        return
      }

      await reply.code(200).send({
        success: true,
        message: 'Autorização do Melhor Envio revogada com sucesso'
      })
    } catch (error) {
      request.log.error(error, 'Erro ao revogar autorização do Melhor Envio')

      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }

      await reply.code(500).send({ error: 'Erro interno ao revogar autorização' })
    }
  }

  /**
   * Verifica status da autorização (se a loja tem tokens válidos)
   * GET /melhor-envio/status
   */
  async status(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = (request as any).storeId

      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID é obrigatório' })
        return
      }

      const tokens = await this.tokenRepository.findByStoreId(storeId)

      if (!tokens) {
        await reply.code(200).send({
          authorized: false,
          message: 'Loja não autorizada'
        })
        return
      }

      // Verificar se token está expirado
      const now = new Date()
      const isExpired = tokens.expires_at <= now

      await reply.code(200).send({
        authorized: true,
        expires_at: tokens.expires_at.toISOString(),
        is_expired: isExpired,
        expires_in_days: isExpired
          ? 0
          : Math.ceil((tokens.expires_at.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      })
    } catch (error) {
      request.log.error(error, 'Erro ao verificar status da autorização')

      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }

      await reply.code(500).send({ error: 'Erro interno ao verificar status' })
    }
  }
}

