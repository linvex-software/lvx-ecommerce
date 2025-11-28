import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db, schema } from '@white-label/db'
import { eq } from 'drizzle-orm'
import { CartRepository } from '../infra/db/repositories/cart-repository'
import { saveCartUseCase } from '../application/carts/use-cases/save-cart'
import { getCartUseCase } from '../application/carts/use-cases/get-cart'

const API_BASE_URL = process.env.API_URL || 'http://localhost:3333'
const STORE_ID = process.env.TEST_STORE_ID || '190b1fff-9c11-4065-bdf7-ef65f49755a7'
const OTHER_STORE_ID = '00000000-0000-0000-0000-000000000001'

describe('Carts API Tests', () => {
  let testSessionId: string
  let testCartId: string | null = null

  beforeAll(() => {
    testSessionId = `test_session_${Date.now()}_${Math.random().toString(36).substring(7)}`
  })

  afterAll(async () => {
    // Limpar carrinhos de teste
    if (testCartId) {
      try {
        await db.delete(schema.carts).where(eq(schema.carts.id, testCartId))
      } catch {
        // Ignora erros de limpeza
      }
    }
  })

  describe('POST /carts', () => {
    it('should require store-id header', async () => {
      const response = await fetch(`${API_BASE_URL}/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [],
          session_id: testSessionId
        })
      })
      expect([400, 404]).toContain(response.status)
    })

    it('should create a new cart with valid items', async () => {
      const response = await fetch(`${API_BASE_URL}/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          items: [
            {
              product_id: '00000000-0000-0000-0000-000000000010',
              quantity: 2,
              price: 10000 // R$ 100,00 em centavos
            }
          ],
          session_id: testSessionId
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.cart).toBeDefined()
      expect(data.cart.items).toHaveLength(1)
      expect(data.cart.total).toBe('20000.00') // 2 * 10000 (formato numeric do PostgreSQL)
      expect(data.cart.session_id).toBe(testSessionId)
      expect(data.cart.store_id).toBe(STORE_ID)
      testCartId = data.cart.id
    })

    it('should reject cart with invalid item price', async () => {
      const response = await fetch(`${API_BASE_URL}/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          items: [
            {
              product_id: '00000000-0000-0000-0000-000000000010',
              quantity: 1,
              price: -100 // Preço negativo
            }
          ],
          session_id: `test_session_${Date.now()}`
        })
      })

      expect([400, 500]).toContain(response.status)
    })

    it('should reject cart with invalid item quantity', async () => {
      const response = await fetch(`${API_BASE_URL}/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          items: [
            {
              product_id: '00000000-0000-0000-0000-000000000010',
              quantity: 0, // Quantidade inválida
              price: 10000
            }
          ],
          session_id: `test_session_${Date.now()}`
        })
      })

      expect([400, 500]).toContain(response.status)
    })

    it('should update existing cart when cart_id is provided', async () => {
      if (!testCartId) {
        // Pula se não criou carrinho anterior
        return
      }

      const response = await fetch(`${API_BASE_URL}/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          cart_id: testCartId,
          items: [
            {
              product_id: '00000000-0000-0000-0000-000000000011',
              quantity: 3,
              price: 5000
            }
          ],
          session_id: testSessionId
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.cart.id).toBe(testCartId)
      expect(data.cart.items).toHaveLength(1)
      expect(data.cart.total).toBe('15000.00') // 3 * 5000 (formato numeric do PostgreSQL)
    })

    it('should reject cart without session_id or customer_id', async () => {
      const response = await fetch(`${API_BASE_URL}/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          items: [
            {
              product_id: '00000000-0000-0000-0000-000000000010',
              quantity: 1,
              price: 10000
            }
          ]
          // Sem session_id nem customer_id
        })
      })

      expect([400, 500]).toContain(response.status)
    })

    it('should reject empty cart creation', async () => {
      const response = await fetch(`${API_BASE_URL}/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          items: [],
          session_id: `test_session_${Date.now()}`
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Cannot create empty cart')
    })

    it('should allow clearing existing cart (empty items with cart_id)', async () => {
      if (!testCartId) return

      const response = await fetch(`${API_BASE_URL}/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          cart_id: testCartId,
          items: [],
          session_id: testSessionId
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.cart.items).toHaveLength(0)
      expect(data.cart.total).toBe('0.00') // Formato numeric do PostgreSQL
    })
  })

  describe('GET /carts/me', () => {
    it('should require store-id header', async () => {
      const response = await fetch(`${API_BASE_URL}/carts/me?session_id=${testSessionId}`)
      expect([400, 404]).toContain(response.status)
    })

    it('should return 404 when cart does not exist', async () => {
      const response = await fetch(
        `${API_BASE_URL}/carts/me?session_id=nonexistent_session_${Date.now()}`,
        {
          headers: {
            'x-store-id': STORE_ID
          }
        }
      )

      expect(response.status).toBe(404)
    })

    it('should return cart by session_id', async () => {
      const response = await fetch(`${API_BASE_URL}/carts/me?session_id=${testSessionId}`, {
        headers: {
          'x-store-id': STORE_ID
        }
      })

      if (testCartId) {
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.cart).toBeDefined()
        expect(data.cart.id).toBe(testCartId)
        expect(data.cart.store_id).toBe(STORE_ID)
      }
    })

    it('should reject empty session_id', async () => {
      const response = await fetch(`${API_BASE_URL}/carts/me?session_id=`, {
        headers: {
          'x-store-id': STORE_ID
        }
      })

      expect(response.status).toBe(400)
    })

    it('should reject invalid cart_id format', async () => {
      const response = await fetch(`${API_BASE_URL}/carts/me?cart_id=invalid-uuid`, {
        headers: {
          'x-store-id': STORE_ID
        }
      })

      expect(response.status).toBe(400)
    })

    it('should return cart by cart_id', async () => {
      if (!testCartId) return

      const response = await fetch(`${API_BASE_URL}/carts/me?cart_id=${testCartId}`, {
        headers: {
          'x-store-id': STORE_ID
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.cart.id).toBe(testCartId)
    })
  })

  describe('Multi-tenant isolation', () => {
    it('should not return cart from different store', async () => {
      if (!testCartId) return

      // Tentar buscar carrinho de outra loja
      const response = await fetch(`${API_BASE_URL}/carts/me?cart_id=${testCartId}`, {
        headers: {
          'x-store-id': OTHER_STORE_ID
        }
      })

      // Deve retornar 404 (carrinho não existe para essa loja)
      expect(response.status).toBe(404)
    })
  })
})

