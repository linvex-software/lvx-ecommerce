import { z } from 'zod'
import { PhysicalSaleRepository } from '../../../infra/db/repositories/physical-sale-repository'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { StockMovementRepository } from '../../../infra/db/repositories/stock-movement-repository'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
import { PhysicalSalesCartRepository } from '../../../infra/db/repositories/physical-sales-cart-repository'
import { PhysicalSalesCommissionRepository } from '../../../infra/db/repositories/physical-sales-commission-repository'
import { validateCouponForCheckoutUseCase } from '../../coupons/use-cases/validate-coupon-for-checkout'
import { calculateShippingUseCase } from './calculate-shipping'
import type {
  PhysicalSaleWithRelations,
  CreatePhysicalSaleInput
} from '../../../domain/physical-sales/physical-sales-types'

const createPhysicalSaleSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  coupon_code: z.string().optional().nullable(),
  variant_id: z.string().uuid().optional().nullable(),
  cart_id: z.string().uuid().optional().nullable(),
  shipping_address: z
    .object({
      zip_code: z.string(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional()
    })
    .optional()
    .nullable(),
  commission_rate: z.number().min(0).max(100).optional().nullable()
})

export interface CreatePhysicalSaleDependencies {
  physicalSaleRepository: PhysicalSaleRepository
  productRepository: ProductRepository
  stockMovementRepository: StockMovementRepository
  couponRepository: CouponRepository
  physicalSalesCartRepository: PhysicalSalesCartRepository
  physicalSalesCommissionRepository: PhysicalSalesCommissionRepository
}

export async function createPhysicalSaleUseCase(
  input: z.infer<typeof createPhysicalSaleSchema>,
  storeId: string,
  sellerUserId: string,
  dependencies: CreatePhysicalSaleDependencies
): Promise<PhysicalSaleWithRelations> {
  const {
    physicalSaleRepository,
    productRepository,
    stockMovementRepository,
    couponRepository,
    physicalSalesCartRepository,
    physicalSalesCommissionRepository
  } = dependencies

  // 1. Validar input
  const validated = createPhysicalSaleSchema.parse(input)

  // 2. Verificar se produto existe e pertence à loja
  const product = await productRepository.findById(validated.product_id, storeId)
  if (!product) {
    throw new Error('Product not found')
  }

  // 3. Verificar estoque disponível
  const stock = await stockMovementRepository.getProductStock(
    validated.product_id,
    storeId,
    validated.variant_id ?? null
  )

  if (!stock || stock.current_stock < validated.quantity) {
    throw new Error('Insufficient stock')
  }

  // 4. Verificar e atualizar carrinho se fornecido
  let cartId: string | null = null
  if (validated.cart_id) {
    const cart = await physicalSalesCartRepository.findById(validated.cart_id, storeId)
    if (!cart) {
      throw new Error('Cart not found')
    }
    if (cart.seller_user_id !== sellerUserId) {
      throw new Error('Cart does not belong to seller')
    }
    if (cart.status !== 'active') {
      throw new Error('Cart is not active')
    }
    cartId = validated.cart_id
  }

  // 5. Calcular subtotal (preço do produto * quantidade)
  // base_price está em formato decimal (ex: "100.00" = R$ 100,00)
  // Precisamos converter para centavos (10000)
  const productPriceInCents = Math.round(parseFloat(product.base_price) * 100)
  const subtotal = productPriceInCents * validated.quantity

  // 6. Calcular frete se endereço fornecido
  let shippingCost = 0
  if (validated.shipping_address) {
    const shippingResult = await calculateShippingUseCase(
      {
        zip_code: validated.shipping_address.zip_code,
        weight: 1 // TODO: calcular peso real do produto
      },
      storeId,
      {}
    )
    shippingCost = shippingResult.cost
  }

  // 7. Validar e aplicar cupom se fornecido
  let discount = 0
  let couponId: string | null = null
  let finalTotal = subtotal + shippingCost

  if (validated.coupon_code) {
    const couponValidation = await validateCouponForCheckoutUseCase(
      {
        storeId,
        code: validated.coupon_code,
        orderTotal: subtotal
      },
      { couponRepository }
    )

    if (!couponValidation.valid) {
      throw new Error(couponValidation.message)
    }

    discount = couponValidation.discountValue ?? 0
    finalTotal = (couponValidation.finalPrice ?? subtotal) + shippingCost

    // Buscar cupom para pegar ID
    const coupon = await couponRepository.findByCode(storeId, validated.coupon_code)
    if (coupon) {
      couponId = coupon.id
      await couponRepository.incrementUsedCount(coupon.id, storeId)
    }
  }

  // 8. Validar que o total enviado corresponde ao calculado (com tolerância de 1 centavo para arredondamentos)
  // Se total for 0, usar o calculado (permite que o backend calcule)
  const saleTotal = validated.total === 0 ? finalTotal : validated.total

  if (validated.total !== 0 && Math.abs(validated.total - finalTotal) > 1) {
    throw new Error(`Total mismatch. Expected ${finalTotal}, got ${validated.total}`)
  }

  // 9. Calcular comissão se rate fornecido
  let commissionAmount: number | null = null
  if (validated.commission_rate !== null && validated.commission_rate !== undefined) {
    commissionAmount = Math.round(saleTotal * (validated.commission_rate / 100))
  }

  // 10. Criar registro de venda física
  const sale = await physicalSaleRepository.create(
    {
      product_id: validated.product_id,
      quantity: validated.quantity,
      total: saleTotal,
      coupon_code: validated.coupon_code ?? null,
      variant_id: validated.variant_id ?? null,
      coupon_id: couponId,
      shipping_cost: shippingCost,
      commission_amount: commissionAmount,
      cart_id: cartId,
      status: 'completed'
    },
    storeId,
    sellerUserId
  )

  // 11. Criar movimento de estoque (saída)
  await stockMovementRepository.create({
    store_id: storeId,
    product_id: validated.product_id,
    variant_id: validated.variant_id ?? null,
    type: 'OUT',
    origin: 'physical_sale',
    quantity: validated.quantity,
    reason: `Venda física - Vendedor: ${sellerUserId}`,
    created_by: sellerUserId
  })

  // 12. Criar registro de comissão se aplicável
  if (commissionAmount !== null && commissionAmount > 0) {
    await physicalSalesCommissionRepository.create({
      store_id: storeId,
      physical_sale_id: sale.id,
      seller_user_id: sellerUserId,
      commission_amount: commissionAmount,
      commission_rate: validated.commission_rate ?? null
    })
  }

  // 13. Marcar carrinho como convertido se aplicável
  if (cartId) {
    await physicalSalesCartRepository.updateStatus(cartId, storeId, 'converted')
  }

  // 14. Buscar venda com relações para retornar
  const saleWithRelations = await physicalSaleRepository.findByIdWithRelations(
    sale.id,
    storeId,
    true // incluir comissão
  )

  if (!saleWithRelations) {
    throw new Error('Failed to retrieve created sale')
  }

  // Adicionar informações de desconto e subtotal na resposta
  return {
    ...saleWithRelations,
    subtotal_calculated: subtotal,
    discount,
    shipping_cost_amount: shippingCost
  }
}

export { createPhysicalSaleSchema }

