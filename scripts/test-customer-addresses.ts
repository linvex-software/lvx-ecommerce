import 'dotenv/config'

/**
 * Script para testar o CRUD completo de endereços de clientes
 * 
 * Uso:
 * 1. Certifique-se de que as migrations foram aplicadas: pnpm db:migrate
 * 2. Execute: pnpm test:customer-addresses
 * 
 * Pré-requisitos:
 * - Ter um store_id válido
 * - API rodando em http://localhost:3333
 * - Cliente de teste será criado automaticamente se não existir
 */

const API_URL = process.env.API_URL || 'http://localhost:3333'
const STORE_ID = process.env.TEST_STORE_ID || '8adec9f6-02d7-404d-90dc-296badba9e41'

interface TestResult {
  name: string
  success: boolean
  error?: string
  data?: any
}

const results: TestResult[] = []
let customerAccessToken: string = ''
let createdAddressId: string = ''

// Dados do cliente de teste
const TEST_CUSTOMER = {
  name: 'Cliente Teste Endereços',
  cpf: '11144477735', // CPF válido para testes
  email: 'cliente.enderecos@teste.com',
  phone: '11999999999',
  password: 'senha123'
}

async function test(description: string, fn: () => Promise<any>): Promise<void> {
  try {
    console.log(`\n🧪 ${description}...`)
    const data = await fn()
    results.push({ name: description, success: true, data })
    console.log(`✅ ${description} - SUCESSO`)
    if (data && typeof data === 'object') {
      const jsonStr = JSON.stringify(data, null, 2)
      console.log(`   Resposta:`, jsonStr.slice(0, 300) + (jsonStr.length > 300 ? '...' : ''))
    }
  } catch (error: any) {
    results.push({ 
      name: description, 
      success: false, 
      error: error.message || String(error) 
    })
    console.log(`❌ ${description} - ERRO:`, error.message || error)
  }
}