describe('CartRepository Unit Tests', () => {
  const repository = new CartRepository()
  const testStoreId = STORE_ID
  let testSessionId: string
  let createdCartId: string | null = null

  beforeAll(() => {
    testSessionId = `repo_test_${Date.now()}_${Math.random().toString(36).substring(7)}`
  })

  afterAll(async () => {
    if (createdCartId) {
      try {
        await db.delete(schema.carts).where(eq(schema.carts.id, createdCartId))
      } catch {
        // Ignora
      }
    }
  })

  it('should create cart with valid items', async () => {
    const cart = await repository.create(
      {
        items: [
          {
            product_id: '00000000-0000-0000-0000-000000000010',
            quantity: 2,
            price: 10000
          }
        ],
        session_id: testSessionId
      },
      testStoreId
    )

    expect(cart).toBeDefined()
    expect(cart.items).toHaveLength(1)
    expect(cart.total).toBe('20000.00') // Formato numeric do PostgreSQL
    expect(cart.session_id).toBe(testSessionId)
    expect(cart.store_id).toBe(testStoreId)
    createdCartId = cart.id
  })

  it('should find cart by id', async () => {
    if (!createdCartId) return

    const cart = await repository.findById(createdCartId, testStoreId)
    expect(cart).toBeDefined()
    expect(cart?.id).toBe(createdCartId)
  })

  it('should not find cart from different store', async () => {
    if (!createdCartId) return

    const cart = await repository.findById(createdCartId, OTHER_STORE_ID)
    expect(cart).toBeNull()
  })

  it('should find cart by session_id', async () => {
    const cart = await repository.findBySessionOrCustomer(testStoreId, testSessionId)
    expect(cart).toBeDefined()
    expect(cart?.session_id).toBe(testSessionId)
  })

  it('should update cart', async () => {
    if (!createdCartId) return

    const updated = await repository.update(createdCartId, testStoreId, {
      items: [
        {
          product_id: '00000000-0000-0000-0000-000000000011',
          quantity: 5,
          price: 2000
        }
      ]
    })

    expect(updated.items).toHaveLength(1)
    expect(updated.total).toBe('10000.00') // 5 * 2000 (formato numeric do PostgreSQL)
  })

  it('should throw error on invalid total calculation', async () => {
    await expect(
      repository.create(
        {
          items: [
            {
              product_id: '00000000-0000-0000-0000-000000000010',
              quantity: 1,
              price: -100 // Preço negativo
            }
          ],
          session_id: `test_${Date.now()}`
        },
        testStoreId
      )
    ).rejects.toThrow()
  })
})

describe('Cart Use Cases', () => {
  const repository = new CartRepository()
  const testStoreId = STORE_ID
  let testSessionId: string

  beforeAll(() => {
    testSessionId = `usecase_test_${Date.now()}_${Math.random().toString(36).substring(7)}`
  })

  it('should save cart via use case', async () => {
    const cart = await saveCartUseCase(
      {
        items: [
          {
            product_id: '00000000-0000-0000-0000-000000000010',
            quantity: 1,
            price: 10000
          }
        ],
        session_id: testSessionId
      },
      testStoreId,
      { cartRepository: repository }
    )

    expect(cart).toBeDefined()
    expect(cart.items).toHaveLength(1)
    expect(cart.total).toBe('10000.00') // Formato numeric do PostgreSQL
  })

  it('should reject cart without session_id or customer_id', async () => {
    await expect(
      saveCartUseCase(
        {
          items: [
            {
              product_id: '00000000-0000-0000-0000-000000000010',
              quantity: 1,
              price: 10000
            }
          ]
          // Sem session_id nem customer_id
        },
        testStoreId,
        { cartRepository: repository }
      )
    ).rejects.toThrow('Either session_id or customer_id must be provided')
  })

  it('should get cart via use case', async () => {
    const cart = await getCartUseCase(
      testStoreId,
      testSessionId,
      undefined,
      undefined,
      { cartRepository: repository }
    )

    expect(cart).toBeDefined()
    expect(cart?.session_id).toBe(testSessionId)
  })
})

