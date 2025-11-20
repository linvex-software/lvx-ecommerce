import 'dotenv/config'

import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import swagger from '@fastify/swagger'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import { registerAuthRoutes } from './presentation/http/auth/auth-routes'

async function buildServer() {
  const app = Fastify({
    logger: true
  })

  await app.register(cors, {
    origin: true,
    credentials: true
  })
  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'cookie-secret-change-me'
  })
  await app.register(multipart)
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'White Label API',
        version: '0.1.0',
        description: 'API REST para o sistema de e-commerce white label'
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 3333}`,
          description: 'Servidor de desenvolvimento'
        }
      ]
    }
  })

  const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
  if (!jwtAccessSecret) {
    app.log.warn('JWT_ACCESS_SECRET não encontrado. JWT desabilitado.')
  } else {
    await app.register(jwt, {
      secret: jwtAccessSecret
    })
  }

  app.get('/', async () => {
    return {
      name: 'White Label API',
      version: '0.1.0',
      status: 'running',
      endpoints: {
        health: '/health',
        swagger: '/documentation/json'
      }
    }
  })

  app.get('/health', async () => {
    return { ok: true, timestamp: new Date().toISOString() }
  })

  await registerAuthRoutes(app)

  return app
}

async function start() {
  try {
    const app = await buildServer()
    const port = Number(process.env.PORT || 3333)
    const host = '0.0.0.0'

    await app.listen({ port, host })
    app.log.info(`🚀 API rodando em http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`)
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error)
    process.exit(1)
  }
}

start()

