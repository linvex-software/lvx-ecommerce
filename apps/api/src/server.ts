import 'dotenv/config'

import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import swagger from '@fastify/swagger'
import jwt from '@fastify/jwt'

async function buildServer() {
  const app = Fastify({
    logger: true
  })

  await app.register(cors, { origin: true })
  await app.register(multipart)
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'White Label API',
        version: '0.1.0'
      }
    }
  })

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    app.log.warn('JWT_SECRET não encontrado. JWT desabilitado.')
  } else {
    await app.register(jwt, {
      secret: jwtSecret
    })
  }

  app.get('/health', async () => {
    return { ok: true }
  })

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

