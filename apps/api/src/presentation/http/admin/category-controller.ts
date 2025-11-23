import type { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import {
  listCategoriesUseCase,
  listCategoriesSchema
} from '../../../application/catalog/use-cases/list-categories'
import { getCategoryUseCase } from '../../../application/catalog/use-cases/get-category'
import {
  createCategoryUseCase,
  createCategorySchema
} from '../../../application/catalog/use-cases/create-category'
import {
  updateCategoryUseCase,
  updateCategorySchema
} from '../../../application/catalog/use-cases/update-category'
import { deleteCategoryUseCase } from '../../../application/catalog/use-cases/delete-category'
import { CategoryRepository } from '../../../infra/db/repositories/category-repository'

export class CategoryController {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async list(
    request: FastifyRequest<{
      Querystring: {
        q?: string
        page?: string
        limit?: string
      }
    }>,
    reply: FastifyReply
  ) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const filters = {
        q: request.query.q,
        page: request.query.page ? Number.parseInt(request.query.page, 10) : undefined,
        limit: request.query.limit ? Number.parseInt(request.query.limit, 10) : undefined
      }

      const result = await listCategoriesUseCase(storeId, filters, {
        categoryRepository: this.categoryRepository
      })

      await reply.code(200).send(result)
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Invalid filters',
          details: error.errors
        })
        return
      }

      request.log.error(error)
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async get(
    request: FastifyRequest<{
      Params: { id: string }
    }>,
    reply: FastifyReply
  ) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const category = await getCategoryUseCase(request.params.id, storeId, {
        categoryRepository: this.categoryRepository
      })

      await reply.code(200).send({ category })
    } catch (error: any) {
      if (error.statusCode === 404) {
        await reply.code(404).send({ error: error.message })
        return
      }

      request.log.error(error)
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async create(
    request: FastifyRequest<{
      Body: {
        name: string
        slug?: string
      }
    }>,
    reply: FastifyReply
  ) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const validated = createCategorySchema.parse(request.body)

      const category = await createCategoryUseCase(storeId, validated, {
        categoryRepository: this.categoryRepository
      })

      await reply.code(201).send({ category })
    } catch (error: any) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Invalid input',
          details: error.errors
        })
        return
      }

      if (error.statusCode === 409) {
        await reply.code(409).send({ error: error.message })
        return
      }

      request.log.error(error)
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async update(
    request: FastifyRequest<{
      Params: { id: string }
      Body: {
        name?: string
        slug?: string
      }
    }>,
    reply: FastifyReply
  ) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const validated = updateCategorySchema.parse(request.body)

      const category = await updateCategoryUseCase(
        request.params.id,
        storeId,
        validated,
        {
          categoryRepository: this.categoryRepository
        }
      )

      await reply.code(200).send({ category })
    } catch (error: any) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Invalid input',
          details: error.errors
        })
        return
      }

      if (error.statusCode === 404 || error.statusCode === 409) {
        await reply.code(error.statusCode).send({ error: error.message })
        return
      }

      request.log.error(error)
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async delete(
    request: FastifyRequest<{
      Params: { id: string }
    }>,
    reply: FastifyReply
  ) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      await deleteCategoryUseCase(request.params.id, storeId, {
        categoryRepository: this.categoryRepository
      })

      await reply.code(204).send()
    } catch (error: any) {
      if (error.statusCode === 404) {
        await reply.code(404).send({ error: error.message })
        return
      }

      request.log.error(error)
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }
}

