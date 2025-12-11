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

/**
 * Middleware opcional de autenticação do cliente
 * Tenta extrair customer_id do token JWT se disponível,
 * mas não falha se o token não existir (para suportar guest checkout)
 */
export async function optionalCustomerAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization

    // Se não tiver token, apenas continua sem popular request.customer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return
    }

    // Tentar decodificar o token
    const decoded = await request.jwtVerify<{
      sub: string
      storeId: string
      type: string
    }>()

    // Verificar se é token de cliente
    if (decoded.type === 'customer' && decoded.sub && decoded.storeId) {
      request.customer = {
        id: decoded.sub,
        storeId: decoded.storeId
      }
    }
  } catch {
    // Token inválido ou expirado - apenas ignora e continua
    // Não retorna erro para permitir guest checkout
  }
}

