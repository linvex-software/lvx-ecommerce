import { z } from 'zod'
import { PhysicalSalesCartRepository } from '../../../infra/db/repositories/physical-sales-cart-repository'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import type { PhysicalSalesCart } from '../../../domain/physical-sales/physical-sales-types'

const addItemToPdvCartSchema = z.object({
  cart_id: z.string().uuid().optional(), // Opcional - será criado se não existir
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional().nullable(),
  quantity: z.number().int().positive(),
  discount: z.number().int().nonnegative().optional().default(0) // desconto no item em centavos
})

export interface AddItemToPdvCartDependencies {
  physicalSalesCartRepository: PhysicalSalesCartRepository
  productRepository: ProductRepository
  couponRepository?: any // Opcional para criar carrinho se necessário
}

export async function addItemToPdvCartUseCase(
  input: z.infer<typeof addItemToPdvCartSchema>,
  storeId: string,
  sellerUserId: string,
  dependencies: AddItemToPdvCartDependencies
): Promise<PhysicalSalesCart> {
  const { physicalSalesCartRepository, productRepository } = dependencies

  const validated = addItemToPdvCartSchema.parse(input)

  // Buscar carrinho
  let cart = validated.cart_id 
    ? await physicalSalesCartRepository.findById(validated.cart_id, storeId)
    : null

  // Se carrinho não existir ou não for do vendedor, criar novo
  if (!cart || cart.seller_user_id !== sellerUserId || cart.status !== 'active') {
    // Criar novo carrinho vazio diretamente no repository
    cart = await physicalSalesCartRepository.create(
      {
        items: [],
        customer_id: null,
        coupon_code: null,
        shipping_address: null,
        origin: null
      },
      storeId,
      sellerUserId
    )
    // Atualizar validated.cart_id para usar o novo carrinho
    validated.cart_id = cart.id
  }

  // Validar produto
  const product = await productRepository.findById(validated.product_id, storeId)
  if (!product) {
    throw new Error('Product not found')
  }

  // Calcular preço do item (usar base_price do produto)
  const itemPrice = Math.round(parseFloat(product.base_price) * 100) // converter para centavos

  // Verificar se item já existe no carrinho
  const existingItemIndex = cart.items.findIndex(
    (item) =>
      item.product_id === validated.product_id &&
      item.variant_id === validated.variant_id
  )

  let updatedItems = [...cart.items]

  if (existingItemIndex >= 0) {
    // Atualizar quantidade do item existente
    updatedItems[existingItemIndex] = {
      ...updatedItems[existingItemIndex],
      quantity: updatedItems[existingItemIndex].quantity + validated.quantity,
      discount: (updatedItems[existingItemIndex].discount ?? 0) + validated.discount
    }
  } else {
    // Adicionar novo item
    updatedItems.push({
      product_id: validated.product_id,
      variant_id: validated.variant_id ?? null,
      quantity: validated.quantity,
      price: itemPrice,
      discount: validated.discount
    })
  }

  // Atualizar carrinho (usar cart.id que pode ter sido criado acima)
  const updatedCart = await physicalSalesCartRepository.update(cart.id, storeId, {
    items: updatedItems
  })

  return updatedCart
}

export { addItemToPdvCartSchema }

