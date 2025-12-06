import type { FastifyRequest, FastifyReply } from 'fastify'
import { CustomerRepository } from '../../../infra/db/repositories/customer-repository'

export class CustomerController {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const customers = await this.customerRepository.listByStore(storeId)

      // Retorna apenas dados públicos (sem password_hash)
      const publicCustomers = customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        cpf: customer.cpf,
        phone: customer.phone,
        created_at: customer.created_at
      }))

      await reply.send({ customers: publicCustomers })
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }
}

