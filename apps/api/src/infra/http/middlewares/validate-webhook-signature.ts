import { createHmac, timingSafeEqual } from 'crypto'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { WebhookRequestContext } from '../types/fastify'

function getWebhookSecret(provider: string): string {
  const envKey = `WEBHOOK_SECRET_${provider.toUpperCase()}`
  const secret = process.env[envKey]

  if (!secret) {
    throw new Error(`Webhook secret not configured for provider: ${provider}`)
  }

  return secret
}

export async function validateWebhookSignature(
  request: FastifyRequest<{ Params: { provider: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { provider } = request.params

    if (!provider) {
      await reply.code(400).send({ error: 'Provider is required' })
      return
    }

    const storeId = request.storeId
    if (!storeId) {
      await reply.code(400).send({ error: 'Store ID is required' })
      return
    }

    // Obter raw body (armazenado pelo parser customizado)
    const rawBody = request.rawBody
    if (!rawBody) {
      await reply.code(400).send({ error: 'Request body is required' })
      return
    }

    // Obter header de assinatura (tenta diferentes formatos comuns)
    const signatureHeader =
      (request.headers['x-signature'] as string | undefined) ??
      (request.headers['x-hub-signature'] as string | undefined) ??
      (request.headers['x-mercadopago-signature'] as string | undefined) ??
      (request.headers['x-pagseguro-signature'] as string | undefined)

    let signatureValid = false

    if (signatureHeader) {
      try {
        const secret = getWebhookSecret(provider)
        const computed = createHmac('sha256', secret)
          .update(rawBody)
          .digest('hex')

        // Extrair hash do header (alguns providers enviam "sha256=hash" ou apenas "hash")
        let receivedHash = signatureHeader.includes('=')
          ? signatureHeader.split('=')[1]
          : signatureHeader

        // Limpar espaços em branco e caracteres inválidos
        receivedHash = receivedHash.trim().replace(/^:\s*/, '').trim()

        // Comparação segura contra timing attacks
        const computedBuffer = Buffer.from(computed, 'hex')
        let receivedBuffer: Buffer
        
        try {
          receivedBuffer = Buffer.from(receivedHash, 'hex')
        } catch (error) {
          signatureValid = false
          // Popular contexto mesmo com assinatura inválida
          const webhookContext: WebhookRequestContext = {
            provider,
            storeId,
            signatureValid
          }
          request.webhookContext = webhookContext
          return
        }

        // Se os tamanhos forem diferentes, não são iguais
        if (computedBuffer.length === receivedBuffer.length) {
          signatureValid = timingSafeEqual(computedBuffer, receivedBuffer)
        }
      } catch (error) {
        // Se houver erro ao calcular HMAC, assinatura é inválida
        signatureValid = false
      }
    }

    // Popular contexto de webhook
    const webhookContext: WebhookRequestContext = {
      provider,
      storeId,
      signatureValid
    }

    request.webhookContext = webhookContext
  } catch (error) {
    if (error instanceof Error) {
      await reply.code(500).send({ error: error.message })
      return
    }
    await reply.code(500).send({ error: 'Internal server error' })
  }
}

