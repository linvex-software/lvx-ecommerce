import { z } from 'zod'
import { PhysicalSalesCartRepository } from '../../../infra/db/repositories/physical-sales-cart-repository'
import { PhysicalSaleRepository } from '../../../infra/db/repositories/physical-sale-repository'
import { OrderRepository } from '../../../infra/db/repositories/order-repository'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { StockMovementRepository } from '../../../infra/db/repositories/stock-movement-repository'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
import { PhysicalSalesCommissionRepository } from '../../../infra/db/repositories/physical-sales-commission-repository'
import type { OrderWithItems } from '../../../domain/orders/order-types'

const finalizePdvSaleSchema = z.object({
  cart_id: z.string().uuid(),
  origin: z.string().optional().default('pdv'), // origem da venda
  payment_method: z.enum(['pix', 'credit_card', 'debit_card', 'cash', 'other']).optional(),
  // commission_rate removido - será calculado pelo backend baseado em regras de negócio
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
    .nullable()
})

export interface FinalizePdvSaleDependencies {
  physicalSalesCartRepository: PhysicalSalesCartRepository
  physicalSaleRepository: PhysicalSaleRepository
  orderRepository: OrderRepository
  productRepository: ProductRepository
  stockMovementRepository: StockMovementRepository
  couponRepository: CouponRepository
  physicalSalesCommissionRepository: PhysicalSalesCommissionRepository
}

export async function finalizePdvSaleUseCase(
  input: z.infer<typeof finalizePdvSaleSchema>,
  storeId: string,
  sellerUserId: string,
  dependencies: FinalizePdvSaleDependencies
): Promise<OrderWithItems> {
  const {
    physicalSalesCartRepository,
    physicalSaleRepository,
    orderRepository,
    productRepository,
    stockMovementRepository,
    couponRepository
  } = dependencies

  const validated = finalizePdvSaleSchema.parse(input)

  // Buscar carrinho
  const cart = await physicalSalesCartRepository.findById(validated.cart_id, storeId)
  if (!cart) {
    throw new Error('Cart not found')
  }

  if (!cart.seller_user_id) {
    throw new Error('Seller is required. Please select a seller before finalizing the sale.')
  }

  if (cart.seller_user_id !== sellerUserId) {
    throw new Error('Cart does not belong to seller')
  }

  if (cart.status !== 'active') {
    throw new Error('Cart is not active')
  }

  if (cart.items.length === 0) {
    throw new Error('Cart is empty')
  }

  // Validar produtos e estoque
  for (const item of cart.items) {
    const product = await productRepository.findById(item.product_id, storeId)
    if (!product) {
      throw new Error(`Product ${item.product_id} not found`)
    }

    const stock = await stockMovementRepository.getProductStock(
      item.product_id,
      storeId,
      item.variant_id ?? null
    )

    if (!stock || stock.current_stock < item.quantity) {
      throw new Error(`Insufficient stock for product ${product.name}`)
    }
  }

  // Calcular totais
  const subtotal = cart.items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity
    const itemDiscount = item.discount ?? 0
    return sum + itemTotal - itemDiscount
  }, 0)

  const discountAmount = parseFloat(cart.discount_amount) || 0
  const shippingCost = 0 // PDV geralmente não tem frete
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingCost)

  // Buscar cupom se houver
  let couponId: string | null = null
  if (cart.coupon_code) {
    const coupon = await couponRepository.findByCode(storeId, cart.coupon_code)
    if (coupon) {
      couponId = coupon.id
      await couponRepository.incrementUsedCount(coupon.id, storeId)
    }
  }

  // Preparar shipping_address com metadados do PDV (origem, vendedor, método de pagamento)
  // Comissão será calculada pelo backend baseado em regras de negócio (não vem do frontend)
  // Se houver endereço de entrega, incluir também; senão, usar apenas para metadados
  const shippingAddressWithMetadata = validated.shipping_address
    ? {
        ...validated.shipping_address,
        _pdv_metadata: {
          origin: validated.origin || cart.origin || 'pdv',
          seller_user_id: sellerUserId,
          payment_method: validated.payment_method || 'cash'
          // commission_rate será calculado pelo backend se houver regra configurada
        }
      }
    : {
        _pdv_metadata: {
          origin: validated.origin || cart.origin || 'pdv',
          seller_user_id: sellerUserId,
          payment_method: validated.payment_method || 'cash'
          // commission_rate será calculado pelo backend se houver regra configurada
        }
      }

  // Criar pedido diretamente usando repository
  // PDV físico: pagamento é registrado imediatamente, então payment_status = 'paid'
  const order = await orderRepository.createWithStockMovements(
    {
      store_id: storeId,
      customer_id: cart.customer_id,
      total: finalTotal,
      status: 'completed', // PDV físico: venda concluída imediatamente
      payment_status: 'paid', // PDV físico: pagamento registrado imediatamente
      shipping_cost: shippingCost,
      delivery_type: null, // PDV geralmente não tem entrega
      delivery_option_id: null,
      shipping_address: shippingAddressWithMetadata
    },
    cart.items.map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      quantity: item.quantity,
      price: item.price
    })),
    cart.items.map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      quantity: item.quantity,
      reason: `Venda PDV`
    })),
    {
      cart_id: cart.id,
      coupon_id: couponId
    }
  )

  // Criar registros em physical_sales (um por produto)
  // Isso é importante para que as vendas apareçam na tela de "Vendas Físicas"
  
  // Calcular o desconto proporcional de cada item
  const totalItemsValue = cart.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity)
  }, 0)
  
  const cartDiscountAmount = parseFloat(cart.discount_amount) || 0
  
  for (const item of cart.items) {
    const itemSubtotal = item.price * item.quantity
    
    // Desconto do item + proporcional do desconto do carrinho
    let itemDiscount = item.discount ?? 0
    
    // Se há desconto no carrinho (cupom ou desconto manual), distribuir proporcionalmente
    if (cartDiscountAmount > 0 && totalItemsValue > 0) {
      const itemProportion = itemSubtotal / totalItemsValue
      itemDiscount += Math.round(cartDiscountAmount * itemProportion)
    }
    
    const itemFinalTotal = itemSubtotal - itemDiscount

    await physicalSaleRepository.create(
      {
        product_id: item.product_id,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        discount_amount: itemDiscount,
        total: itemFinalTotal,
        coupon_id: couponId,
        shipping_cost: 0,
        commission_amount: null, // Pode ser calculado depois se houver regra
        cart_id: cart.id,
        status: 'completed'
      },
      storeId,
      sellerUserId
    )
  }

  // Atualizar carrinho para "converted"
  await physicalSalesCartRepository.updateStatus(cart.id, storeId, 'converted')

  // Buscar pedido completo com itens
  const orderWithItems = await orderRepository.findByIdWithItems(order.id, storeId)
  if (!orderWithItems) {
    throw new Error('Failed to retrieve created order')
  }

  return orderWithItems
}

export { finalizePdvSaleSchema }

