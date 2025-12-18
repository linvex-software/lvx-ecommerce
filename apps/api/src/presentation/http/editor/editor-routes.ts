import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { EditorController } from './editor-controller'
import { StoreLayoutRepository } from '../../../infra/db/repositories/store-layout-repository'
import { requireAuth } from '../../../infra/http/middlewares/auth'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'

export async function registerEditorRoutes(
  app: FastifyInstance
): Promise<void> {
  const storeLayoutRepository = new StoreLayoutRepository()
  const editorController = new EditorController(storeLayoutRepository)

  // GET /editor/layout - Buscar layout salvo (público, apenas tenant)
  app.get(
    '/editor/layout',
    {
      onRequest: [tenantMiddleware]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await editorController.getLayoutPublic(request, reply)
    }
  )

  // GET /editor/layout/admin - Buscar layout salvo (admin autenticado)
  app.get(
    '/editor/layout/admin',
    {
      onRequest: [requireAuth, tenantMiddleware]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await editorController.getLayout(request, reply)
    }
  )

  // POST /editor/layout - Salvar layout (admin autenticado)
  app.post<{
    Body: {
      layout_json: Record<string, unknown>
    }
  }>(
    '/editor/layout',
    {
      onRequest: [requireAuth, tenantMiddleware]
    },
    async (
      request: FastifyRequest<{
        Body: {
          layout_json: Record<string, unknown>
        }
      }>,
      reply: FastifyReply
    ) => {
      await editorController.saveLayout(request, reply)
    }
  )
}

