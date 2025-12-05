import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { TemplateSettingsController } from './template-settings-controller'
import { TemplateSettingsRepository } from '../../../infra/db/repositories/template-settings-repository'
import { requireAuth } from '../../../infra/http/middlewares/auth'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'

export async function registerTemplateSettingsRoutes(
  app: FastifyInstance
): Promise<void> {
  const templateSettingsRepository = new TemplateSettingsRepository()
  const templateSettingsController = new TemplateSettingsController(templateSettingsRepository)

  // GET /settings/template - Buscar configuração do template (admin autenticado)
  app.get(
    '/settings/template',
    {
      onRequest: [requireAuth, tenantMiddleware]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await templateSettingsController.getConfig(request, reply)
    }
  )

  // PUT /settings/template - Salvar configuração do template (admin autenticado)
  app.put<{
    Body: {
      config: Record<string, unknown>
    }
  }>(
    '/settings/template',
    {
      onRequest: [requireAuth, tenantMiddleware]
    },
    async (
      request: FastifyRequest<{
        Body: {
          config: Record<string, unknown>
        }
      }>,
      reply: FastifyReply
    ) => {
      await templateSettingsController.saveConfig(request, reply)
    }
  )

  // GET /settings/template/public - Buscar configuração do template (público, apenas tenant)
  app.get(
    '/settings/template/public',
    {
      onRequest: [tenantMiddleware]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await templateSettingsController.getConfigPublic(request, reply)
    }
  )
}




