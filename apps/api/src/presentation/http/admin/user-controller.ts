import type { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import {
  createUserUseCase,
  createUserSchema
} from '../../../application/users/use-cases/create-user'
import { listUsersUseCase } from '../../../application/users/use-cases/list-users'
import { listVendorsUseCase } from '../../../application/users/use-cases/list-vendors'
import {
  updateUserPasswordUseCase,
  updateUserPasswordSchema
} from '../../../application/users/use-cases/update-user-password'
import { UserRepository } from '../../../infra/db/repositories/user-repository'

export class UserController {
  constructor(private readonly userRepository: UserRepository) {}

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const result = await listUsersUseCase(storeId, {
        userRepository: this.userRepository
      })

      await reply.send(result)
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const validated = createUserSchema.parse(request.body)

      const user = await createUserUseCase(validated, storeId, {
        userRepository: this.userRepository
      })

      // Remover password_hash da resposta
      const { password_hash, ...userWithoutPassword } = user

      await reply.code(201).send({ user: userWithoutPassword })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        const statusCode = error.message.includes('already in use') ? 409 : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const { id } = request.params

      // Não permitir deletar a si mesmo
      if (id === request.user?.id) {
        await reply.code(400).send({ error: 'Cannot delete yourself' })
        return
      }

      await this.userRepository.delete(id, storeId)

      await reply.code(204).send()
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async listVendors(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const result = await listVendorsUseCase(storeId, {
        userRepository: this.userRepository
      })

      await reply.send(result)
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async updatePassword(
    request: FastifyRequest<{
      Params: { id: string }
      Body: { new_password: string }
    }>,
    reply: FastifyReply
  ) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const { id } = request.params

      const dependencies = {
        userRepository: this.userRepository
      }

      await updateUserPasswordUseCase(id, storeId, request.body, dependencies)

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
        const statusCode = error.message === 'User not found' ? 404 : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }
}

