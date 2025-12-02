import type { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { registerCustomerUseCase } from '../../../application/customers/use-cases/register-customer'
import { loginCustomerUseCase } from '../../../application/customers/use-cases/login-customer'
import { getCustomerProfileUseCase } from '../../../application/customers/use-cases/get-customer-profile'
import { updateCustomerProfileUseCase } from '../../../application/customers/use-cases/update-customer-profile'
import { CustomerRepository } from '../../../infra/db/repositories/customer-repository'
import { AuthSessionRepository } from '../../../infra/db/repositories/auth-session-repository'
import type {
  RegisterCustomerInput,
  LoginCustomerInput,
  UpdateCustomerProfileInput
} from '../../../domain/customers/customer-types'

interface RegisterCustomerBody {
  name: string
  cpf: string
  email?: string | null
  phone?: string | null
  password: string
}

interface LoginCustomerBody {
  cpf: string
  password: string
}

interface UpdateCustomerProfileBody {
  name?: string
  email?: string | null
  phone?: string | null
}

export class CustomerController {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly jwtSign: (payload: {
      sub: string
      storeId: string
      type: 'customer'
    }) => Promise<string>
  ) {}

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
        const statusCode =
          error.message === 'Invalid credentials' ? 401 : 500
        await reply.code(statusCode).send({ error: error.message })
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
}

