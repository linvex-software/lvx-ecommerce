import type { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { registerCustomerUseCase } from '../../../application/customers/use-cases/register-customer'
import { loginCustomerUseCase } from '../../../application/customers/use-cases/login-customer'
import { getCustomerProfileUseCase } from '../../../application/customers/use-cases/get-customer-profile'
import { updateCustomerProfileUseCase } from '../../../application/customers/use-cases/update-customer-profile'
import { listCustomerAddressesUseCase } from '../../../application/customers/use-cases/list-customer-addresses'
import { createCustomerAddressUseCase } from '../../../application/customers/use-cases/create-customer-address'
import { updateCustomerAddressUseCase } from '../../../application/customers/use-cases/update-customer-address'
import { deleteCustomerAddressUseCase } from '../../../application/customers/use-cases/delete-customer-address'
import { setDefaultCustomerAddressUseCase } from '../../../application/customers/use-cases/set-default-customer-address'
import { updateCustomerPasswordUseCase } from '../../../application/customers/use-cases/update-customer-password'
import { CustomerRepository } from '../../../infra/db/repositories/customer-repository'
import { CustomerAddressRepository } from '../../../infra/db/repositories/customer-address-repository'
import { AuthSessionRepository } from '../../../infra/db/repositories/auth-session-repository'
import { OrderRepository } from '../../../infra/db/repositories/order-repository'
import { listOrdersUseCase } from '../../../application/orders/use-cases/list-orders'
import { getOrderUseCase } from '../../../application/orders/use-cases/get-order'
import type { ListOrdersFilters } from '../../../domain/orders/order-types'
import type {
  RegisterCustomerInput,
  LoginCustomerInput,
  UpdateCustomerProfileInput,
  CreateCustomerAddressInput,
  UpdateCustomerAddressInput
} from '../../../domain/customers/customer-types'

interface RegisterCustomerBody {
  name: string
  cpf: string
  email?: string | null
  phone?: string | null
  password: string
}

interface LoginCustomerBody {
  identifier: string // Pode ser email ou CPF
  password: string
}

interface UpdateCustomerProfileBody {
  name?: string
  email?: string | null
  phone?: string | null
}

export class CustomerController {
  private readonly orderRepository: OrderRepository

  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly customerAddressRepository: CustomerAddressRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly jwtSign: (payload: {
      sub: string
      storeId: string
      type: 'customer'
    }) => Promise<string>
  ) {
    this.orderRepository = new OrderRepository()
  }

  async register(
    request: FastifyRequest<{ Body: RegisterCustomerBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const dependencies = {
        customerRepository: this.customerRepository
      }

      const result = await registerCustomerUseCase(
        request.body as RegisterCustomerInput,
        storeId,
        dependencies
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
        const statusCode = error.message.includes('já cadastrado')
          ? 409 // Conflict - recurso já existe
          : error.message.includes('CPF inválido') || error.message.includes('Email inválido')
            ? 400 // Bad Request - validação falhou
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async login(
    request: FastifyRequest<{ Body: LoginCustomerBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const dependencies = {
        customerRepository: this.customerRepository,
        authSessionRepository: this.authSessionRepository,
        jwtSign: this.jwtSign
      }

      const result = await loginCustomerUseCase(
        request.body as LoginCustomerInput,
        storeId,
        dependencies
      )

      const isProduction = process.env.NODE_ENV === 'production'

      reply.setCookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        path: '/',
        maxAge: 60 * 60 * 24 * 30
      })

      await reply.send({
        accessToken: result.accessToken,
        customer: result.customer
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
        let statusCode = 500
        let errorMessage = error.message

        if (error.message === 'Invalid credentials') {
          statusCode = 401
          errorMessage = 'Email/CPF ou senha incorretos'
        } else if (error.message === 'CPF inválido') {
          statusCode = 400
        }

        await reply.code(statusCode).send({ error: errorMessage })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async me(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const customer = request.customer
      if (!customer) {
        await reply.code(401).send({ error: 'Not authenticated' })
        return
      }

      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const dependencies = {
        customerRepository: this.customerRepository
      }

      const profile = await getCustomerProfileUseCase(
        customer.id,
        storeId,
        dependencies
      )

      await reply.send({
        customer: profile
      })
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = error.message === 'Customer not found' ? 404 : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async updateProfile(
    request: FastifyRequest<{ Body: UpdateCustomerProfileBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const customer = request.customer
      if (!customer) {
        await reply.code(401).send({ error: 'Not authenticated' })
        return
      }

      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const dependencies = {
        customerRepository: this.customerRepository
      }

      const updated = await updateCustomerProfileUseCase(
        customer.id,
        storeId,
        request.body as UpdateCustomerProfileInput,
        dependencies
      )

      await reply.send({
        customer: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          cpf: updated.cpf,
          phone: updated.phone,
          created_at: updated.created_at
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
        const statusCode = error.message === 'Customer not found'
          ? 404 // Not Found
          : error.message.includes('já cadastrado')
            ? 409 // Conflict - recurso já existe
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async listAddresses(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const customer = request.customer
      if (!customer) {
        await reply.code(401).send({ error: 'Not authenticated' })
        return
      }

      const dependencies = {
        customerAddressRepository: this.customerAddressRepository
      }

      const addresses = await listCustomerAddressesUseCase(customer.id, dependencies)

      await reply.send({ addresses })
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async createAddress(
    request: FastifyRequest<{ Body: CreateCustomerAddressInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const customer = request.customer
      if (!customer) {
        await reply.code(401).send({ error: 'Not authenticated' })
        return
      }

      const dependencies = {
        customerAddressRepository: this.customerAddressRepository
      }

      const result = await createCustomerAddressUseCase(
        customer.id,
        request.body as CreateCustomerAddressInput,
        dependencies
      )

      await reply.code(201).send({ address: result.address })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async updateAddress(
    request: FastifyRequest<{
      Params: { id: string }
      Body: UpdateCustomerAddressInput
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const customer = request.customer
      if (!customer) {
        await reply.code(401).send({ error: 'Not authenticated' })
        return
      }

      const dependencies = {
        customerAddressRepository: this.customerAddressRepository
      }

      const address = await updateCustomerAddressUseCase(
        request.params.id,
        customer.id,
        request.body as UpdateCustomerAddressInput,
        dependencies
      )

      await reply.send({ address })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        const statusCode = error.message === 'Address not found' ? 404 : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async deleteAddress(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const customer = request.customer
      if (!customer) {
        await reply.code(401).send({ error: 'Not authenticated' })
        return
      }

      const dependencies = {
        customerAddressRepository: this.customerAddressRepository
      }

      await deleteCustomerAddressUseCase(request.params.id, customer.id, dependencies)

      await reply.code(204).send()
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = error.message === 'Address not found' ? 404 : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async setDefaultAddress(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const customer = request.customer
      if (!customer) {
        await reply.code(401).send({ error: 'Not authenticated' })
        return
      }

      const dependencies = {
        customerAddressRepository: this.customerAddressRepository
      }

      const address = await setDefaultCustomerAddressUseCase(
        request.params.id,
        customer.id,
        dependencies
      )

      await reply.send({ address })
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = error.message === 'Address not found' ? 404 : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async updatePassword(
    request: FastifyRequest<{
      Body: { current_password: string; new_password: string }
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const customer = request.customer
      if (!customer) {
        await reply.code(401).send({ error: 'Not authenticated' })
        return
      }

      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const dependencies = {
        customerRepository: this.customerRepository
      }

      await updateCustomerPasswordUseCase(
        customer.id,
        storeId,
        request.body,
        dependencies
      )

      await reply.code(204).send()
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
          error.message === 'Customer not found' ||
          error.message === 'Senha atual incorreta' ||
          error.message === 'Cliente não possui senha cadastrada'
            ? 400
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async listOrders(
    request: FastifyRequest<{
      Querystring: {
        status?: string
        payment_status?: string
      }
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const customer = request.customer
      if (!customer) {
        await reply.code(401).send({ error: 'Not authenticated' })
        return
      }

      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const filters: ListOrdersFilters = {
        customer_id: customer.id
      }

      if (request.query.status) {
        filters.status = request.query.status as ListOrdersFilters['status']
      }

      if (request.query.payment_status) {
        filters.payment_status = request.query.payment_status as ListOrdersFilters['payment_status']
      }

      const orders = await listOrdersUseCase(storeId, filters, {
        orderRepository: this.orderRepository
      })

      await reply.send({ orders })
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async getOrder(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const customer = request.customer
      if (!customer) {
        await reply.code(401).send({ error: 'Not authenticated' })
        return
      }

      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const { id } = request.params

      const order = await getOrderUseCase(id, storeId, {
        orderRepository: this.orderRepository
      })

      if (!order) {
        await reply.code(404).send({ error: 'Order not found' })
        return
      }

      // Verificar se o pedido pertence ao cliente autenticado
      if (order.customer_id !== customer.id) {
        await reply.code(403).send({ error: 'Access denied. This order does not belong to you.' })
        return
      }

      await reply.send({ order })
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }
}

