import { db, schema } from '@white-label/db'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export interface UpdateStoreBannerInput {
  storeId: string
  bannerUrl: string | null
}

export async function updateStoreBannerUseCase(
  input: UpdateStoreBannerInput
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

  if (existingConfig.length > 0) {
    // Atualizar config existente
    await db
      .update(schema.storeThemeConfig)
      .set({
        banner_url: input.bannerUrl,
        updated_at: sql`now()`
      })
      .where(eq(schema.storeThemeConfig.store_id, input.storeId))
  } else {
    // Criar nova config
    await db
      .insert(schema.storeThemeConfig)
      .values({
        store_id: input.storeId,
        banner_url: input.bannerUrl,
        config_json: {}
      })
  }
}








