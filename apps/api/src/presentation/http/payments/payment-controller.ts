import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import {
  processPaymentUseCase,
  processPaymentSchema
} from '../../../application/payments/use-cases/process-payment'
import { PaymentGatewayFactory } from '../../../infra/gateways/payment-gateway-factory'
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
      const paymentMethod = await paymentMethodRepository.findActive(storeId)

      if (!paymentMethod) {
        await reply.code(404).send({ 
          error: 'No active payment method configured',
          publicKey: null,
          provider: null
        })
        return
      }

      const config = paymentMethod.config_json as Record<string, unknown> | null
      if (!config) {
        await reply.code(404).send({ 
          error: 'Payment method configuration not found',
          publicKey: null,
          provider: paymentMethod.provider
        })
        return
      }

      // Buscar chave pública baseado no provider
      let publicKey: string | null = null

      if (paymentMethod.provider === 'mercadopago') {
        publicKey = 
          (config.publicKey as string) ||
          (config.public_key as string) ||
          (config.publicKeyProd as string) ||
          (config.public_key_prod as string) ||
          null

        if (!publicKey) {
          await reply.code(404).send({ 
            error: 'Mercado Pago public key not configured',
            message: 'A chave pública não foi encontrada na configuração. Configure no painel administrativo.',
            publicKey: null,
            provider: 'mercadopago'
          })
          return
        }

        // Validar formato básico da chave pública Mercado Pago
        if (!publicKey.startsWith('APP_USR-') && !publicKey.startsWith('TEST-')) {
          console.warn('[PaymentController] Formato de chave pública pode estar incorreto:', publicKey.substring(0, 20) + '...')
        }
      } else if (paymentMethod.provider === 'stripe') {
        publicKey = 
          (config.public_key as string) ||
          (config.publicKey as string) ||
          null

        if (!publicKey) {
          await reply.code(404).send({ 
            error: 'Stripe public key not configured',
            message: 'A chave pública não foi encontrada na configuração. Configure no painel administrativo.',
            publicKey: null,
            provider: 'stripe'
          })
          return
        }
      } else {
        await reply.code(400).send({ 
          error: `Public key endpoint not supported for provider: ${paymentMethod.provider}`,
          publicKey: null,
          provider: paymentMethod.provider
        })
        return
      }

      console.log(`[PaymentController] Chave pública encontrada (${paymentMethod.provider}):`, publicKey.substring(0, 20) + '...')
      await reply.status(200).send({ 
        publicKey,
        provider: paymentMethod.provider
      })
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

      // Buscar método de pagamento ativo
      const paymentMethod = await paymentMethodRepository.findActive(storeId)

      if (!paymentMethod) {
        await reply.code(400).send({
          error: 'No active payment method configured',
          message: 'Configure um método de pagamento ativo no painel admin (/admin/store)'
        })
        return
      }

      console.log(`[PaymentController] Usando gateway: ${paymentMethod.provider}`)

      // Criar gateway usando factory
      const paymentGateway = PaymentGatewayFactory.create(paymentMethod)

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

  async getActiveGateway(
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
      const paymentMethod = await paymentMethodRepository.findActive(storeId)

      if (!paymentMethod) {
        await reply.code(404).send({ 
          error: 'No active payment method configured',
          provider: null
        })
        return
      }

      await reply.status(200).send({ 
        provider: paymentMethod.provider,
        name: paymentMethod.name
      })
    } catch (error) {
      console.error('[PaymentController] Erro ao buscar gateway ativo:', error)
      await reply.status(500).send({ error: 'Internal server error' })
    }
  }
}