async function main() {
  console.log('🚀 Iniciando testes de CRUD de Endereços de Clientes\n')
  console.log(`📍 API URL: ${API_URL}`)
  console.log(`🏪 Store ID: ${STORE_ID || '⚠️  Não configurado (use TEST_STORE_ID no .env)'}\n`)

  if (!STORE_ID) {
    console.error('❌ Erro: TEST_STORE_ID não encontrado no .env')
    console.error('   Execute: pnpm test:store-id para obter o Store ID')
    process.exit(1)
  }

  // 1. Registrar cliente de teste
  await test('Registrar cliente de teste', async () => {
    const response = await fetch(`${API_URL}/customers/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-store-id': STORE_ID
      },
      body: JSON.stringify(TEST_CUSTOMER)
    })

    if (!response.ok) {
      const errorData = await response.json()
      // Se cliente já existe, não é erro (pode continuar)
      if (response.status === 409 && errorData.error?.includes('já cadastrado')) {
        console.log('   ℹ️  Cliente já existe, continuando...')
        return { message: 'Cliente já existe' }
      }
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`)
    }

    return await response.json()
  })

  // 2. Fazer login do cliente
  await test('Login do cliente', async () => {
    const response = await fetch(`${API_URL}/customers/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-store-id': STORE_ID
      },
      body: JSON.stringify({
        cpf: TEST_CUSTOMER.cpf,
        password: TEST_CUSTOMER.password
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    customerAccessToken = data.accessToken
    return data
  })

  if (!customerAccessToken) {
    console.error('\n❌ Erro: Não foi possível obter o token de acesso')
    console.error('   Impossível continuar com os testes de endereços')
    process.exit(1)
  }

  // 3. Listar endereços (deve estar vazio)
  await test('Listar endereços (vazio)', async () => {
    const response = await fetch(`${API_URL}/customers/me/addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-store-id': STORE_ID,
        'Authorization': `Bearer ${customerAccessToken}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`)
    }

    return await response.json()
  })

  // 4. Criar primeiro endereço
  await test('Criar primeiro endereço', async () => {
    const response = await fetch(`${API_URL}/customers/me/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-store-id': STORE_ID,
        'Authorization': `Bearer ${customerAccessToken}`
      },
      body: JSON.stringify({
        street: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zip: '01310-100',
        is_default: true
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    createdAddressId = data.address.id
    return data
  })

  // 5. Criar segundo endereço (não padrão)
  await test('Criar segundo endereço (não padrão)', async () => {
    const response = await fetch(`${API_URL}/customers/me/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-store-id': STORE_ID,
        'Authorization': `Bearer ${customerAccessToken}`
      },
      body: JSON.stringify({
        street: 'Avenida Paulista, 1000',
        city: 'São Paulo',
        state: 'SP',
        zip: '01310-100',
        is_default: false
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`)
    }

    return await response.json()
  })

  // 6. Listar endereços (deve ter 2)
  await test('Listar endereços (2 endereços)', async () => {
    const response = await fetch(`${API_URL}/customers/me/addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-store-id': STORE_ID,
        'Authorization': `Bearer ${customerAccessToken}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    if (data.addresses?.length !== 2) {
      throw new Error(`Esperado 2 endereços, encontrado ${data.addresses?.length || 0}`)
    }
    return data
  })

  if (!createdAddressId) {
    console.error('\n❌ Erro: Não foi possível obter o ID do endereço criado')
    console.error('   Impossível continuar com os testes de atualização/deleção')
    process.exit(1)
  }

  // 7. Atualizar endereço
  await test('Atualizar endereço', async () => {
    const response = await fetch(`${API_URL}/customers/me/addresses/${createdAddressId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-store-id': STORE_ID,
        'Authorization': `Bearer ${customerAccessToken}`
      },
      body: JSON.stringify({
        street: 'Rua das Flores, 456 (Atualizado)',
        city: 'São Paulo',
        state: 'SP',
        zip: '01310-200'
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`)
    }

    return await response.json()
  })

  // 8. Marcar segundo endereço como padrão (deve desmarcar o primeiro)
  await test('Marcar segundo endereço como padrão', async () => {
    // Primeiro, buscar todos os endereços para pegar o ID do segundo
    const listResponse = await fetch(`${API_URL}/customers/me/addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-store-id': STORE_ID,
        'Authorization': `Bearer ${customerAccessToken}`
      }
    })

    if (!listResponse.ok) {
      throw new Error('Não foi possível listar endereços')
    }

    const listData = await listResponse.json()
    const secondAddress = listData.addresses.find((addr: any) => addr.id !== createdAddressId)
    
    if (!secondAddress) {
      throw new Error('Segundo endereço não encontrado')
    }

    const response = await fetch(`${API_URL}/customers/me/addresses/${secondAddress.id}/default`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-store-id': STORE_ID,
        'Authorization': `Bearer ${customerAccessToken}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`)
    }

    return await response.json()
  })

  // 9. Verificar que apenas um endereço está marcado como padrão
  await test('Verificar apenas um endereço padrão', async () => {
    const response = await fetch(`${API_URL}/customers/me/addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-store-id': STORE_ID,
        'Authorization': `Bearer ${customerAccessToken}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    const defaultAddresses = data.addresses.filter((addr: any) => addr.is_default === true)
    
    if (defaultAddresses.length !== 1) {
      throw new Error(`Esperado 1 endereço padrão, encontrado ${defaultAddresses.length}`)
    }

    return { 
      message: 'Apenas um endereço está marcado como padrão',
      defaultAddress: defaultAddresses[0]
    }
  })

  // 10. Deletar endereço
  await test('Deletar endereço', async () => {
    const response = await fetch(`${API_URL}/customers/me/addresses/${createdAddressId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-store-id': STORE_ID,
        'Authorization': `Bearer ${customerAccessToken}`
      }
    })

    if (!response.ok && response.status !== 204) {
      const errorData = await response.json()
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`)
    }

    return { message: 'Endereço deletado com sucesso' }
  })

  // 11. Verificar que o endereço foi deletado
  await test('Verificar endereço deletado', async () => {
    const response = await fetch(`${API_URL}/customers/me/addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-store-id': STORE_ID,
        'Authorization': `Bearer ${customerAccessToken}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    const deletedAddress = data.addresses.find((addr: any) => addr.id === createdAddressId)
    
    if (deletedAddress) {
      throw new Error('Endereço ainda existe após deleção')
    }

    if (data.addresses?.length !== 1) {
      throw new Error(`Esperado 1 endereço, encontrado ${data.addresses?.length || 0}`)
    }

    return { message: 'Endereço deletado corretamente', remainingAddresses: data.addresses.length }
  })

  // Resumo dos testes
  console.log('\n\n============================================================')
  console.log('📊 RESUMO DOS TESTES')
  console.log('============================================================\n')

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  results.forEach((result) => {
    if (result.success) {
      console.log(`✅ ${result.name}`)
    } else {
      console.log(`❌ ${result.name}`)
      console.log(`   Erro: ${result.error}`)
    }
  })

  console.log('\n============================================================')
  console.log(`✅ Sucessos: ${successful.length}`)
  console.log(`❌ Falhas: ${failed.length}`)
  console.log('============================================================\n')

  if (failed.length > 0) {
    console.log('⚠️  Alguns testes falharam. Verifique:')
    console.log('   1. As migrations foram aplicadas? (pnpm db:migrate)')
    console.log('   2. A API está rodando? (pnpm dev)')
    console.log('   3. O STORE_ID está correto? (pnpm test:store-id)')
    process.exit(1)
  } else {
    console.log('🎉 Todos os testes passaram!')
    process.exit(0)
  }
}

main().catch((error) => {
  console.error('\n❌ Erro fatal:', error)
  process.exit(1)
})

