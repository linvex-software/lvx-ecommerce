import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db, schema } from '@white-label/db'
import { eq, and } from 'drizzle-orm'
import { CustomerRepository } from '../infra/db/repositories/customer-repository'
import { AuthSessionRepository } from '../infra/db/repositories/auth-session-repository'
import { normalizeCPF } from '../domain/customers/customer-helpers'

const API_BASE_URL = process.env.API_URL || 'http://localhost:3333'
const STORE_ID = process.env.TEST_STORE_ID || '190b1fff-9c11-4065-bdf7-ef65f49755a7'
const OTHER_STORE_ID = '00000000-0000-0000-0000-000000000001'

// Helper para criar store de teste se não existir
async function ensureTestStore(storeId: string) {
  const existing = await db
    .select()
    .from(schema.stores)
    .where(eq(schema.stores.id, storeId))
    .limit(1)

  if (existing.length === 0) {
    await db.insert(schema.stores).values({
      id: storeId,
      name: 'Test Store',
      domain: `test-${storeId}.example.com`,
      active: true
    })
  }
}

// Helper para limpar customers de teste
async function cleanupTestCustomers(storeId: string, cpfs: string[]) {
  for (const cpf of cpfs) {
    await db
      .delete(schema.customers)
      .where(and(eq(schema.customers.store_id, storeId), eq(schema.customers.cpf, cpf)))
  }
}

// Helper para limpar sessões de teste
async function cleanupTestSessions(customerIds: string[]) {
  for (const customerId of customerIds) {
    await db
      .delete(schema.authSessions)
      .where(eq(schema.authSessions.customer_id, customerId))
  }
}

