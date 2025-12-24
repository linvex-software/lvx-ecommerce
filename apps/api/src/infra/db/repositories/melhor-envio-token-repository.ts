import { db, schema } from '@white-label/db'
import { eq } from 'drizzle-orm'

export interface MelhorEnvioToken {
  id: string
  store_id: string
  access_token: string
  refresh_token: string
  expires_at: Date
  created_at: Date
  updated_at: Date
}

export interface CreateMelhorEnvioTokenInput {
  store_id: string
  access_token: string
  refresh_token: string
  expires_at: Date
}

export class MelhorEnvioTokenRepository {
  /**
   * Busca tokens do Melhor Envio para uma loja
   */
  async findByStoreId(storeId: string): Promise<MelhorEnvioToken | null> {
    const result = await db
      .select()
      .from(schema.melhorEnvioTokens)
      .where(eq(schema.melhorEnvioTokens.store_id, storeId))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    const row = result[0]
    return {
      id: row.id,
      store_id: row.store_id,
      access_token: row.access_token,
      refresh_token: row.refresh_token,
      expires_at: row.expires_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }

  /**
   * Salva ou atualiza tokens do Melhor Envio para uma loja
   */
  async save(
    storeId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date
  ): Promise<MelhorEnvioToken> {
    // Verificar se já existe token para esta loja
    const existing = await this.findByStoreId(storeId)

    if (existing) {
      // Atualizar tokens existentes
      const result = await db
        .update(schema.melhorEnvioTokens)
        .set({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          updated_at: new Date()
        })
        .where(eq(schema.melhorEnvioTokens.store_id, storeId))
        .returning()

      const row = result[0]
      return {
        id: row.id,
        store_id: row.store_id,
        access_token: row.access_token,
        refresh_token: row.refresh_token,
        expires_at: row.expires_at,
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    } else {
      // Criar novos tokens
      const result = await db
        .insert(schema.melhorEnvioTokens)
        .values({
          store_id: storeId,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt
        })
        .returning()

      const row = result[0]
      return {
        id: row.id,
        store_id: row.store_id,
        access_token: row.access_token,
        refresh_token: row.refresh_token,
        expires_at: row.expires_at,
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    }
  }

  /**
   * Remove tokens do Melhor Envio para uma loja (revoga autorização)
   */
  async delete(storeId: string): Promise<boolean> {
    const result = await db
      .delete(schema.melhorEnvioTokens)
      .where(eq(schema.melhorEnvioTokens.store_id, storeId))
      .returning()

    return result.length > 0
  }
}

