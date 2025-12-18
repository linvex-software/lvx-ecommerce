import { db, schema } from '@white-label/db'
import { eq, sql } from 'drizzle-orm'

export interface UpdateStoreGeneralSettingsInput {
    storeId: string
    cnpj_cpf?: string | null
    whatsapp?: string | null
    email?: string | null
    address?: string | null
    social_media?: {
        facebook?: string
        instagram?: string
        twitter?: string
        linkedin?: string
        youtube?: string
        tiktok?: string
        whatsapp_link?: string
    } | null
    favicon_url?: string | null
}

export async function updateStoreGeneralSettingsUseCase(
    input: UpdateStoreGeneralSettingsInput
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

    const updateData: Partial<typeof schema.stores.$inferInsert> = {}

    if (input.cnpj_cpf !== undefined) updateData.cnpj_cpf = input.cnpj_cpf
    if (input.whatsapp !== undefined) updateData.whatsapp = input.whatsapp
    if (input.email !== undefined) updateData.email = input.email
    if (input.address !== undefined) updateData.address = input.address
    if (input.social_media !== undefined) updateData.social_media = input.social_media
    if (input.favicon_url !== undefined) updateData.favicon_url = input.favicon_url

    if (Object.keys(updateData).length > 0) {
        await db
            .update(schema.stores)
            .set(updateData)
            .where(eq(schema.stores.id, input.storeId))
    }
}
