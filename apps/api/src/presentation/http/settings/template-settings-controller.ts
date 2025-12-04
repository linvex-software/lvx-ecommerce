import type { FastifyRequest, FastifyReply } from 'fastify'
import { TemplateSettingsRepository } from '../../../infra/db/repositories/template-settings-repository'

export class TemplateSettingsController {
  constructor(private templateSettingsRepository: TemplateSettingsRepository) {}

  async getConfig(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user?.storeId) {
        await reply.code(401).send({ error: 'Unauthorized' })
        return
      }

      const settings = await this.templateSettingsRepository.findByStoreId(
        request.user.storeId
      )

      // Retornar configuração padrão se não houver salva
      if (!settings) {
        const defaultConfig = {
          theme: {
            primaryColor: '#C2185B',
            secondaryColor: '#F8E8EC',
            backgroundColor: '#FFFFFF',
            buttonColor: '#C2185B',
            textColor: '#333333'
          },
          branding: {
            logoUrl: '/logo.png',
            faviconUrl: '/favicon.ico',
            storeName: 'Flor de Menina Boutique'
          },
          content: {
            home: {
              heroTitle: 'Nova Coleção',
              heroSubtitle: 'Elegância que transforma'
            },
            footer: {
              policyText: 'Política de Trocas e Devoluções'
            }
          }
        }

        await reply.send({ config: defaultConfig })
        return
      }

      await reply.send({
        config: settings.config_json,
        updated_at: settings.updated_at
      })
    } catch (error) {
      request.log.error(error, 'Error getting template config')
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async getConfigPublic(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = (request as any).storeId

      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const settings = await this.templateSettingsRepository.findByStoreId(storeId)

      if (!settings) {
        // Retornar configuração padrão se não houver salva
        const defaultConfig = {
          theme: {
            primaryColor: '#C2185B',
            secondaryColor: '#F8E8EC',
            backgroundColor: '#FFFFFF',
            buttonColor: '#C2185B',
            textColor: '#333333'
          },
          branding: {
            logoUrl: '/logo.png',
            faviconUrl: '/favicon.ico',
            storeName: 'Flor de Menina Boutique'
          },
          content: {
            home: {
              heroTitle: 'Nova Coleção',
              heroSubtitle: 'Elegância que transforma'
            },
            footer: {
              policyText: 'Política de Trocas e Devoluções'
            }
          }
        }

        await reply.send({ config: defaultConfig })
        return
      }

      await reply.send({
        config: settings.config_json,
        updated_at: settings.updated_at
      })
    } catch (error) {
      request.log.error(error, 'Error getting template config public')
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async saveConfig(
    request: FastifyRequest<{ Body: { config: Record<string, unknown> } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user?.storeId) {
        await reply.code(401).send({ error: 'Unauthorized' })
        return
      }

      const { config } = request.body

      if (!config) {
        await reply.code(400).send({ error: 'config is required' })
        return
      }

      // Validar que config é um objeto válido
      if (typeof config !== 'object' || config === null || Array.isArray(config)) {
        await reply.code(400).send({ error: 'config must be an object' })
        return
      }

      // Validar estrutura básica
      if (!config.theme || !config.branding || !config.content) {
        await reply.code(400).send({ error: 'config must have theme, branding, and content properties' })
        return
      }

      // Tentar serializar para garantir que é JSON válido
      try {
        JSON.stringify(config)
      } catch (jsonError) {
        request.log.error(jsonError, 'Invalid JSON in config')
        await reply.code(400).send({ error: 'config contains invalid JSON' })
        return
      }

      const settings = await this.templateSettingsRepository.upsert({
        store_id: request.user.storeId,
        config_json: config,
        template_id: 'flor-de-menina' // Por enquanto, fixo
      })

      await reply.send({
        success: true,
        config: settings.config_json,
        updated_at: settings.updated_at
      })
    } catch (error) {
      request.log.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          storeId: request.user?.storeId
        },
        'Error saving template config'
      )
      
      const errorMessage = error instanceof Error ? error.message : 'Internal server error'
      await reply.code(500).send({ 
        error: 'Internal server error',
        message: errorMessage
      })
    }
  }
}



