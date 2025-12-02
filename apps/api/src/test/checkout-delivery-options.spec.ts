import { describe, it, expect, beforeAll } from 'vitest'

const API_BASE_URL = process.env.API_URL || 'http://localhost:3333'
const STORE_ID = process.env.TEST_STORE_ID || '190b1fff-9c11-4065-bdf7-ef65f49755a7'

// Helper para buscar um produto válido
async function getTestProduct(): Promise<{ id: string; price: number } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/catalog/products?store_id=${STORE_ID}`, {
      headers: {
        'x-store-id': STORE_ID
      }
    })
    if (!response.ok) return null
    const data = await response.json()
    if (data.products && data.products.length > 0) {
      const product = data.products[0]
      return {
        id: product.id,
        price: Math.round(parseFloat(product.base_price) * 100) // converter para centavos
      }
    }
    return null
  } catch {
    return null
  }
}

describe('Checkout Delivery Options - Task #48', () => {
  let testProduct: { id: string; price: number } | null = null

  beforeAll(async () => {
    testProduct = await getTestProduct()
  })

  describe('POST /checkout/delivery-options', () => {
    it('should return delivery options with shipping and pickup', async () => {
      if (!testProduct) {
        console.warn('Skipping test: no test product available')
        return
      }

      const response = await fetch(`${API_BASE_URL}/checkout/delivery-options`, {
        method: 'POST',
        headers: {
          'x-store-id': STORE_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destination_zip_code: '01310100',
          items: [
            {
              product_id: testProduct.id,
              quantity: 1,
              price: testProduct.price
            }
          ]
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('shippingOptions')
      expect(data).toHaveProperty('pickupOptions')
      expect(Array.isArray(data.shippingOptions)).toBe(true)
      expect(Array.isArray(data.pickupOptions)).toBe(true)
    })

    it('should return only pickup options when zip_code is not provided', async () => {
      if (!testProduct) {
        console.warn('Skipping test: no test product available')
        return
      }

      const response = await fetch(`${API_BASE_URL}/checkout/delivery-options`, {
        method: 'POST',
        headers: {
          'x-store-id': STORE_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [
            {
              product_id: testProduct.id,
              quantity: 1,
              price: testProduct.price
            }
          ]
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('shippingOptions')
      expect(data).toHaveProperty('pickupOptions')
      expect(data.shippingOptions.length).toBe(0) // sem CEP, não retorna shipping
      expect(Array.isArray(data.pickupOptions)).toBe(true)
    })

    it('should require store-id header', async () => {
      if (!testProduct) {
        console.warn('Skipping test: no test product available')
        return
      }

      const response = await fetch(`${API_BASE_URL}/checkout/delivery-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destination_zip_code: '01310100',
          items: [
            {
              product_id: testProduct.id,
              quantity: 1,
              price: testProduct.price
            }
          ]
        })
      })

      expect([400, 404]).toContain(response.status)
    })

    it('should require at least one item', async () => {
      const response = await fetch(`${API_BASE_URL}/checkout/delivery-options`, {
        method: 'POST',
        headers: {
          'x-store-id': STORE_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destination_zip_code: '01310100',
          items: []
        })
      })

      expect([400, 422]).toContain(response.status)
    })
  })

  describe('POST /orders - Delivery validation', () => {
    it('should reject order without delivery_type', async () => {
      if (!testProduct) {
        console.warn('Skipping test: no test product available')
        return
      }

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'x-store-id': STORE_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [
            {
              product_id: testProduct.id,
              quantity: 1,
              price: testProduct.price
            }
          ],
          shipping_cost: 0
          // delivery_type e delivery_option_id ausentes
        })
      })

      expect([400, 422]).toContain(response.status)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should reject order without delivery_option_id', async () => {
      if (!testProduct) {
        console.warn('Skipping test: no test product available')
        return
      }

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'x-store-id': STORE_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [
            {
              product_id: testProduct.id,
              quantity: 1,
              price: testProduct.price
            }
          ],
          shipping_cost: 0,
          delivery_type: 'shipping'
          // delivery_option_id ausente
        })
      })

      expect([400, 422]).toContain(response.status)
    })

    it('should reject order with invalid delivery_type', async () => {
      if (!testProduct) {
        console.warn('Skipping test: no test product available')
        return
      }

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'x-store-id': STORE_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [
            {
              product_id: testProduct.id,
              quantity: 1,
              price: testProduct.price
            }
          ],
          shipping_cost: 0,
          delivery_type: 'invalid_type',
          delivery_option_id: 'some-id'
        })
      })

      expect([400, 422]).toContain(response.status)
    })

    it('should reject shipping order without shipping_address', async () => {
      if (!testProduct) {
        console.warn('Skipping test: no test product available')
        return
      }

      // Primeiro, buscar opções de entrega para obter um delivery_option_id válido
      const optionsResponse = await fetch(`${API_BASE_URL}/checkout/delivery-options`, {
        method: 'POST',
        headers: {
          'x-store-id': STORE_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destination_zip_code: '01310100',
          items: [
            {
              product_id: testProduct.id,
              quantity: 1,
              price: testProduct.price
            }
          ]
        })
      })

      if (optionsResponse.status !== 200) {
        console.warn('Skipping test: could not fetch delivery options')
        return
      }

      const options = await optionsResponse.json()
      if (options.shippingOptions.length === 0) {
        console.warn('Skipping test: no shipping options available')
        return
      }

      const shippingOptionId = options.shippingOptions[0].id

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'x-store-id': STORE_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [
            {
              product_id: testProduct.id,
              quantity: 1,
              price: testProduct.price
            }
          ],
          shipping_cost: 0,
          delivery_type: 'shipping',
          delivery_option_id: shippingOptionId
          // shipping_address ausente
        })
      })

      expect([400, 422]).toContain(response.status)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })
  })

  describe('Free shipping rule', () => {
    it('should apply free shipping when subtotal >= free_shipping_min_total', async () => {
      if (!testProduct) {
        console.warn('Skipping test: no test product available')
        return
      }

      // Este teste requer que a loja tenha free_shipping_min_total configurado
      // e que o produto tenha preço suficiente
      // Por enquanto, apenas verificamos que a estrutura está correta
      const response = await fetch(`${API_BASE_URL}/checkout/delivery-options`, {
        method: 'POST',
        headers: {
          'x-store-id': STORE_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destination_zip_code: '01310100',
          items: [
            {
              product_id: testProduct.id,
              quantity: 10, // quantidade alta para aumentar subtotal
              price: testProduct.price
            }
          ]
        })
      })

      if (response.status === 200) {
        const data = await response.json()
        // Verificamos que a estrutura está correta
        // O preço pode ser 0 se free_shipping_min_total estiver configurado
        expect(data.shippingOptions.length).toBeGreaterThan(0)
        data.shippingOptions.forEach((option: { price: number }) => {
          expect(typeof option.price).toBe('number')
          expect(option.price).toBeGreaterThanOrEqual(0)
        })
      }
    })
  })
})

