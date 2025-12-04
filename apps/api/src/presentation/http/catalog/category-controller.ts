import type { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import {
    listCategoriesUseCase,
} from '../../../application/catalog/use-cases/list-categories'
import { getCategoryUseCase, getCategoryBySlugUseCase } from '../../../application/catalog/use-cases/get-category'
import { CategoryRepository } from '../../../infra/db/repositories/category-repository'

export class PublicCategoryController {
    constructor(private readonly categoryRepository: CategoryRepository) { }

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

    async getBySlug(
        request: FastifyRequest<{
            Params: { slug: string }
        }>,
        reply: FastifyReply
    ) {
        try {
            const storeId = request.storeId
            if (!storeId) {
                await reply.code(400).send({ error: 'Store ID is required' })
                return
            }

            const category = await getCategoryBySlugUseCase(request.params.slug, storeId, {
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
}
