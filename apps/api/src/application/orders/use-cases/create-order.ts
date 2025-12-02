import { z } from 'zod'
import { OrderRepository } from '../../../infra/db/repositories/order-repository'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { StockMovementRepository } from '../../../infra/db/repositories/stock-movement-repository'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
import { CartRepository } from '../../../infra/db/repositories/cart-repository'
import { validateCouponForCheckoutUseCase } from '../../coupons/use-cases/validate-coupon-for-checkout'
import { createStockMovementUseCase, createStockMovementSchema } from '../../catalog/use-cases/create-stock-movement'
import type { OrderWithItems, CreateOrderInput } from '../../../domain/orders/order-types'

const createOrderSchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        variant_id: z.string().uuid().optional().nullable(),
        quantity: z.number().int().positive(),
        price: z.number().int().positive() // em centavos
      })
    )
    .min(1),
  shipping_cost: z.number().int().nonnegative(), // em centavos
  coupon_code: z.string().optional().nullable(),
  shipping_address: z
    .object({
      zip_code: z.string(),
      street: z.string().optional(),
      number: z.string().optional(),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional()
    })
    .optional()
    .nullable(),
  cart_id: z.string().uuid().optional().nullable()
})

export interface CreateOrderDependencies {
  orderRepository: OrderRepository
  productRepository: ProductRepository
  stockMovementRepository: StockMovementRepository
  couponRepository: CouponRepository
  cartRepository: CartRepository
}

export async function createOrderUseCase(
  input: z.infer<typeof createOrderSchema>,
  storeId: string,
  dependencies: CreateOrderDependencies
): Promise<OrderWithItems> {
  const {
    orderRepository,
    productRepository,
    stockMovementRepository,
    couponRepository,
    cartRepository
  } = dependencies

  // 1. Validar input
  const validated = createOrderSchema.parse(input)

  // 2. Validar produtos existem e calcular subtotal
  let subtotal = 0
  for (const item of validated.items) {
    const product = await productRepository.findById(item.product_id, storeId)
    if (!product) {
      throw new Error(`Product ${item.product_id} not found`)
    }

    // Verificar se produto está ativo
    if (product.status !== 'active') {
      throw new Error(`Product ${product.name} is not active`)
    }

    // Verificar estoque disponível
    const stock = await stockMovementRepository.getProductStock(
      item.product_id,
      storeId,
      item.variant_id ?? null
    )

    if (!stock || stock.current_stock < item.quantity) {
      throw new Error(`Insufficient stock for product ${product.name}`)
    }

    subtotal += item.price * item.quantity
  }

  // 3. Validar e aplicar cupom se fornecido
  let finalTotal = subtotal + validated.shipping_cost
  let couponId: string | null = null

  if (validated.coupon_code) {
    const couponValidation = await validateCouponForCheckoutUseCase(
      {
        storeId,
        code: validated.coupon_code,
        orderTotal: subtotal
      },
      {
        couponRepository
      }
    )

    if (!couponValidation.valid) {
      throw new Error(couponValidation.message || 'Invalid coupon')
    }

    // Buscar cupom para obter ID
    const coupon = await couponRepository.findByCode(storeId, validated.coupon_code)
    if (coupon) {
      couponId = coupon.id
    }

    // Recalcular total com desconto
    finalTotal = (couponValidation.finalPrice ?? subtotal) + validated.shipping_cost
  }

  // 4. Verificar e atualizar carrinho se fornecido
  if (validated.cart_id) {
    const cart = await cartRepository.findById(validated.cart_id, storeId)
    if (!cart) {
      throw new Error('Cart not found')
    }
    if (cart.status !== 'active') {
      throw new Error('Cart is not active')
    }

    // Marcar carrinho como convertido
    await cartRepository.updateStatus(validated.cart_id, storeId, 'converted')
  }

  // 5. Criar pedido
  const order = await orderRepository.create(
    {
      store_id: storeId,
      customer_id: validated.customer_id ?? null,
      total: finalTotal,
      status: 'pending',
      payment_status: 'pending',
      shipping_cost: validated.shipping_cost,
      shipping_address: validated.shipping_address ?? null
    },
    validated.items
  )

  // 6. Criar movimentações de estoque (saída) para cada item
  for (const item of validated.items) {
    await createStockMovementUseCase(
      {
        product_id: item.product_id,
        variant_id: item.variant_id ?? null,
        type: 'OUT',
        origin: 'order',
        quantity: item.quantity,
        reason: `Venda online - Pedido ${order.id}`
      },
      storeId,
      null, // userId = null para vendas online (cliente não é usuário do sistema)
      {
        stockMovementRepository
      }
    )
  }

  // 7. Incrementar contador de uso do cupom se aplicado
  if (couponId) {
    await couponRepository.incrementUsedCount(couponId, storeId)
  }

  // 8. Retornar pedido com itens
  const orderWithItems = await orderRepository.findByIdWithItems(order.id, storeId)
  if (!orderWithItems) {
    throw new Error('Failed to retrieve created order')
  }

  return orderWithItems
}

export { createOrderSchema }

