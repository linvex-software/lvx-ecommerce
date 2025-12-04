import { z } from 'zod'
import { OrderRepository } from '../../../infra/db/repositories/order-repository'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { StockMovementRepository } from '../../../infra/db/repositories/stock-movement-repository'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
import { CartRepository } from '../../../infra/db/repositories/cart-repository'
import { PickupPointRepository } from '../../../infra/db/repositories/pickup-point-repository'
import { validateCouponForCheckoutUseCase } from '../../coupons/use-cases/validate-coupon-for-checkout'
import { createStockMovementUseCase } from '../../catalog/use-cases/create-stock-movement'
import { getDeliveryOptionsUseCase } from '../../checkout/use-cases/get-delivery-options'
import type { OrderWithItems } from '../../../domain/orders/order-types'
import type { ShippingGateway } from '../../../domain/shipping/gateways'

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
  shipping_cost: z.number().int().nonnegative(), // em centavos (será calculado pelo backend)
  delivery_type: z.enum(['shipping', 'pickup_point']), // obrigatório
  delivery_option_id: z.string(), // ID da opção escolhida (quote.id ou pickup_point.id)
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
  pickupPointRepository: PickupPointRepository
  shippingGateway: ShippingGateway
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
    cartRepository,
    pickupPointRepository,
    shippingGateway
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

  // 3. Validar deliveryType e deliveryOptionId e calcular shipping_cost
  let shippingCost = 0
  const deliveryType: 'shipping' | 'pickup_point' = validated.delivery_type
  const deliveryOptionId: string = validated.delivery_option_id

  if (validated.delivery_type === 'pickup_point') {
    // Validar se pickup_point existe e está ativo
    const pickupPoint = await pickupPointRepository.findById(
      validated.delivery_option_id,
      storeId
    )
    if (!pickupPoint) {
      throw new Error('Pickup point not found or does not belong to this store')
    }
    if (!pickupPoint.is_active) {
      throw new Error('Pickup point is not active')
    }
    shippingCost = 0 // retirada sempre grátis
  } else if (validated.delivery_type === 'shipping') {
    // Validar se shipping option existe e recalcular preço
    if (!validated.shipping_address?.zip_code) {
      throw new Error('Shipping address with zip_code is required for shipping delivery')
    }

    // Buscar opções de entrega para validar e recalcular preço
    const deliveryOptions = await getDeliveryOptionsUseCase(
      {
        destination_zip_code: validated.shipping_address.zip_code,
        items: validated.items
      },
      storeId,
      {
        shippingGateway,
        pickupPointRepository
      }
    )

    // Encontrar a opção de frete escolhida
    const selectedShipping = deliveryOptions.shippingOptions.find(
      (opt) => opt.id === validated.delivery_option_id
    )

    if (!selectedShipping) {
      throw new Error('Invalid shipping option selected')
    }

    shippingCost = selectedShipping.price // já está em centavos e com frete grátis aplicado se necessário
  } else {
    throw new Error('Invalid delivery_type')
  }

  // 4. Validar e aplicar cupom se fornecido
  let finalTotal = subtotal + shippingCost
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
    finalTotal = (couponValidation.finalPrice ?? subtotal) + shippingCost
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
      shipping_cost: shippingCost,
      delivery_type: deliveryType,
      delivery_option_id: deliveryOptionId,
      shipping_address: validated.shipping_address ?? null
    },
    validated.items.map(item => ({
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      quantity: item.quantity,
      price: item.price
    }))
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

