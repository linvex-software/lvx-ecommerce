import type { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import {
  createPhysicalSaleUseCase,
  createPhysicalSaleSchema
} from '../../../application/physical-sales/use-cases/create-physical-sale'
import {
  listPhysicalSalesUseCase,
  listPhysicalSalesSchema
} from '../../../application/physical-sales/use-cases/list-physical-sales'
import {
  getPhysicalSalesReportByProductUseCase,
  getPhysicalSalesReportByProductSchema
} from '../../../application/physical-sales/use-cases/get-physical-sales-report-by-product'
import { PhysicalSaleRepository } from '../../../infra/db/repositories/physical-sale-repository'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { StockMovementRepository } from '../../../infra/db/repositories/stock-movement-repository'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
import { PhysicalSalesCartRepository } from '../../../infra/db/repositories/physical-sales-cart-repository'
import { PhysicalSalesCommissionRepository } from '../../../infra/db/repositories/physical-sales-commission-repository'
import {
  createPhysicalSalesCartUseCase,
  createPhysicalSalesCartSchema
} from '../../../application/physical-sales/use-cases/create-physical-sales-cart'
import { abandonPhysicalSalesCartUseCase } from '../../../application/physical-sales/use-cases/abandon-physical-sales-cart'
import { listAbandonedCartsUseCase } from '../../../application/physical-sales/use-cases/list-abandoned-carts'
import { addItemToPdvCartUseCase, addItemToPdvCartSchema } from '../../../application/physical-sales/use-cases/add-item-to-pdv-cart'
import { removeItemFromPdvCartUseCase, removeItemFromPdvCartSchema } from '../../../application/physical-sales/use-cases/remove-item-from-pdv-cart'
import { updateItemQuantityPdvCartUseCase, updateItemQuantityPdvCartSchema } from '../../../application/physical-sales/use-cases/update-item-quantity-pdv-cart'
import { applyDiscountToPdvCartUseCase, applyDiscountToPdvCartSchema } from '../../../application/physical-sales/use-cases/apply-discount-to-pdv-cart'
import { associateCustomerToPdvCartUseCase, associateCustomerToPdvCartSchema } from '../../../application/physical-sales/use-cases/associate-customer-to-pdv-cart'
import { finalizePdvSaleUseCase, finalizePdvSaleSchema } from '../../../application/physical-sales/use-cases/finalize-pdv-sale'
import { generatePaymentLinkUseCase, generatePaymentLinkSchema } from '../../../application/physical-sales/use-cases/generate-payment-link'
import { setCartOriginUseCase, setCartOriginSchema } from '../../../application/physical-sales/use-cases/set-cart-origin'
import { setCartSellerUseCase, setCartSellerSchema } from '../../../application/physical-sales/use-cases/set-cart-seller'
import { OrderRepository } from '../../../infra/db/repositories/order-repository'
import { PaymentMethodRepository } from '../../../infra/db/repositories/payment-method-repository'
import { CustomerRepository } from '../../../infra/db/repositories/customer-repository'
import { UserRepository } from '../../../infra/db/repositories/user-repository'
import { PaymentGatewayFactory } from '../../../infra/gateways/payment-gateway-factory'

export class PhysicalSalesController {
  constructor(
    private readonly physicalSaleRepository: PhysicalSaleRepository,
    private readonly productRepository: ProductRepository,
    private readonly stockMovementRepository: StockMovementRepository,
    private readonly couponRepository: CouponRepository,
    private readonly physicalSalesCartRepository: PhysicalSalesCartRepository,
    private readonly physicalSalesCommissionRepository: PhysicalSalesCommissionRepository
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = (request.user as { id?: string } | undefined)?.id
      if (!userId) {
        await reply.code(401).send({ error: 'User ID is required' })
        return
      }

      const validated = createPhysicalSaleSchema.parse(request.body)

      const sale = await createPhysicalSaleUseCase(
        validated,
        storeId,
        userId,
        {
          physicalSaleRepository: this.physicalSaleRepository,
          productRepository: this.productRepository,
          stockMovementRepository: this.stockMovementRepository,
          couponRepository: this.couponRepository,
          physicalSalesCartRepository: this.physicalSalesCartRepository,
          physicalSalesCommissionRepository: this.physicalSalesCommissionRepository
        }
      )

      await reply.code(201).send({ sale })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        const statusCode =
          error.message === 'Product not found' ||
          error.message === 'Insufficient stock' ||
          error.message.includes('Total mismatch') ||
          error.message.includes('Cupom')
            ? 400
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async list(
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
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const result = await listPhysicalSalesUseCase(
        storeId,
        {
          ...request.query,
          page: request.query.page ? Number.parseInt(request.query.page, 10) : undefined,
          limit: request.query.limit ? Number.parseInt(request.query.limit, 10) : undefined
        },
        {
          physicalSaleRepository: this.physicalSaleRepository
        }
      )

      await reply.send(result)
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async getReportByProduct(
    request: FastifyRequest<{
      Querystring: {
        start_date?: string
        end_date?: string
        seller_id?: string
      }
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const report = await getPhysicalSalesReportByProductUseCase(
        storeId,
        request.query,
        {
          physicalSaleRepository: this.physicalSaleRepository
        }
      )

      await reply.send({ report })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async createCart(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      console.log('[PhysicalSalesController] 🛒 POST /physical-sales/cart - Iniciando...')
      console.log('[PhysicalSalesController] 📥 Request body:', request.body)
      
      const storeId = request.storeId
      if (!storeId) {
        console.error('[PhysicalSalesController] ❌ Store ID não encontrado')
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = (request.user as { id?: string } | undefined)?.id
      if (!userId) {
        console.error('[PhysicalSalesController] ❌ User ID não encontrado')
        await reply.code(401).send({ error: 'User ID is required' })
        return
      }

      console.log('[PhysicalSalesController] ✅ Validações básicas OK:', { storeId, userId })

      const validated = createPhysicalSalesCartSchema.parse(request.body)
      console.log('[PhysicalSalesController] ✅ Schema validado:', validated)

      const cart = await createPhysicalSalesCartUseCase(
        validated,
        storeId,
        userId,
        {
          physicalSalesCartRepository: this.physicalSalesCartRepository,
          productRepository: this.productRepository,
          couponRepository: this.couponRepository
        }
      )

      console.log('[PhysicalSalesController] ✅ Carrinho criado com sucesso:', cart.id)
      await reply.code(201).send({ cart })
    } catch (error) {
      console.error('[PhysicalSalesController] ❌ ERRO ao criar carrinho:')
      console.error('[PhysicalSalesController] Tipo do erro:', error?.constructor?.name)
      console.error('[PhysicalSalesController] Erro completo:', error)
      
      if (error instanceof ZodError) {
        console.error('[PhysicalSalesController] Erro de validação Zod:', error.errors)
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        console.error('[PhysicalSalesController] Mensagem do erro:', error.message)
        console.error('[PhysicalSalesController] Stack do erro:', error.stack)
        
        // Logar propriedades adicionais se existirem (erros do PostgreSQL)
        if ((error as any).code) {
          console.error('[PhysicalSalesController] PostgreSQL error code:', (error as any).code)
        }
        if ((error as any).detail) {
          console.error('[PhysicalSalesController] PostgreSQL error detail:', (error as any).detail)
        }
        if ((error as any).hint) {
          console.error('[PhysicalSalesController] PostgreSQL error hint:', (error as any).hint)
        }
        if ((error as any).constraint) {
          console.error('[PhysicalSalesController] PostgreSQL constraint:', (error as any).constraint)
        }
        if ((error as any).column) {
          console.error('[PhysicalSalesController] PostgreSQL column:', (error as any).column)
        }
        
        const statusCode =
          error.message.includes('not found') || error.message.includes('Cart must')
            ? 400
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      console.error('[PhysicalSalesController] ❌ Erro desconhecido (não é Error nem ZodError)')
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async abandonCart(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = (request.user as { id?: string } | undefined)?.id
      if (!userId) {
        await reply.code(401).send({ error: 'User ID is required' })
        return
      }

      const { id } = request.params

      await abandonPhysicalSalesCartUseCase(id, storeId, userId, {
        physicalSalesCartRepository: this.physicalSalesCartRepository
      })

      await reply.code(204).send()
      return
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          error.message === 'Cart not found' || error.message.includes('does not belong')
            ? 404
            : error.message.includes('not active')
            ? 400
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async listAbandonedCarts(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = (request.user as { id?: string } | undefined)?.id

      const carts = await listAbandonedCartsUseCase(
        storeId,
        userId ?? undefined,
        {
          physicalSalesCartRepository: this.physicalSalesCartRepository
        }
      )

      await reply.send({ carts })
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async getCart(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = (request.user as { id?: string } | undefined)?.id
      if (!userId) {
        await reply.code(401).send({ error: 'User ID is required' })
        return
      }

      const { id } = request.params

      const cart = await this.physicalSalesCartRepository.findById(id, storeId)
      if (!cart) {
        await reply.code(404).send({ error: 'Cart not found' })
        return
      }

      if (cart.seller_user_id !== userId) {
        await reply.code(403).send({ error: 'Cart does not belong to seller' })
        return
      }

      await reply.send({ cart })
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async getActiveCart(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = (request.user as { id?: string } | undefined)?.id
      if (!userId) {
        await reply.code(401).send({ error: 'User ID is required' })
        return
      }

      // Buscar carrinho ativo do vendedor
      const activeCarts = await this.physicalSalesCartRepository.findBySeller(
        storeId,
        userId,
        'active'
      )

      if (activeCarts.length > 0) {
        // Retornar o mais recente
        await reply.send({ cart: activeCarts[0] })
        return
      }

      // Se não houver carrinho ativo, retornar null (frontend criará se necessário)
      await reply.send({ cart: null })
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async addItemToCart(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = (request.user as { id?: string } | undefined)?.id
      if (!userId) {
        await reply.code(401).send({ error: 'User ID is required' })
        return
      }

      // Se não tiver cart_id no body, buscar carrinho ativo ou criar
      const body = request.body as any
      let cartId = body.cart_id

      if (!cartId) {
        // Buscar carrinho ativo
        const activeCarts = await this.physicalSalesCartRepository.findBySeller(
          storeId,
          userId,
          'active'
        )

        if (activeCarts.length > 0) {
          cartId = activeCarts[0].id
        } else {
          // Criar novo carrinho
          const newCart = await createPhysicalSalesCartUseCase(
            { items: [] },
            storeId,
            userId,
            {
              physicalSalesCartRepository: this.physicalSalesCartRepository,
              productRepository: this.productRepository,
              couponRepository: this.couponRepository
            }
          )
          cartId = newCart.id
        }
      }

      // Validar schema (cart_id pode ser opcional agora)
      const validated = addItemToPdvCartSchema.parse({
        ...body,
        cart_id: cartId
      })

      const cart = await addItemToPdvCartUseCase(validated, storeId, userId, {
        physicalSalesCartRepository: this.physicalSalesCartRepository,
        productRepository: this.productRepository
      })

      await reply.send({ cart })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        const statusCode =
          error.message === 'Cart not found' ||
          error.message === 'Product not found' ||
          error.message.includes('does not belong') ||
          error.message.includes('not active')
            ? 400
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async removeItemFromCart(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = (request.user as { id?: string } | undefined)?.id
      if (!userId) {
        await reply.code(401).send({ error: 'User ID is required' })
        return
      }

      const validated = removeItemFromPdvCartSchema.parse(request.body)

      const cart = await removeItemFromPdvCartUseCase(validated, storeId, userId, {
        physicalSalesCartRepository: this.physicalSalesCartRepository
      })

      await reply.send({ cart })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        const statusCode =
          error.message === 'Cart not found' ||
          error.message === 'Item not found in cart' ||
          error.message.includes('does not belong') ||
          error.message.includes('not active') ||
          error.message.includes('must have at least one item')
            ? 400
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async updateItemQuantity(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = (request.user as { id?: string } | undefined)?.id
      if (!userId) {
        await reply.code(401).send({ error: 'User ID is required' })
        return
      }

      const validated = updateItemQuantityPdvCartSchema.parse(request.body)

      const cart = await updateItemQuantityPdvCartUseCase(validated, storeId, userId, {
        physicalSalesCartRepository: this.physicalSalesCartRepository
      })

      await reply.send({ cart })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        const statusCode =
          error.message === 'Cart not found' ||
          error.message === 'Item not found in cart' ||
          error.message.includes('does not belong') ||
          error.message.includes('not active')
            ? 400
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async applyDiscount(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = (request.user as { id?: string } | undefined)?.id
      if (!userId) {
        await reply.code(401).send({ error: 'User ID is required' })
        return
      }

      const validated = applyDiscountToPdvCartSchema.parse(request.body)

      const cart = await applyDiscountToPdvCartUseCase(validated, storeId, userId, {
        physicalSalesCartRepository: this.physicalSalesCartRepository,
        couponRepository: this.couponRepository
      })

      await reply.send({ cart })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        const statusCode =
          error.message === 'Cart not found' ||
          error.message.includes('does not belong') ||
          error.message.includes('not active') ||
          error.message.includes('Cupom')
            ? 400
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async associateCustomer(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = (request.user as { id?: string } | undefined)?.id
      if (!userId) {
        await reply.code(401).send({ error: 'User ID is required' })
        return
      }

      const validated = associateCustomerToPdvCartSchema.parse(request.body)

      const customerRepository = new CustomerRepository()

      const cart = await associateCustomerToPdvCartUseCase(validated, storeId, userId, {
        physicalSalesCartRepository: this.physicalSalesCartRepository,
        customerRepository
      })

      await reply.send({ cart })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        const statusCode =
          error.message === 'Cart not found' ||
          error.message === 'Customer not found' ||
          error.message.includes('does not belong') ||
          error.message.includes('not active')
            ? 400
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async finalizeSale(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = (request.user as { id?: string } | undefined)?.id
      if (!userId) {
        await reply.code(401).send({ error: 'User ID is required' })
        return
      }

      const validated = finalizePdvSaleSchema.parse(request.body)

      const orderRepository = new OrderRepository()

      const order = await finalizePdvSaleUseCase(validated, storeId, userId, {
        physicalSalesCartRepository: this.physicalSalesCartRepository,
        physicalSaleRepository: this.physicalSaleRepository,
        orderRepository,
        productRepository: this.productRepository,
        stockMovementRepository: this.stockMovementRepository,
        couponRepository: this.couponRepository,
        physicalSalesCommissionRepository: this.physicalSalesCommissionRepository
      })

      await reply.code(201).send({ order })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        const statusCode =
          error.message === 'Cart not found' ||
          error.message === 'Cart is empty' ||
          error.message.includes('does not belong') ||
          error.message.includes('not active') ||
          error.message.includes('not found') ||
          error.message.includes('Insufficient stock')
            ? 400
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async generatePaymentLink(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const validated = generatePaymentLinkSchema.parse(request.body)

      const orderRepository = new OrderRepository()
      const paymentMethodRepository = new PaymentMethodRepository()

      // Buscar método de pagamento ativo
      const paymentMethod = await paymentMethodRepository.findActive(storeId)
      if (!paymentMethod) {
        await reply.code(400).send({
          error: 'No active payment method configured'
        })
        return
      }

      // Criar gateway usando factory
      const paymentGateway = PaymentGatewayFactory.create(paymentMethod)

      const result = await generatePaymentLinkUseCase(validated, storeId, {
        orderRepository,
        paymentMethodRepository,
        paymentGateway
      })

      await reply.send(result)
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        const statusCode =
          error.message === 'Order not found' ||
          error.message === 'Order already paid' ||
          error.message.includes('not configured')
            ? 400
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async getOrderStatus(
    request: FastifyRequest<{ Params: { orderId: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const { orderId } = request.params

      const orderRepository = new OrderRepository()

      const order = await orderRepository.findById(orderId, storeId)
      if (!order) {
        await reply.code(404).send({ error: 'Order not found' })
        return
      }

      // Retornar apenas status do pedido
      await reply.send({
        order_id: order.id,
        status: order.status,
        payment_status: order.payment_status
      })
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = error.message === 'Order not found' ? 404 : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async getOrderReceipt(
    request: FastifyRequest<{ Params: { orderId: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const { orderId } = request.params

      const orderRepository = new OrderRepository()

      const order = await orderRepository.findByIdWithItems(orderId, storeId)
      if (!order) {
        await reply.code(404).send({ error: 'Order not found' })
        return
      }

      // Retornar dados do pedido para gerar recibo no frontend
      await reply.send({ order })
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = error.message === 'Order not found' ? 404 : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async setCartOrigin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = (request.user as { id?: string } | undefined)?.id
      if (!userId) {
        await reply.code(401).send({ error: 'User ID is required' })
        return
      }

      const validated = setCartOriginSchema.parse(request.body)

      const cart = await setCartOriginUseCase(validated, storeId, userId, {
        physicalSalesCartRepository: this.physicalSalesCartRepository
      })

      await reply.send({ cart })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        const statusCode =
          error.message === 'Cart not found' ||
          error.message.includes('does not belong') ||
          error.message.includes('not active')
            ? 400
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async setCartSeller(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = (request.user as { id?: string } | undefined)?.id
      if (!userId) {
        await reply.code(401).send({ error: 'User ID is required' })
        return
      }

      const validated = setCartSellerSchema.parse(request.body)

      const userRepository = new UserRepository()

      const cart = await setCartSellerUseCase(validated, storeId, userId, {
        physicalSalesCartRepository: this.physicalSalesCartRepository,
        userRepository
      })

      await reply.send({ cart })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        const statusCode =
          error.message === 'Cart not found' ||
          error.message === 'Seller not found' ||
          error.message.includes('does not belong') ||
          error.message.includes('not active') ||
          error.message.includes('not a valid seller') ||
          error.message.includes('can change seller')
            ? 400
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }
}

