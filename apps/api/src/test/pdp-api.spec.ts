import { describe, it, expect, beforeAll } from 'vitest'

const API_BASE_URL = process.env.API_URL || 'http://localhost:3333'
const STORE_ID = '190b1fff-9c11-4065-bdf7-ef65f49755a7'

describe('PDP API Tests', () => {
  describe('2.1 Health', () => {
    it('should return 200 for GET /health', async () => {
      const response = await fetch(`${API_BASE_URL}/health`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.ok).toBe(true)
    })
  })

  describe('2.2 Listagem', () => {
    it('should return products list with store-id header', async () => {
      const response = await fetch(`${API_BASE_URL}/products`, {
        headers: {
          'x-store-id': STORE_ID
        }
      })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.products).toBeDefined()
      expect(Array.isArray(data.products)).toBe(true)
      expect(data.total).toBeGreaterThanOrEqual(0)
    })

    it('should not return "Store not found" error', async () => {
      const response = await fetch(`${API_BASE_URL}/products`, {
        headers: {
          'x-store-id': STORE_ID
        }
      })
      expect(response.status).not.toBe(404)
      const data = await response.json()
      expect(data.error).not.toBe('Store not found')
    })
  })

  describe('2.3 PDP - Produto ESGOTADO', () => {
    it('should return product with stock.current_stock === 0', async () => {
      const response = await fetch(`${API_BASE_URL}/products/oculos-de-sol-aviador`, {
        headers: {
          'x-store-id': STORE_ID
        }
      })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.product).toBeDefined()
      expect(data.product.stock).toBeDefined()
      expect(data.product.stock.current_stock).toBe(0)
      expect(data.product.name).toBeDefined()
      expect(data.product.slug).toBe('oculos-de-sol-aviador')
      expect(data.product.base_price).toBeDefined()
      expect(data.product.images).toBeDefined()
    })
  })

  describe('2.4 PDP - Produto COM estoque', () => {
    it('should return product with stock.current_stock > 0', async () => {
      const response = await fetch(`${API_BASE_URL}/products/tenis-urbano-minimalista`, {
        headers: {
          'x-store-id': STORE_ID
        }
      })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.product).toBeDefined()
      expect(data.product.stock).toBeDefined()
      expect(data.product.stock.current_stock).toBeGreaterThan(0)
      expect(data.product.name).toBeDefined()
      expect(data.product.slug).toBe('tenis-urbano-minimalista')
      expect(data.product.base_price).toBeDefined()
      expect(data.product.images).toBeDefined()
    })
  })

  describe('2.5 404', () => {
    it('should return 404 for non-existent slug', async () => {
      const response = await fetch(`${API_BASE_URL}/products/slug-que-nao-existe-123`, {
        headers: {
          'x-store-id': STORE_ID
        }
      })
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBeDefined()
      // Não deve ter stack trace
      expect(JSON.stringify(data)).not.toContain('at ')
      expect(JSON.stringify(data)).not.toContain('Error:')
    })
  })

  describe('2.6 Relacionados', () => {
    it('should return related products by category', async () => {
      // Primeiro, buscar um produto para pegar sua categoria
      const productResponse = await fetch(`${API_BASE_URL}/products/oculos-de-sol-aviador`, {
        headers: {
          'x-store-id': STORE_ID
        }
      })
      const productData = await productResponse.json()
      const categoryId = productData.product.categories?.[0]?.id

      if (categoryId) {
        const response = await fetch(`${API_BASE_URL}/products?category_id=${categoryId}&limit=4`, {
          headers: {
            'x-store-id': STORE_ID
          }
        })
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.products).toBeDefined()
        expect(Array.isArray(data.products)).toBe(true)
        expect(data.total).toBeGreaterThanOrEqual(0)
      } else {
        // Se não houver categoria, testar sem category_id
        const response = await fetch(`${API_BASE_URL}/products?limit=4`, {
          headers: {
            'x-store-id': STORE_ID
          }
        })
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.products).toBeDefined()
        expect(Array.isArray(data.products)).toBe(true)
      }
    })
  })
})

