import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { LandingController } from './landing-controller'
import { LandingRepository } from '../../../infra/db/repositories/landing-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireAuth, requireRole } from '../../../infra/http/middlewares/auth'

export async function registerAdminLandingRoutes(
  app: FastifyInstance
): Promise<void> {
  const landingRepository = new LandingRepository()
  const landingController = new LandingController(landingRepository)

  // POST /admin/dynamic-pages - Criar nova página dinâmica
  app.post(
    '/admin/dynamic-pages',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await landingController.create(request, reply)
    }
  )

  // GET /admin/dynamic-pages - Listar todas as páginas dinâmicas
  app.get(
    '/admin/dynamic-pages',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await landingController.list(request, reply)
    }
  )

  // GET /admin/dynamic-pages/:id - Buscar página por ID
  app.get(
    '/admin/dynamic-pages/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await landingController.get(request, reply)
    }
  )

  // PUT /admin/dynamic-pages/:id - Atualizar página
  app.put(
    '/admin/dynamic-pages/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await landingController.update(request, reply)
    }
  )

  // PUT /admin/dynamic-pages/:id/content - Atualizar conteúdo Craft.js
  app.put(
    '/admin/dynamic-pages/:id/content',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await landingController.updateContent(request, reply)
    }
  )

  // PUT /admin/dynamic-pages/:id/products - Atualizar produtos da página
  app.put(
    '/admin/dynamic-pages/:id/products',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await landingController.setProducts(request, reply)
    }
  )

  // DELETE /admin/dynamic-pages/:id - Deletar página
  app.delete(
    '/admin/dynamic-pages/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await landingController.delete(request, reply)
    }
  )
}









