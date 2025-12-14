import type { FastifyInstance } from 'fastify'
import { CustomerController } from './customer-controller'
import { FavoriteController } from './favorite-controller'
import { CustomerRepository } from '../../../infra/db/repositories/customer-repository'
import { CustomerAddressRepository } from '../../../infra/db/repositories/customer-address-repository'
import { AuthSessionRepository } from '../../../infra/db/repositories/auth-session-repository'
import { FavoriteRepository } from '../../../infra/db/repositories/favorite-repository'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireCustomerAuth } from '../../../infra/http/middlewares/customer-auth'

export async function registerCustomerRoutes(
  app: FastifyInstance
): Promise<void> {
  const customerRepository = new CustomerRepository()
  const customerAddressRepository = new CustomerAddressRepository()
  const authSessionRepository = new AuthSessionRepository()

  const jwtSign = async (payload: {
    sub: string
    storeId: string
    type: 'customer'
  }): Promise<string> => {
    if (!app.jwt) {
      throw new Error(
        'JWT is not configured. Please set JWT_ACCESS_SECRET in .env file'
      )
    }
    try {
      return app.jwt.sign(payload)
    } catch (error) {
      throw new Error(
        `JWT sign error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  const customerController = new CustomerController(
    customerRepository,
    customerAddressRepository,
    authSessionRepository,
    jwtSign
  )

  // POST /customers/register - Cadastro público (exige store_id via tenant)
  app.post(
    '/customers/register',
    {
      onRequest: [tenantMiddleware]
    },
    async (request, reply) => {
      await customerController.register(request, reply)
    }
  )

  // POST /customers/login - Login público (exige store_id)
  app.post(
    '/customers/login',
    {
      onRequest: [tenantMiddleware]
    },
    async (request, reply) => {
      await customerController.login(request, reply)
    }
  )

  // GET /customers/me - Perfil do cliente (protegido)
  app.get(
    '/customers/me',
    {
      onRequest: [tenantMiddleware, requireCustomerAuth]
    },
    async (request, reply) => {
      await customerController.me(request, reply)
    }
  )

  // PUT /customers/me - Atualizar perfil (protegido)
  app.put(
    '/customers/me',
    {
      onRequest: [tenantMiddleware, requireCustomerAuth]
    },
    async (request, reply) => {
      await customerController.updateProfile(request, reply)
    }
  )

  // GET /customers/me/addresses - Listar endereços do cliente (protegido)
  app.get(
    '/customers/me/addresses',
    {
      onRequest: [tenantMiddleware, requireCustomerAuth]
    },
    async (request, reply) => {
      await customerController.listAddresses(request, reply)
    }
  )

  // POST /customers/me/addresses - Criar endereço (protegido)
  app.post(
    '/customers/me/addresses',
    {
      onRequest: [tenantMiddleware, requireCustomerAuth]
    },
    async (request, reply) => {
      await customerController.createAddress(request, reply)
    }
  )

  // PUT /customers/me/addresses/:id - Atualizar endereço (protegido)
  app.put(
    '/customers/me/addresses/:id',
    {
      onRequest: [tenantMiddleware, requireCustomerAuth]
    },
    async (request, reply) => {
      await customerController.updateAddress(request, reply)
    }
  )

  // DELETE /customers/me/addresses/:id - Deletar endereço (protegido)
  app.delete(
    '/customers/me/addresses/:id',
    {
      onRequest: [tenantMiddleware, requireCustomerAuth]
    },
    async (request, reply) => {
      await customerController.deleteAddress(request, reply)
    }
  )

  // PATCH /customers/me/addresses/:id/default - Definir endereço como padrão (protegido)
  app.patch(
    '/customers/me/addresses/:id/default',
    {
      onRequest: [tenantMiddleware, requireCustomerAuth]
    },
    async (request, reply) => {
      await customerController.setDefaultAddress(request, reply)
    }
  )

  // PUT /customers/me/password - Alterar senha (protegido)
  app.put(
    '/customers/me/password',
    {
      onRequest: [tenantMiddleware, requireCustomerAuth]
    },
    async (request, reply) => {
      await customerController.updatePassword(request, reply)
    }
  )

  // GET /customers/me/orders - Listar pedidos do cliente (protegido)
  app.get<{
    Querystring: {
      status?: string
      payment_status?: string
    }
  }>(
    '/customers/me/orders',
    {
      onRequest: [tenantMiddleware, requireCustomerAuth]
    },
    async (request, reply) => {
      await customerController.listOrders(request, reply)
    }
  )

  // GET /customers/me/orders/:id - Detalhes do pedido do cliente (protegido)
  app.get<{ Params: { id: string } }>(
    '/customers/me/orders/:id',
    {
      onRequest: [tenantMiddleware, requireCustomerAuth]
    },
    async (request, reply) => {
      await customerController.getOrder(request, reply)
    }
  )

  // Rotas de Favoritos
  const favoriteRepository = new FavoriteRepository()
  const productRepository = new ProductRepository()
  const favoriteController = new FavoriteController(
    favoriteRepository,
    productRepository
  )

  // POST /customers/me/favorites - Adicionar produto aos favoritos
  app.post(
    '/customers/me/favorites',
    {
      onRequest: [tenantMiddleware, requireCustomerAuth]
    },
    async (request, reply) => {
      await favoriteController.add(request, reply)
    }
  )

  // DELETE /customers/me/favorites/:productId - Remover produto dos favoritos
  app.delete<{ Params: { productId: string } }>(
    '/customers/me/favorites/:productId',
    {
      onRequest: [tenantMiddleware, requireCustomerAuth]
    },
    async (request, reply) => {
      await favoriteController.remove(request, reply)
    }
  )

  // GET /customers/me/favorites - Listar favoritos do cliente
  app.get(
    '/customers/me/favorites',
    {
      onRequest: [tenantMiddleware, requireCustomerAuth]
    },
    async (request, reply) => {
      await favoriteController.list(request, reply)
    }
  )

  // GET /customers/me/favorites/:productId/check - Verificar se produto está favoritado
  app.get<{ Params: { productId: string } }>(
    '/customers/me/favorites/:productId/check',
    {
      onRequest: [tenantMiddleware, requireCustomerAuth]
    },
    async (request, reply) => {
      await favoriteController.check(request, reply)
    }
  )
}

