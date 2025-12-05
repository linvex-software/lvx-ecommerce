import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { PaymentMethodRepository } from '../../../infra/db/repositories/payment-method-repository'

const createPaymentMethodSchema = z.object({
  name: z.string().min(1),
  provider: z.string().min(1),
  config_json: z.record(z.unknown()).optional().nullable(),
  active: z.boolean().optional().default(true)
})

const updatePaymentMethodSchema = z.object({
  name: z.string().min(1).optional(),
  config_json: z.record(z.unknown()).optional().nullable(),
  active: z.boolean().optional()
})

export class PaymentMethodController {
  private repository: PaymentMethodRepository

  constructor() {
    this.repository = new PaymentMethodRepository()
  }

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const paymentMethods = await this.repository.listByStore(storeId)
      await reply.status(200).send(paymentMethods)
    } catch (error) {
      console.error('[PaymentMethodController] Erro ao listar métodos de pagamento:', error)
      await reply.status(500).send({ error: 'Internal server error' })
    }
  }

  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const { id } = request.params
      const paymentMethod = await this.repository.findById(id, storeId)

      if (!paymentMethod) {
        await reply.code(404).send({ error: 'Payment method not found' })
        return
      }

      await reply.status(200).send(paymentMethod)
    } catch (error) {
      console.error('[PaymentMethodController] Erro ao buscar método de pagamento:', error)
      await reply.status(500).send({ error: 'Internal server error' })
    }
  }

  async create(
    request: FastifyRequest<{ Body: z.infer<typeof createPaymentMethodSchema> }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const validated = createPaymentMethodSchema.parse(request.body)

      // Verificar se já existe um método com o mesmo provider
      const existing = await this.repository.findByProvider(storeId, validated.provider)
      if (existing) {
        await reply.code(400).send({
          error: `Payment method with provider "${validated.provider}" already exists`
        })
        return
      }

      const paymentMethod = await this.repository.create({
        store_id: storeId,
        name: validated.name,
        provider: validated.provider,
        config_json: validated.config_json || null,
        active: validated.active
      })

      await reply.status(201).send(paymentMethod)
    } catch (error) {
      if (error instanceof z.ZodError) {
        await reply.status(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }

      console.error('[PaymentMethodController] Erro ao criar método de pagamento:', error)
      await reply.status(500).send({ error: 'Internal server error' })
    }
  }

  async update(
    request: FastifyRequest<{
      Params: { id: string }
      Body: z.infer<typeof updatePaymentMethodSchema>
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const { id } = request.params
      const validated = updatePaymentMethodSchema.parse(request.body)

      // Verificar se existe
      const existing = await this.repository.findById(id, storeId)
      if (!existing) {
        await reply.code(404).send({ error: 'Payment method not found' })
        return
      }

      const paymentMethod = await this.repository.update(id, storeId, {
        name: validated.name,
        config_json: validated.config_json,
        active: validated.active
      })

      await reply.status(200).send(paymentMethod)
    } catch (error) {
      if (error instanceof z.ZodError) {
        await reply.status(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }

      console.error('[PaymentMethodController] Erro ao atualizar método de pagamento:', error)
      await reply.status(500).send({ error: 'Internal server error' })
    }
  }
}


