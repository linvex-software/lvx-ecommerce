import type { FastifyRequest, FastifyReply } from 'fastify'

export interface CustomerAuth {
  id: string
  storeId: string
}

declare module 'fastify' {
  interface FastifyRequest {
    customer?: CustomerAuth
  }
}

export async function requireCustomerAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await reply.code(401).send({
        error: 'Missing or invalid authorization header'
      })
      return
    }

    const decoded = await request.jwtVerify<{
      sub: string
      storeId: string
      type: string
    }>()

    // Verificar se é token de cliente
    if (decoded.type !== 'customer') {
      await reply.code(401).send({
        error: 'Invalid token type. Customer token required.'
      })
      return
    }

    if (!decoded.sub || !decoded.storeId) {
      await reply.code(401).send({ error: 'Invalid token payload' })
      return
    }

    request.customer = {
      id: decoded.sub,
      storeId: decoded.storeId
    }
  } catch {
    await reply.code(401).send({ error: 'Invalid or expired token' })
  }
}

