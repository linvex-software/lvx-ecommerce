import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PublicCategoryController } from './category-controller'
import { CategoryRepository } from '../../../infra/db/repositories/category-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'

export async function registerCatalogCategoryRoutes(
    app: FastifyInstance
): Promise<void> {
    const categoryRepository = new CategoryRepository()
    const categoryController = new PublicCategoryController(categoryRepository)

    // GET /categories - Lista categorias públicas
    app.get<{
        Querystring: {
            q?: string
            page?: string
            limit?: string
        }
    }>(
        '/categories',
        {
            onRequest: [tenantMiddleware]
        },
        async (
            request: FastifyRequest<{
                Querystring: {
                    q?: string
                    page?: string
                    limit?: string
                }
            }>,
            reply: FastifyReply
        ) => {
            await categoryController.list(request, reply)
        }
    )

    // GET /categories/:id - Detalhe da categoria pública
    app.get<{ Params: { id: string } }>(
        '/categories/:id',
        {
            onRequest: [tenantMiddleware]
        },
        async (
            request: FastifyRequest<{ Params: { id: string } }>,
            reply: FastifyReply
        ) => {
            await categoryController.get(request, reply)
        }
    )

    // GET /categories/slug/:slug - Detalhe da categoria pública por slug
    app.get<{ Params: { slug: string } }>(
        '/categories/slug/:slug',
        {
            onRequest: [tenantMiddleware]
        },
        async (
            request: FastifyRequest<{ Params: { slug: string } }>,
            reply: FastifyReply
        ) => {
            await categoryController.getBySlug(request, reply)
        }
    )
}
