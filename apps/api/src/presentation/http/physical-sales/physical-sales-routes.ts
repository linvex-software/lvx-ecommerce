import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PhysicalSalesController } from './physical-sales-controller'
import { PhysicalSaleRepository } from '../../../infra/db/repositories/physical-sale-repository'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { StockMovementRepository } from '../../../infra/db/repositories/stock-movement-repository'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
import { PhysicalSalesCartRepository } from '../../../infra/db/repositories/physical-sales-cart-repository'
import { PhysicalSalesCommissionRepository } from '../../../infra/db/repositories/physical-sales-commission-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireAuth, requireRole } from '../../../infra/http/middlewares/auth'

export async function registerPhysicalSalesRoutes(
  app: FastifyInstance
): Promise<void> {
  const physicalSaleRepository = new PhysicalSaleRepository()
  const productRepository = new ProductRepository()
  const stockMovementRepository = new StockMovementRepository()
  const couponRepository = new CouponRepository()
  const physicalSalesCartRepository = new PhysicalSalesCartRepository()
  const physicalSalesCommissionRepository = new PhysicalSalesCommissionRepository()
  const physicalSalesController = new PhysicalSalesController(
    physicalSaleRepository,
    productRepository,
    stockMovementRepository,
    couponRepository,
    physicalSalesCartRepository,
    physicalSalesCommissionRepository
  )

  // POST /physical-sales - Criar venda física
  app.post(
    '/physical-sales',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await physicalSalesController.create(request, reply)
    }
  )

  // GET /physical-sales - Listar vendas físicas com filtros
  app.get<{
    Querystring: {
      start_date?: string
      end_date?: string
      seller_id?: string
      product_id?: string
      page?: string
      limit?: string
    }
  }>(
    '/physical-sales',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          start_date?: string
          end_date?: string
          seller_id?: string
          product_id?: string
          page?: string
          limit?: string
        }
      }>,
      reply: FastifyReply
    ) => {
      await physicalSalesController.list(request, reply)
    }
  )

  // GET /physical-sales/report-by-product - Relatório agrupado por produto
  app.get<{
    Querystring: {
      start_date?: string
      end_date?: string
      seller_id?: string
    }
  }>(
    '/physical-sales/report-by-product',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          start_date?: string
          end_date?: string
          seller_id?: string
        }
      }>,
      reply: FastifyReply
    ) => {
      await physicalSalesController.getReportByProduct(request, reply)
    }
  )

  // POST /physical-sales/cart - Criar carrinho
  app.post(
    '/physical-sales/cart',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await physicalSalesController.createCart(request, reply)
    }
  )

  // POST /physical-sales/cart/:id/abandon - Abandonar carrinho
  app.post<{ Params: { id: string } }>(
    '/physical-sales/cart/:id/abandon',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])],
      schema: {
        body: false // Não espera body
      }
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      await physicalSalesController.abandonCart(request, reply)
    }
  )

  // GET /physical-sales/cart/abandoned - Listar carrinhos abandonados
  app.get(
    '/physical-sales/cart/abandoned',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await physicalSalesController.listAbandonedCarts(request, reply)
    }
  )

  // GET /physical-sales/cart/active - Buscar carrinho ativo do vendedor
  app.get(
    '/physical-sales/cart/active',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await physicalSalesController.getActiveCart(request, reply)
    }
  )

  // GET /physical-sales/cart/:id - Buscar carrinho por ID
  app.get<{ Params: { id: string } }>(
    '/physical-sales/cart/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      await physicalSalesController.getCart(request, reply)
    }
  )

  // POST /physical-sales/cart/add-item - Adicionar item ao carrinho
  app.post(
    '/physical-sales/cart/add-item',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await physicalSalesController.addItemToCart(request, reply)
    }
  )

  // POST /physical-sales/cart/remove-item - Remover item do carrinho
  app.post(
    '/physical-sales/cart/remove-item',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await physicalSalesController.removeItemFromCart(request, reply)
    }
  )

  // PUT /physical-sales/cart/update-quantity - Atualizar quantidade de item
  app.put(
    '/physical-sales/cart/update-quantity',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await physicalSalesController.updateItemQuantity(request, reply)
    }
  )

  // POST /physical-sales/cart/apply-discount - Aplicar desconto
  app.post(
    '/physical-sales/cart/apply-discount',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await physicalSalesController.applyDiscount(request, reply)
    }
  )

  // POST /physical-sales/cart/associate-customer - Associar cliente ao carrinho
  app.post(
    '/physical-sales/cart/associate-customer',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await physicalSalesController.associateCustomer(request, reply)
    }
  )

  // POST /physical-sales/finalize - Finalizar venda PDV
  app.post(
    '/physical-sales/finalize',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await physicalSalesController.finalizeSale(request, reply)
    }
  )

  // POST /physical-sales/generate-payment-link - Gerar link de pagamento
  app.post(
    '/physical-sales/generate-payment-link',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await physicalSalesController.generatePaymentLink(request, reply)
    }
  )

  // GET /physical-sales/order/:orderId/status - Buscar status do pedido
  app.get<{ Params: { orderId: string } }>(
    '/physical-sales/order/:orderId/status',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (
      request: FastifyRequest<{ Params: { orderId: string } }>,
      reply: FastifyReply
    ) => {
      await physicalSalesController.getOrderStatus(request, reply)
    }
  )

  // GET /physical-sales/order/:orderId/receipt - Buscar dados do pedido para recibo
  app.get<{ Params: { orderId: string } }>(
    '/physical-sales/order/:orderId/receipt',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (
      request: FastifyRequest<{ Params: { orderId: string } }>,
      reply: FastifyReply
    ) => {
      await physicalSalesController.getOrderReceipt(request, reply)
    }
  )

  // POST /physical-sales/cart/set-origin - Atualizar origem do carrinho
  app.post(
    '/physical-sales/cart/set-origin',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await physicalSalesController.setCartOrigin(request, reply)
    }
  )

  // POST /physical-sales/cart/set-seller - Atualizar vendedor do carrinho
  app.post(
    '/physical-sales/cart/set-seller',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await physicalSalesController.setCartSeller(request, reply)
    }
  )
}

