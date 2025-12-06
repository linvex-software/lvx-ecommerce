import { eq } from 'drizzle-orm'
import { db, schema } from '@white-label/db'

export interface TemplateSettings {
  id: string
  store_id: string
  template_id: string
  config_json: Record<string, unknown>
  created_at: Date
  updated_at: Date
}

export interface CreateTemplateSettingsInput {
  store_id: string
  template_id: string
  config_json: Record<string, unknown>
}

export interface UpdateTemplateSettingsInput {
  config_json: Record<string, unknown>
  template_id?: string
}

export class TemplateSettingsRepository {
  async findByStoreId(storeId: string): Promise<TemplateSettings | null> {
    // Por enquanto, usar a tabela store_layouts ou criar uma nova
    // Vamos usar store_layouts temporariamente até criar a tabela específica
    const result = await db
      .select()
      .from(schema.storeLayouts)
      .where(eq(schema.storeLayouts.store_id, storeId))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    const row = result[0]
    
    // Se layout_json contém template_config, usar isso
    const layoutJson = row.layout_json as Record<string, unknown> | null
    
    if (layoutJson && layoutJson.template_config) {
      return {
        id: row.id,
        store_id: row.store_id,
        template_id: (layoutJson.template_id as string) || 'woman-shop-template',
        config_json: layoutJson.template_config as Record<string, unknown>,
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    }

    return null
  }

  async upsert(input: CreateTemplateSettingsInput & { config_json: Record<string, unknown> }): Promise<TemplateSettings> {
    // Por enquanto, salvar na tabela store_layouts
    // Em produção, criar tabela template_settings específica
    
    const existing = await this.findByStoreId(input.store_id)
    
    if (existing) {
      // Atualizar
      const result = await db
        .update(schema.storeLayouts)
        .set({
          layout_json: {
            template_id: input.template_id,
            template_config: input.config_json
          } as Record<string, unknown>,
          updated_at: new Date()
        })
        .where(eq(schema.storeLayouts.store_id, input.store_id))
        .returning()

      const row = result[0]
      return {
        id: row.id,
        store_id: row.store_id,
        template_id: input.template_id,
        config_json: input.config_json,
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    } else {
      // Criar novo
      const result = await db
        .insert(schema.storeLayouts)
        .values({
          store_id: input.store_id,
          layout_json: {
            template_id: input.template_id,
            template_config: input.config_json
          } as Record<string, unknown>
        })
        .returning()

      const row = result[0]
      return {
        id: row.id,
        store_id: row.store_id,
        template_id: input.template_id,
        config_json: input.config_json,
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    }
  }
}





