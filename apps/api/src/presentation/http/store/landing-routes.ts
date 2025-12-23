import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { LandingController } from '../admin/landing-controller'
import { LandingRepository } from '../../../infra/db/repositories/landing-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'

/**
 * Rotas públicas para o front-end buscar páginas dinâmicas
 * Não requer autenticação, apenas tenant (via domain)
 */
export async function registerStoreLandingRoutes(
  app: FastifyInstance
): Promise<void> {
  const landingRepository = new LandingRepository()
  const landingController = new LandingController(landingRepository)

  // GET /store/dynamic-pages/:slug - Buscar página por slug com produtos (público)
  app.get(
    '/store/dynamic-pages/:slug',
    {
      onRequest: [tenantMiddleware]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const storeId = (request as any).storeId as string
        const { slug } = request.params as { slug: string }

        const page = await landingRepository.findBySlugWithProducts(slug, storeId)

        if (!page) {
          return reply.status(404).send({ error: 'Page not found' })
        }

        // Só retornar se estiver publicada
        if (!page.published) {
          return reply.status(404).send({ error: 'Page not found' })
        }

        return reply.status(200).send({ page })
      } catch (error) {
        console.error('Error fetching dynamic page:', error)
        return reply.status(500).send({ error: 'Failed to fetch dynamic page' })
      }
    }
  )
}









