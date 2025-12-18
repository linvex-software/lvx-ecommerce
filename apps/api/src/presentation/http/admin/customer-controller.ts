import type { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError, z } from 'zod'
import { CustomerRepository } from '../../../infra/db/repositories/customer-repository'
import {
  createQuickCustomerUseCase,
  createQuickCustomerSchema
} from '../../../application/customers/use-cases/create-quick-customer'

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

  async search(request: FastifyRequest<{ Querystring: { q?: string } }>, reply: FastifyReply) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const searchTerm = request.query.q || ''

      const customers = await this.customerRepository.searchByStore(storeId, searchTerm)

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

  async createQuick(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const result = await createQuickCustomerUseCase(
        request.body as z.infer<typeof createQuickCustomerSchema>,
        storeId,
        {
          customerRepository: this.customerRepository
        }
      )

      await reply.code(201).send({
        customer: {
          id: result.customer.id,
          name: result.customer.name,
          email: result.customer.email,
          cpf: result.customer.cpf,
          phone: result.customer.phone,
          created_at: result.customer.created_at
        }
      })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        const statusCode =
          error.message.includes('já cadastrado') ||
          error.message.includes('CPF inválido') ||
          error.message.includes('Email inválido')
            ? 400
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }
}

