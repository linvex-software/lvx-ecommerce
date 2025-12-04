import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import {
  processPaymentUseCase,
  processPaymentSchema
} from '../../../application/payments/use-cases/process-payment'
import { MercadoPagoGateway } from '../../../infra/gateways/mercado-pago-gateway'
import { TransactionRepository } from '../../../infra/db/repositories/transaction-repository'
import { OrderRepository } from '../../../infra/db/repositories/order-repository'
import { PaymentMethodRepository } from '../../../infra/db/repositories/payment-method-repository'

export class PaymentController {
  async getPublicKey(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const paymentMethodRepository = new PaymentMethodRepository()
      const paymentMethod = await paymentMethodRepository.findByProvider(
        storeId,
        'mercadopago'
      )

      if (!paymentMethod || !paymentMethod.active) {
        await reply.code(404).send({ 
          error: 'Mercado Pago payment method not configured or inactive',
          publicKey: null
        })
        return
      }

      const config = paymentMethod.config_json as Record<string, unknown> | null
      const publicKey = 
        (config?.publicKey as string) ||
        (config?.public_key as string) ||
        (config?.publicKeyProd as string) ||
        (config?.public_key_prod as string) ||
        null

      if (!publicKey) {
        await reply.code(404).send({ 
          error: 'Mercado Pago public key not configured',
          publicKey: null
        })
        return
      }

      await reply.status(200).send({ publicKey })
    } catch (error) {
      console.error('[PaymentController] Erro ao buscar chave pública:', error)
      await reply.status(500).send({ error: 'Internal server error' })
    }
  }

  async processPayment(
    request: FastifyRequest<{ Body: z.infer<typeof processPaymentSchema> }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const validated = processPaymentSchema.parse(request.body)

      // Inicializar repositórios
      const transactionRepository = new TransactionRepository()
      const orderRepository = new OrderRepository()
      const paymentMethodRepository = new PaymentMethodRepository()

      // PRIORIDADE 1: Buscar credenciais do banco de dados (configuradas no painel admin /loja)
      const paymentMethod = await paymentMethodRepository.findByProvider(
        storeId,
        'mercadopago'
      )

      let accessToken: string | undefined
      let accessTokenSource = ''

      if (paymentMethod && paymentMethod.active) {
        const config = paymentMethod.config_json as Record<string, unknown> | null
        if (config) {
          // Tentar diferentes nomes de campos no config_json
          accessToken = 
            (config.access_token as string) ||
            (config.accessToken as string) ||
            (config.accessTokenProd as string) ||
            (config.access_token_prod as string)
          
          if (accessToken) {
            accessTokenSource = 'banco de dados (painel admin)'
            console.log(`[PaymentController] Access token encontrado no ${accessTokenSource}:`, accessToken.substring(0, 20) + '...')
          }
        }
      }

      // PRIORIDADE 2: Fallback para variáveis de ambiente (.env)
      if (!accessToken) {
        accessToken =
          process.env.MP_ACCESS_TOKEN_PROD ||
          process.env.MERCADO_PAGO_ACCESS_TOKEN_PROD ||
          process.env.MERCADOPAGO_ACCESS_TOKEN_PROD ||
          process.env.MP_ACCESS_TOKEN ||
          process.env.MERCADO_PAGO_ACCESS_TOKEN ||
          process.env.MERCADOPAGO_ACCESS_TOKEN ||
          process.env.MP_ACCESS_TOKEN_TEST ||
          process.env.MERCADO_PAGO_ACCESS_TOKEN_TEST
        
        if (accessToken) {
          accessTokenSource = 'variáveis de ambiente (.env)'
          console.log(`[PaymentController] Access token encontrado no ${accessTokenSource}:`, accessToken.substring(0, 20) + '...')
        }
      }

      if (!accessToken) {
        console.error('[PaymentController] Nenhum access token encontrado')
        console.error('  Verificou banco de dados:', paymentMethod ? 'sim' : 'não')
        console.error('  Payment method ativo:', paymentMethod?.active ? 'sim' : 'não')
        console.error('  Variáveis de ambiente verificadas:')
        console.error('    MP_ACCESS_TOKEN:', process.env.MP_ACCESS_TOKEN ? 'existe' : 'não existe')
        console.error('    MERCADO_PAGO_ACCESS_TOKEN:', process.env.MERCADO_PAGO_ACCESS_TOKEN ? 'existe' : 'não existe')
        
        await reply.code(500).send({
          error: 'Mercado Pago access token not configured',
          message: 'Configure o Access Token no painel admin (/admin/store) ou nas variáveis de ambiente (.env)'
        })
        return
      }

      const paymentGateway = new MercadoPagoGateway(accessToken)

      const result = await processPaymentUseCase(
        validated,
        storeId,
        {
          paymentGateway,
          transactionRepository,
          orderRepository,
          paymentMethodRepository
        }
      )

      await reply.status(200).send(result)
      return
    } catch (error) {
      // Log do erro para debug
      console.error('[PaymentController] Erro ao processar pagamento:', error)

      if (error instanceof z.ZodError) {
        await reply.status(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }

      if (error instanceof Error) {
        const statusCode =
          error.message.includes('not found') ||
          error.message.includes('already paid') ||
          error.message.includes('not configured')
            ? 400
            : 500

        await reply.status(statusCode).send({ error: error.message })
        return
      }

      // Garantir que sempre retorna uma resposta
      await reply.status(500).send({ error: 'Internal server error' })
      return
    }
  }
}

