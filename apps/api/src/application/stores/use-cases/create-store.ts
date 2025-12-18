import { db, schema } from '@white-label/db'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { generateDefaultLayout } from '../utils/default-layout'
import { StoreLayoutRepository } from '../../../infra/db/repositories/store-layout-repository'

export interface CreateStoreInput {
  name: string
  domain: string
}

export interface CreateStoreResult {
  store: {
    id: string
    name: string
    domain: string
    active: boolean
  }
}

export async function createStoreUseCase(
  input: CreateStoreInput,
  userId: string
): Promise<CreateStoreResult> {
  // Verificar se o domain já existe
  const existingStore = await db
    .select()
    .from(schema.stores)
    .where(eq(schema.stores.domain, input.domain))
    .limit(1)

  if (existingStore.length > 0) {
    throw new Error('Domain already in use')
  }

  // Verificar se usuário já tem loja
  const existingUser = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)

  if (existingUser.length === 0) {
    throw new Error('User not found')
  }

  if (existingUser[0].store_id) {
    throw new Error('User already has a store')
  }

  // Criar a store
  const [store] = await db
    .insert(schema.stores)
    .values({
      name: input.name,
      domain: input.domain,
      active: true
    })
    .returning()

  // Associar usuário à store como admin
  await db
    .update(schema.users)
    .set({
      store_id: store.id,
      role: 'admin'
    })
    .where(eq(schema.users.id, userId))

  // Criar layout padrão da loja
  const layoutRepository = new StoreLayoutRepository()
  const defaultLayout = generateDefaultLayout()
  
  await layoutRepository.create({
    store_id: store.id,
    layout_json: defaultLayout
  })

  return {
    store: {
      id: store.id,
      name: store.name,
      domain: store.domain,
      active: store.active
    }
  }
}

