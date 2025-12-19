import type { FastifyRequest, FastifyReply } from 'fastify'
import type { UserRole } from '../../../domain/auth/auth-types'

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await reply.code(401).send({ error: 'Missing or invalid authorization header' })
      return
    }

    const decoded = await request.jwtVerify<{
      sub: string
      storeId?: string
      role?: UserRole
      type?: string
    }>()

    // Log para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[requireAuth] Token decodificado:', {
        sub: decoded.sub,
        storeId: decoded.storeId,
        role: decoded.role,
        type: decoded.type,
        allKeys: Object.keys(decoded)
      })
    }

    if (!decoded.sub) {
      await reply.code(401).send({ error: 'Invalid token payload' })
      return
    }

    // Rejeitar tokens de cliente (type: 'customer')
    if (decoded.type === 'customer') {
      await reply.code(401).send({ error: 'Invalid token type. User token required.' })
      return
    }

    request.user = {
      id: decoded.sub,
      storeId: decoded.storeId,
      role: decoded.role,
      email: '',
      name: ''
    }

    // Log do user criado
    if (process.env.NODE_ENV !== 'production') {
      console.log('[requireAuth] request.user criado:', request.user)
    }
  } catch (error) {
    await reply.code(401).send({ error: 'Invalid or expired token' })
  }
}

export async function requireAuthWithStore(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await reply.code(401).send({ error: 'Missing or invalid authorization header' })
      return
    }

    const decoded = await request.jwtVerify<{
      sub: string
      storeId: string
      role: UserRole
    }>()

    if (!decoded.sub || !decoded.storeId || !decoded.role) {
      await reply.code(401).send({ error: 'Invalid token payload' })
      return
    }

    request.user = {
      id: decoded.sub,
      storeId: decoded.storeId,
      role: decoded.role,
      email: '',
      name: ''
    }
  } catch (error) {
    await reply.code(401).send({ error: 'Invalid or expired token' })
  }
}

export function requireRole(roles: UserRole[]) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const user = request.user as { id: string; role: UserRole } | undefined

    // Log para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[requireRole] Verificando permissões:', {
        userRole: user?.role,
        requiredRoles: roles,
        userExists: !!user,
        userObject: user
      })
    }

    if (!user) {
      await reply.code(401).send({ error: 'Unauthorized' })
      return
    }

    if (!user.role) {
      console.error('[requireRole] ERRO: user.role está undefined!', { user })
      await reply.code(403).send({ 
        error: 'Forbidden: insufficient permissions',
        message: 'User role is not defined in token'
      })
      return
    }

    if (!roles.includes(user.role)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[requireRole] Acesso negado:', {
          userRole: user.role,
          requiredRoles: roles,
          hasAccess: roles.includes(user.role)
        })
      }
      await reply.code(403).send({ error: 'Forbidden: insufficient permissions' })
      return
    }
  }
}