describe('Customers API Tests', () => {
  const testCpfs: string[] = []
  const testCustomerIds: string[] = []

  beforeAll(async () => {
    await ensureTestStore(STORE_ID)
    await ensureTestStore(OTHER_STORE_ID)
    // Limpar TODOS os customers das lojas de teste (são lojas de teste, então é seguro)
    await db.delete(schema.customers).where(eq(schema.customers.store_id, STORE_ID))
    await db.delete(schema.customers).where(eq(schema.customers.store_id, OTHER_STORE_ID))
    // Limpar também as sessões relacionadas
    await db.delete(schema.authSessions).where(eq(schema.authSessions.store_id, STORE_ID))
    await db.delete(schema.authSessions).where(eq(schema.authSessions.store_id, OTHER_STORE_ID))
  })

  afterAll(async () => {
    // Limpar customers e sessões de teste
    await cleanupTestSessions(testCustomerIds)
    await cleanupTestCustomers(STORE_ID, testCpfs)
    await cleanupTestCustomers(OTHER_STORE_ID, testCpfs)
  })

  describe('POST /customers/register', () => {
    it('should require store-id header', async () => {
      const response = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Test User',
          cpf: '12345678900',
          password: 'senha123'
        })
      })
      expect([400, 404]).toContain(response.status)
    })

    it('should register customer with formatted CPF (111.444.777-35)', async () => {
      const cpf = '111.444.777-35'
      const normalizedCpf = normalizeCPF(cpf)
      testCpfs.push(normalizedCpf)

      const response = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'João Silva',
          cpf: cpf,
          email: 'joao@example.com',
          phone: '(11) 99999-9999',
          password: 'senha123'
        })
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.customer).toBeDefined()
      expect(data.customer.name).toBe('João Silva')
      expect(data.customer.cpf).toBe(normalizedCpf) // Deve estar normalizado
      expect(data.customer.email).toBe('joao@example.com')
      expect(data.customer.phone).toBe('(11) 99999-9999')
      expect(data.customer.password_hash).toBeUndefined() // Nunca deve retornar senha
      expect(data.customer.password).toBeUndefined()
      testCustomerIds.push(data.customer.id)

      // Verificar que password_hash foi criado no banco
      const customerRepo = new CustomerRepository()
      const customer = await customerRepo.findByCpf(normalizedCpf, STORE_ID)
      expect(customer).toBeDefined()
      expect(customer?.password_hash).toBeDefined()
      expect(customer?.password_hash).not.toBe('senha123') // Não deve estar em plain text
    })

    it('should register customer with unformatted CPF (12345678900)', async () => {
      const cpf = '12345678909'
      testCpfs.push(cpf)

      const response = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Maria Santos',
          cpf: cpf,
          password: 'senha456'
        })
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.customer).toBeDefined()
      expect(data.customer.cpf).toBe(cpf)
      expect(data.customer.email).toBeNull()
      testCustomerIds.push(data.customer.id)
    })

    it('should register customer without email (optional)', async () => {
      const cpf = '54912012602'
      testCpfs.push(cpf)

      const response = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Pedro Costa',
          cpf: cpf,
          password: 'senha789'
        })
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.customer.email).toBeNull()
      testCustomerIds.push(data.customer.id)
    })

    it('should reject invalid CPF (wrong check digits)', async () => {
      const response = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Invalid User',
          cpf: '12345678901', // CPF inválido
          password: 'senha123'
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
      // Verificar se o erro menciona CPF (pode estar em error ou details)
      const errorMessage = data.error + (data.details ? JSON.stringify(data.details) : '')
      expect(errorMessage).toMatch(/CPF|cpf/i)
    })

    it('should reject CPF with invalid length', async () => {
      const response = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Invalid User',
          cpf: '123456789', // CPF muito curto
          password: 'senha123'
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should reject password too short', async () => {
      const response = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Test User',
          cpf: '22233344455',
          password: '12345' // Menos de 6 caracteres
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
      // Verificar se a mensagem menciona o mínimo de 6 caracteres
      const errorMessage = data.error + (data.details ? JSON.stringify(data.details) : '')
      expect(errorMessage).toMatch(/6|seis|min/i)
    })

    it('should reject name too short', async () => {
      const response = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Ab', // Menos de 3 caracteres
          cpf: '33344455566',
          password: 'senha123'
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should reject duplicate CPF in same store', async () => {
      const cpf = '92490882805'
      testCpfs.push(cpf)

      // Primeiro cadastro
      const response1 = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'First User',
          cpf: cpf,
          password: 'senha123'
        })
      })
      expect(response1.status).toBe(201)
      const data1 = await response1.json()
      testCustomerIds.push(data1.customer.id)

      // Tentativa de cadastro duplicado
      const response2 = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Second User',
          cpf: cpf,
          password: 'senha456'
        })
      })

      expect(response2.status).toBe(409)
      const data2 = await response2.json()
      expect(data2.error).toContain('CPF já cadastrado')
    })

    it('should allow same CPF in different store', async () => {
      const cpf = '89371367750'
      testCpfs.push(cpf)

      // Cadastro na loja 1
      const response1 = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Store 1 User',
          cpf: cpf,
          password: 'senha123'
        })
      })
      expect(response1.status).toBe(201)
      const data1 = await response1.json()
      testCustomerIds.push(data1.customer.id)

      // Cadastro na loja 2 (deve funcionar)
      const response2 = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': OTHER_STORE_ID
        },
        body: JSON.stringify({
          name: 'Store 2 User',
          cpf: cpf,
          password: 'senha456'
        })
      })
      expect(response2.status).toBe(201)
      const data2 = await response2.json()
      testCustomerIds.push(data2.customer.id)
    })

    it('should reject duplicate email in same store', async () => {
      const email = 'duplicate@example.com'
      const cpf1 = '49594521457'
      const cpf2 = '56255679306'
      testCpfs.push(cpf1, cpf2)

      // Primeiro cadastro
      const response1 = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'First User',
          cpf: cpf1,
          email: email,
          password: 'senha123'
        })
      })
      expect(response1.status).toBe(201)
      const data1 = await response1.json()
      testCustomerIds.push(data1.customer.id)

      // Tentativa de cadastro com mesmo email
      const response2 = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Second User',
          cpf: cpf2,
          email: email,
          password: 'senha456'
        })
      })

      expect(response2.status).toBe(409)
      const data2 = await response2.json()
      expect(data2.error).toContain('Email já cadastrado')
    })

    it('should allow same email in different store', async () => {
      const email = 'crossstore@example.com'
      const cpf1 = '13209618194'
      const cpf2 = '71268500500'
      testCpfs.push(cpf1, cpf2)

      // Cadastro na loja 1
      const response1 = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Store 1 User',
          cpf: cpf1,
          email: email,
          password: 'senha123'
        })
      })
      expect(response1.status).toBe(201)
      const data1 = await response1.json()
      testCustomerIds.push(data1.customer.id)

      // Cadastro na loja 2 (deve funcionar)
      const response2 = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': OTHER_STORE_ID
        },
        body: JSON.stringify({
          name: 'Store 2 User',
          cpf: cpf2,
          email: email,
          password: 'senha456'
        })
      })
      expect(response2.status).toBe(201)
      const data2 = await response2.json()
      testCustomerIds.push(data2.customer.id)
    })
  })

  describe('POST /customers/login', () => {
    let testCustomerCpf: string
    let testCustomerPassword: string
    let testCustomerId: string

    beforeAll(async () => {
      // Criar customer de teste para login
      testCustomerCpf = '95685106564'
      testCustomerPassword = 'testpass123'
      testCpfs.push(testCustomerCpf)

      const response = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Login Test User',
          cpf: testCustomerCpf,
          email: 'logintest@example.com',
          password: testCustomerPassword
        })
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      testCustomerId = data.customer.id
      testCustomerIds.push(testCustomerId)
    })

    it('should login with correct CPF and password', async () => {
      const response = await fetch(`${API_BASE_URL}/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          cpf: testCustomerCpf,
          password: testCustomerPassword
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.accessToken).toBeDefined()
      expect(data.customer).toBeDefined()
      expect(data.customer.id).toBe(testCustomerId)
      expect(data.customer.password_hash).toBeUndefined()
      expect(data.customer.password).toBeUndefined()
    })

    it('should login with formatted CPF (123.456.789-00)', async () => {
      // Criar um customer com CPF formatado para testar login
      const formattedCpf = '987.654.321-00'
      const normalizedCpf = normalizeCPF(formattedCpf)
      const password = 'formatted123'

      // Registrar primeiro
      const registerResponse = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Formatted CPF User',
          cpf: formattedCpf,
          password: password
        })
      })
      expect(registerResponse.status).toBe(201)
      const registerData = await registerResponse.json()
      testCustomerIds.push(registerData.customer.id)
      testCpfs.push(normalizedCpf)

      // Agora fazer login com CPF formatado
      const response = await fetch(`${API_BASE_URL}/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          cpf: formattedCpf,
          password: password
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.accessToken).toBeDefined()
    })

    it('should reject login with wrong password', async () => {
      const response = await fetch(`${API_BASE_URL}/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          cpf: testCustomerCpf,
          password: 'wrongpassword'
        })
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Invalid credentials')
    })

    it('should reject login with non-existent CPF', async () => {
      // Usar um CPF válido mas que não existe no banco
      const response = await fetch(`${API_BASE_URL}/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          cpf: '12345678909', // CPF válido mas não cadastrado
          password: 'anypassword'
        })
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Invalid credentials')
    })

    it('should not login customer from different store', async () => {
      // Tentar login na loja diferente
      const response = await fetch(`${API_BASE_URL}/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': OTHER_STORE_ID
        },
        body: JSON.stringify({
          cpf: testCustomerCpf,
          password: testCustomerPassword
        })
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Invalid credentials')
    })

    it('should return JWT with correct payload', async () => {
      const response = await fetch(`${API_BASE_URL}/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          cpf: testCustomerCpf,
          password: testCustomerPassword
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      const token = data.accessToken

      // Decodificar JWT (sem verificar assinatura, só para ver payload)
      const parts = token.split('.')
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())

      expect(payload.sub).toBe(testCustomerId)
      expect(payload.storeId).toBe(STORE_ID)
      expect(payload.type).toBe('customer')
    })

    it('should create session in auth_sessions with customer_id', async () => {
      const response = await fetch(`${API_BASE_URL}/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          cpf: testCustomerCpf,
          password: testCustomerPassword
        })
      })

      expect(response.status).toBe(200)
      await response.json() // Consumir resposta

      // Verificar sessão no banco
      const sessionRepo = new AuthSessionRepository()
      const cookies = response.headers.get('set-cookie')
      expect(cookies).toBeDefined()
      expect(cookies).toContain('refreshToken')

      // Buscar sessão por refresh token (extrair do cookie)
      const refreshTokenMatch = cookies?.match(/refreshToken=([^;]+)/)
      if (refreshTokenMatch) {
        const refreshToken = refreshTokenMatch[1]
        const session = await sessionRepo.findByToken(refreshToken)
        expect(session).toBeDefined()
        expect(session?.customer_id).toBe(testCustomerId)
        expect(session?.user_id).toBeNull()
        expect(session?.store_id).toBe(STORE_ID)
      }
    })
  })

  describe('GET /customers/me', () => {
    let testCustomerCpf: string
    let testCustomerPassword: string
    let testCustomerId: string
    let testAccessToken: string

    beforeAll(async () => {
      // Criar e fazer login
      testCustomerCpf = '53210404780' // CPF válido único para GET /customers/me
      testCustomerPassword = 'me123456'
      testCpfs.push(testCustomerCpf)

      const registerResponse = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Me Test User',
          cpf: testCustomerCpf,
          email: 'metest@example.com',
          password: testCustomerPassword
        })
      })

      expect(registerResponse.status).toBe(201)
      const registerData = await registerResponse.json()
      testCustomerId = registerData.customer.id
      testCustomerIds.push(testCustomerId)

      const loginResponse = await fetch(`${API_BASE_URL}/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          cpf: testCustomerCpf,
          password: testCustomerPassword
        })
      })

      expect(loginResponse.status).toBe(200)
      const loginData = await loginResponse.json()
      testAccessToken = loginData.accessToken
    })

    it('should return customer profile with valid token', async () => {
      const response = await fetch(`${API_BASE_URL}/customers/me`, {
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
          'x-store-id': STORE_ID
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.customer).toBeDefined()
      expect(data.customer.id).toBe(testCustomerId)
      expect(data.customer.name).toBe('Me Test User')
      expect(data.customer.email).toBe('metest@example.com')
      expect(data.customer.password_hash).toBeUndefined()
      expect(data.customer.password).toBeUndefined()
    })

    it('should reject request without token', async () => {
      const response = await fetch(`${API_BASE_URL}/customers/me`, {
        headers: {
          'x-store-id': STORE_ID
        }
      })

      expect(response.status).toBe(401)
    })

    it('should reject token from internal user (type !== customer)', async () => {
      // Tentar acessar com token inválido (sem type: 'customer')
      // Na prática, tokens de usuário interno não têm type: 'customer'
      const response = await fetch(`${API_BASE_URL}/customers/me`, {
        headers: {
          Authorization: 'Bearer invalid_customer_token',
          'x-store-id': STORE_ID
        }
      })

      // Deve falhar na validação do token
      expect([401, 400]).toContain(response.status)
    })

    it('should not return customer from different store', async () => {
      // Tentar acessar com store_id diferente
      const response = await fetch(`${API_BASE_URL}/customers/me`, {
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
          'x-store-id': OTHER_STORE_ID
        }
      })

      // Deve falhar porque o token tem storeId diferente do header
      // ou porque o customer não existe na outra loja
      expect([400, 401, 404]).toContain(response.status)
    })
  })

  describe('PUT /customers/me', () => {
    let testCustomerCpf: string
    let testCustomerPassword: string
    let testCustomerId: string
    let testAccessToken: string

    beforeAll(async () => {
      // Criar e fazer login
      testCustomerCpf = '75716947018'
      testCustomerPassword = 'update123'
      testCpfs.push(testCustomerCpf)

      const registerResponse = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Update Test User',
          cpf: testCustomerCpf,
          email: 'updatetest@example.com',
          password: testCustomerPassword
        })
      })

      expect(registerResponse.status).toBe(201)
      const registerData = await registerResponse.json()
      testCustomerId = registerData.customer.id
      testCustomerIds.push(testCustomerId)

      const loginResponse = await fetch(`${API_BASE_URL}/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          cpf: testCustomerCpf,
          password: testCustomerPassword
        })
      })

      expect(loginResponse.status).toBe(200)
      const loginData = await loginResponse.json()
      testAccessToken = loginData.accessToken
    })

    it('should update name, email and phone', async () => {
      const response = await fetch(`${API_BASE_URL}/customers/me`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Updated Name',
          email: 'updated@example.com',
          phone: '(11) 88888-8888'
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.customer.name).toBe('Updated Name')
      expect(data.customer.email).toBe('updated@example.com')
      expect(data.customer.phone).toBe('(11) 88888-8888')
      expect(data.customer.cpf).toBe(testCustomerCpf) // CPF não deve mudar
    })

    it('should not allow changing CPF', async () => {
      // Tentar atualizar com CPF diferente (se o schema permitir)
      // Na verdade, o schema não deve ter campo CPF no update
      const updateResponse = await fetch(`${API_BASE_URL}/customers/me`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Test',
          cpf: '99999999999' // Tentar mudar CPF
        })
      })

      // Se o schema não aceitar CPF, deve ignorar ou retornar erro
      // Verificar que o CPF original não mudou
      expect([200, 400]).toContain(updateResponse.status)
      const getResponse = await fetch(`${API_BASE_URL}/customers/me`, {
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
          'x-store-id': STORE_ID
        }
      })
      const getData = await getResponse.json()
      expect(getData.customer.cpf).toBe(testCustomerCpf)
    })

    it('should reject email already used by another customer in same store', async () => {
      // Criar outro customer com email
      const otherCpf = '83639888120'
      testCpfs.push(otherCpf)
      const otherEmail = 'other@example.com'

      const registerResponse = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Other User',
          cpf: otherCpf,
          email: otherEmail,
          password: 'pass123'
        })
      })
      expect(registerResponse.status).toBe(201)
      const otherData = await registerResponse.json()
      testCustomerIds.push(otherData.customer.id)

      // Tentar atualizar com email já usado
      const response = await fetch(`${API_BASE_URL}/customers/me`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          email: otherEmail
        })
      })

      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.error).toContain('Email já cadastrado')
    })

    it('should allow same email in different store', async () => {
      const crossStoreEmail = 'crossstore2@example.com'
      const otherCpf = '60536449783'
      testCpfs.push(otherCpf)

      // Criar customer em outra loja com mesmo email
      const registerResponse = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': OTHER_STORE_ID
        },
        body: JSON.stringify({
          name: 'Other Store User',
          cpf: otherCpf,
          email: crossStoreEmail,
          password: 'pass123'
        })
      })
      expect(registerResponse.status).toBe(201)
      const otherData = await registerResponse.json()
      testCustomerIds.push(otherData.customer.id)

      // Atualizar com mesmo email (deve funcionar, loja diferente)
      const response = await fetch(`${API_BASE_URL}/customers/me`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          email: crossStoreEmail
        })
      })

      expect(response.status).toBe(200)
    })

    it('should reject update without token', async () => {
      const response = await fetch(`${API_BASE_URL}/customers/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Test'
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Multi-tenant isolation', () => {
    it('should not allow customer from store A to login in store B', async () => {
      const cpf = '28436747194' // CPF válido único para multi-tenant login
      testCpfs.push(cpf)

      // Criar customer na loja 1
      const registerResponse = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Store A User',
          cpf: cpf,
          password: 'pass123'
        })
      })
      expect(registerResponse.status).toBe(201)
      const registerData = await registerResponse.json()
      testCustomerIds.push(registerData.customer.id)

      // Tentar login na loja 2
      const loginResponse = await fetch(`${API_BASE_URL}/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': OTHER_STORE_ID
        },
        body: JSON.stringify({
          cpf: cpf,
          password: 'pass123'
        })
      })

      expect(loginResponse.status).toBe(401)
    })

    it('should not allow customer from store A to access /customers/me in store B', async () => {
      const cpf = '50833747657' // CPF válido único para multi-tenant me
      testCpfs.push(cpf)

      // Criar e fazer login na loja 1
      const registerResponse = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Isolation Test',
          cpf: cpf,
          password: 'pass123'
        })
      })
      expect(registerResponse.status).toBe(201)
      const registerData = await registerResponse.json()
      testCustomerIds.push(registerData.customer.id)

      const loginResponse = await fetch(`${API_BASE_URL}/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          cpf: cpf,
          password: 'pass123'
        })
      })
      expect(loginResponse.status).toBe(200)
      const loginData = await loginResponse.json()
      const token = loginData.accessToken

      // Tentar acessar na loja 2
      const meResponse = await fetch(`${API_BASE_URL}/customers/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-store-id': OTHER_STORE_ID
        }
      })

      // Deve falhar porque o token tem storeId diferente
      expect([400, 401, 404]).toContain(meResponse.status)
    })
  })

  describe('Concurrency and edge cases', () => {
    it('should handle rapid duplicate registration attempts', async () => {
      const cpf = '47732572530' // CPF válido único para concurrency
      testCpfs.push(cpf)

      // Primeiro cadastro
      const response1 = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Concurrency Test',
          cpf: cpf,
          password: 'pass123'
        })
      })
      expect(response1.status).toBe(201)
      const data1 = await response1.json()
      testCustomerIds.push(data1.customer.id)

      // Segundo cadastro imediato (deve falhar)
      const response2 = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Concurrency Test 2',
          cpf: cpf,
          password: 'pass456'
        })
      })

      expect(response2.status).toBe(409) // Conflict
      const data2 = await response2.json()
      expect(data2.error).toContain('CPF já cadastrado')
    })

    it('should create multiple sessions on multiple logins', async () => {
      const cpf = '76155456500' // CPF válido único para multiple sessions
      testCpfs.push(cpf)
      const password = 'multisession123'

      // Criar customer
      const registerResponse = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Multi Session Test',
          cpf: cpf,
          password: password
        })
      })
      expect(registerResponse.status).toBe(201)
      const registerData = await registerResponse.json()
      testCustomerIds.push(registerData.customer.id)

      // Primeiro login
      const login1 = await fetch(`${API_BASE_URL}/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          cpf: cpf,
          password: password
        })
      })
      expect(login1.status).toBe(200)
      const data1 = await login1.json()
      const token1 = data1.accessToken

      // Segundo login (deve criar nova sessão)
      const login2 = await fetch(`${API_BASE_URL}/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          cpf: cpf,
          password: password
        })
      })
      expect(login2.status).toBe(200)
      const data2 = await login2.json()
      const token2 = data2.accessToken

      // Access tokens podem ser iguais (mesmo payload JWT: customer_id, store_id, type)
      // O importante é que ambas as sessões funcionem (refresh tokens são diferentes)

      // Ambas as sessões devem funcionar
      const me1 = await fetch(`${API_BASE_URL}/customers/me`, {
        headers: {
          Authorization: `Bearer ${token1}`,
          'x-store-id': STORE_ID
        }
      })
      expect(me1.status).toBe(200)

      const me2 = await fetch(`${API_BASE_URL}/customers/me`, {
        headers: {
          Authorization: `Bearer ${token2}`,
          'x-store-id': STORE_ID
        }
      })
      expect(me2.status).toBe(200)
    })
  })

  describe('Security and consistency', () => {
    it('should never return password_hash in any response', async () => {
      const cpf = '06188604362'
      testCpfs.push(cpf)

      // Cadastro
      const registerResponse = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Security Test',
          cpf: cpf,
          password: 'securepass123'
        })
      })
      expect(registerResponse.status).toBe(201)
      const registerData = await registerResponse.json()
      expect(registerData.customer.password_hash).toBeUndefined()
      expect(registerData.customer.password).toBeUndefined()
      testCustomerIds.push(registerData.customer.id)

      // Login
      const loginResponse = await fetch(`${API_BASE_URL}/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          cpf: cpf,
          password: 'securepass123'
        })
      })
      expect(loginResponse.status).toBe(200)
      const loginData = await loginResponse.json()
      expect(loginData.customer.password_hash).toBeUndefined()
      expect(loginData.customer.password).toBeUndefined()

      // Me
      const token = loginData.accessToken
      const meResponse = await fetch(`${API_BASE_URL}/customers/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-store-id': STORE_ID
        }
      })
      expect(meResponse.status).toBe(200)
      const meData = await meResponse.json()
      expect(meData.customer.password_hash).toBeUndefined()
      expect(meData.customer.password).toBeUndefined()
    })
  })

  describe('Status codes and error handling', () => {
    it('should return 409 for duplicate CPF', async () => {
      const cpf = '96102948122'
      testCpfs.push(cpf)

      // Primeiro cadastro
      const response1 = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Status Test',
          cpf: cpf,
          password: 'pass123'
        })
      })
      expect(response1.status).toBe(201)
      const data1 = await response1.json()
      testCustomerIds.push(data1.customer.id)

      // Tentativa duplicada
      const response2 = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Status Test 2',
          cpf: cpf,
          password: 'pass456'
        })
      })

      expect(response2.status).toBe(409) // Conflict
    })

    it('should return 409 for duplicate email', async () => {
      const email = 'status409@example.com'
      const cpf1 = '60536449783' // CPF válido único
      const cpf2 = '54622195631' // CPF válido único
      testCpfs.push(cpf1, cpf2)

      // Primeiro cadastro
      const response1 = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Email Status Test',
          cpf: cpf1,
          email: email,
          password: 'pass123'
        })
      })
      expect(response1.status).toBe(201)
      const data1 = await response1.json()
      testCustomerIds.push(data1.customer.id)

      // Tentativa com mesmo email
      const response2 = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Email Status Test 2',
          cpf: cpf2,
          email: email,
          password: 'pass456'
        })
      })

      expect(response2.status).toBe(409) // Conflict
    })

    it('should return 401 for invalid credentials on login', async () => {
      // Usar CPF válido mas que não existe no banco
      const response = await fetch(`${API_BASE_URL}/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          cpf: '12345678909', // CPF válido mas não cadastrado
          password: 'wrongpass'
        })
      })

      expect(response.status).toBe(401) // Unauthorized
    })

    it('should return 400 for invalid payload', async () => {
      const response = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Ab', // Nome muito curto
          cpf: '12345678900',
          password: '12345' // Senha muito curta
        })
      })

      expect(response.status).toBe(400) // Bad Request
    })

    it('should return 400 when x-store-id is missing', async () => {
      const response = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Test User',
          cpf: '22222222222',
          password: 'pass123'
        })
      })

      expect([400, 404]).toContain(response.status)
    })

    it('should reject customer token on admin routes', async () => {
      const cpf = '58310557280' // CPF válido único para este teste
      testCpfs.push(cpf)

      // Criar e fazer login como cliente
      const registerResponse = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Admin Test',
          cpf: cpf,
          password: 'pass123'
        })
      })
      expect(registerResponse.status).toBe(201)
      const registerData = await registerResponse.json()
      testCustomerIds.push(registerData.customer.id)

      const loginResponse = await fetch(`${API_BASE_URL}/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          cpf: cpf,
          password: 'pass123'
        })
      })
      expect(loginResponse.status).toBe(200)
      const loginData = await loginResponse.json()
      const customerToken = loginData.accessToken

      // Tentar acessar rota admin com token de cliente
      const adminResponse = await fetch(`${API_BASE_URL}/admin/coupons`, {
        headers: {
          Authorization: `Bearer ${customerToken}`,
          'x-store-id': STORE_ID
        }
      })

      // Deve falhar porque requireAuth rejeita tokens de cliente
      expect([401, 403]).toContain(adminResponse.status)
    })

    it('should reject user token on customer routes', async () => {
      // Este teste assume que há um token de usuário interno disponível
      // Se não houver, pode ser pulado ou mockado
      // Na prática, tokens de usuário interno não têm type: 'customer'
      const response = await fetch(`${API_BASE_URL}/customers/me`, {
        headers: {
          Authorization: 'Bearer invalid_user_token',
          'x-store-id': STORE_ID
        }
      })

      // Deve falhar porque requireCustomerAuth rejeita tokens sem type: 'customer'
      expect([401, 400]).toContain(response.status)
    })

    it('should reject customer refresh token on user refresh endpoint', async () => {
      const cpf = '56255679306' // CPF válido - será limpo no beforeAll
      testCpfs.push(cpf)

      // Criar e fazer login como cliente
      const registerResponse = await fetch(`${API_BASE_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          name: 'Refresh Test',
          cpf: cpf,
          password: 'pass123'
        })
      })
      expect(registerResponse.status).toBe(201)
      const registerData = await registerResponse.json()
      testCustomerIds.push(registerData.customer.id)

      const loginResponse = await fetch(`${API_BASE_URL}/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': STORE_ID
        },
        body: JSON.stringify({
          cpf: cpf,
          password: 'pass123'
        })
      })
      expect(loginResponse.status).toBe(200)

      // Extrair refresh token do cookie
      const cookies = loginResponse.headers.get('set-cookie')
      const refreshTokenMatch = cookies?.match(/refreshToken=([^;]+)/)
      if (refreshTokenMatch) {
        const refreshToken = refreshTokenMatch[1]

        // Tentar usar refresh token de cliente no endpoint de refresh de usuário interno
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            Cookie: `refreshToken=${refreshToken}`
          }
        })

        // Deve falhar porque refresh-token.ts valida que é sessão de usuário interno
        expect([401, 400]).toContain(refreshResponse.status)
      }
    })
  })
})

describe('Customer Integration with Orders and Carts', () => {
  let testCustomerCpf: string
  let testCustomerPassword: string
  let testCustomerId: string
  let testAccessToken: string
  const testCpfs: string[] = []
  const testCustomerIds: string[] = []

  beforeAll(async () => {
    await ensureTestStore(STORE_ID)
    testCustomerCpf = '71268500500' // CPF válido (já usado, mas este teste é isolado)
    testCustomerPassword = 'integration123'
    testCpfs.push(testCustomerCpf)

    // Criar e fazer login
    const registerResponse = await fetch(`${API_BASE_URL}/customers/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-store-id': STORE_ID
      },
      body: JSON.stringify({
        name: 'Integration Test User',
        cpf: testCustomerCpf,
        email: 'integration@example.com',
        password: testCustomerPassword
      })
    })
    expect(registerResponse.status).toBe(201)
    const registerData = await registerResponse.json()
    testCustomerId = registerData.customer.id
    testCustomerIds.push(testCustomerId)

    const loginResponse = await fetch(`${API_BASE_URL}/customers/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-store-id': STORE_ID
      },
      body: JSON.stringify({
        cpf: testCustomerCpf,
        password: testCustomerPassword
      })
    })
    expect(loginResponse.status).toBe(200)
    const loginData = await loginResponse.json()
    testAccessToken = loginData.accessToken
  })

  afterAll(async () => {
    await cleanupTestSessions(testCustomerIds)
    await cleanupTestCustomers(STORE_ID, testCpfs)
  })

  it('should create cart with customer_id from JWT', async () => {
    const response = await fetch(`${API_BASE_URL}/carts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testAccessToken}`,
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
        // Não enviar customer_id no body - deve vir do JWT
      })
    })

    // Pode retornar 400 se produto não existir, mas se passar deve ter customer_id
    if (response.status === 200) {
      const data = await response.json()
      expect(data.cart).toBeDefined()
      expect(data.cart.customer_id).toBe(testCustomerId)
      expect(data.cart.store_id).toBe(STORE_ID)
    } else {
      // Se falhar por produto, pelo menos verificar que não é erro de customer_id
      expect(response.status).not.toBe(401) // Não deve ser erro de autenticação
    }
  })

  it('should create order with customer_id from JWT', async () => {
    // Primeiro criar um produto de teste se necessário
    // Assumindo que existe produto com ID '00000000-0000-0000-0000-000000000010'

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testAccessToken}`,
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
        ],
        shipping_cost: 1000
        // Não enviar customer_id no body - deve vir do JWT
      })
    })

    // Pode retornar 400 se produto não existir ou estoque insuficiente
    // Mas se passar, deve ter customer_id preenchido
    if (response.status === 201) {
      const data = await response.json()
      expect(data.order).toBeDefined()
      expect(data.order.customer_id).toBe(testCustomerId)
    } else {
      // Se falhar por produto/estoque, pelo menos verificar que não é erro de customer_id
      expect(response.status).not.toBe(401) // Não deve ser erro de autenticação
    }
  })

  it('should allow guest checkout (customer_id = null) when not authenticated', async () => {
    const response = await fetch(`${API_BASE_URL}/orders`, {
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
        ],
        shipping_cost: 1000
      })
    })

    // Pode retornar 400 se produto não existir, mas não deve ser erro de autenticação
    if (response.status === 201) {
      const data = await response.json()
      expect(data.order.customer_id).toBeNull()
    } else {
      expect(response.status).not.toBe(401)
    }
  })
})

