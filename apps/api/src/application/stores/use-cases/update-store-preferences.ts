import { db, schema } from '@white-label/db'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export interface UpdateStorePreferencesInput {
  storeId: string
  logo_url?: string | null
  primary_color?: string | null
  secondary_color?: string | null
  text_color?: string | null
  icon_color?: string | null
}

export async function updateStorePreferencesUseCase(
  input: UpdateStorePreferencesInput
): Promise<void> {
  // Verificar se a loja existe
  const store = await db
    .select()
    .from(schema.stores)
    .where(eq(schema.stores.id, input.storeId))
    .limit(1)

  if (store.length === 0) {
    throw new Error('Store not found')
  }

  // Buscar ou criar config de tema
  const existingConfig = await db
    .select()
    .from(schema.storeThemeConfig)
    .where(eq(schema.storeThemeConfig.store_id, input.storeId))
    .limit(1)

  const updateData: Partial<typeof schema.storeThemeConfig.$inferInsert> = {
    updated_at: new Date()
  }

  if (input.logo_url !== undefined) {
    updateData.logo_url = input.logo_url
  }
  if (input.primary_color !== undefined) {
    updateData.primary_color = input.primary_color
  }
  if (input.secondary_color !== undefined) {
    updateData.secondary_color = input.secondary_color
  }
  if (input.text_color !== undefined) {
    updateData.text_color = input.text_color
  }
  if (input.icon_color !== undefined) {
    updateData.icon_color = input.icon_color
  }

  if (existingConfig.length > 0) {
    // Atualizar config existente
    await db
      .update(schema.storeThemeConfig)
      .set(updateData)
      .where(eq(schema.storeThemeConfig.store_id, input.storeId))
  } else {
    // Criar nova config
    await db
      .insert(schema.storeThemeConfig)
      .values({
        store_id: input.storeId,
        ...updateData
      })
  }
}






