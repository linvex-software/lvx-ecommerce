import { db, schema } from '@white-label/db'
import { eq } from 'drizzle-orm'

export interface GetStoreGeneralSettingsOutput {
    id: string
    name: string
    cnpj_cpf: string | null
    whatsapp: string | null
    email: string | null
    address: string | null
    social_media: {
        facebook?: string
        instagram?: string
        twitter?: string
        linkedin?: string
        youtube?: string
        tiktok?: string
        whatsapp_link?: string
    } | null
    favicon_url: string | null
}

export async function getStoreGeneralSettingsUseCase(
    storeId: string
): Promise<GetStoreGeneralSettingsOutput | null> {
    const store = await db
        .select({
            id: schema.stores.id,
            name: schema.stores.name,
            cnpj_cpf: schema.stores.cnpj_cpf,
            whatsapp: schema.stores.whatsapp,
            email: schema.stores.email,
            address: schema.stores.address,
            social_media: schema.stores.social_media,
            favicon_url: schema.stores.favicon_url
        })
        .from(schema.stores)
        .where(eq(schema.stores.id, storeId))
        .limit(1)

    if (store.length === 0) {
        return null
    }

    return store[0] as GetStoreGeneralSettingsOutput
}
