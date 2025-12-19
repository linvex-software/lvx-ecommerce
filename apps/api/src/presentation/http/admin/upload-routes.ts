import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { createR2StorageService } from '../../../infra/storage/r2-storage'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireAuth, requireRole } from '../../../infra/http/middlewares/auth'

export async function registerUploadRoutes(app: FastifyInstance): Promise<void> {
  // POST /admin/upload/image - Upload de imagem (admin ou operador)
  app.post(
    '/admin/upload/image',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Verificar se é multipart
        if (!request.isMultipart()) {
          await reply.code(400).send({ error: 'Request must be multipart/form-data' })
          return
        }

        const data = await request.file()

        if (!data) {
          await reply.code(400).send({ error: 'No file provided' })
          return
        }

        // Validar tipo de arquivo
        if (!data.mimetype || !data.mimetype.startsWith('image/')) {
          await reply.code(400).send({
            error: 'Invalid file type',
            message: 'Apenas arquivos de imagem são permitidos (JPG, PNG, GIF, etc.)'
          })
          return
        }

        // Ler o arquivo em buffer
        const maxSize = 5 * 1024 * 1024 // 5MB
        const chunks: Buffer[] = []
        let totalSize = 0

        for await (const chunk of data.file) {
          totalSize += chunk.length
          
          // Validar tamanho durante o stream para evitar carregar arquivos muito grandes
          if (totalSize > maxSize) {
            await reply.code(400).send({
              error: 'File too large',
              message: 'O arquivo deve ter no máximo 5MB'
            })
            return
          }
          
          chunks.push(chunk)
        }

        const fileBuffer = Buffer.concat(chunks)

        // Validar tamanho final (redundante, mas seguro)
        if (fileBuffer.length > maxSize) {
          await reply.code(400).send({
            error: 'File too large',
            message: 'O arquivo deve ter no máximo 5MB'
          })
          return
        }

        // Fazer upload para R2
        const r2Storage = createR2StorageService()
        const fileName = data.filename || 'image.jpg'
        const imageUrl = await r2Storage.uploadImage(
          fileBuffer,
          fileName,
          data.mimetype,
          'products'
        )

        await reply.send({
          success: true,
          url: imageUrl
        })
      } catch (error) {
        console.error('[UploadRoutes] Erro ao fazer upload:', error)
        
        // Log detalhado para debug
        if (error instanceof Error) {
          console.error('[UploadRoutes] Erro detalhado:', {
            message: error.message,
            name: error.name,
            stack: error.stack
          })
        }

        if (error instanceof Error) {
          // Se for erro de configuração do R2
          if (error.message.includes('Variáveis de ambiente do R2')) {
            await reply.code(500).send({
              error: 'Storage configuration error',
              message: error.message
            })
            return
          }

          // Se for erro de credenciais ou bucket
          if (error.message.includes('Credenciais') || error.message.includes('Bucket') || error.message.includes('endpoint')) {
            await reply.code(500).send({
              error: 'Storage configuration error',
              message: error.message
            })
            return
          }

          // Se for erro de validação
          if (error.message.includes('Arquivo deve ser') || error.message.includes('muito grande')) {
            await reply.code(400).send({
              error: 'Validation error',
              message: error.message
            })
            return
          }

          // Retornar mensagem de erro específica
          await reply.code(500).send({
            error: 'Upload failed',
            message: error.message
          })
          return
        }

        await reply.code(500).send({
          error: 'Internal server error',
          message: 'Erro desconhecido ao fazer upload da imagem'
        })
      }
    }
  )
}

