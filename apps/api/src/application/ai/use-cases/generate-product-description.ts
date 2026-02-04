import { z } from 'zod'

/**
 * Use case: gerar descrição curta de produto com IA.
 * Não acessa banco; apenas monta o prompt e chama o provedor de IA.
 */

export const generateProductDescriptionSchema = z.object({
  name: z.string().min(1, 'Nome do produto é obrigatório').max(500),
  category_names: z.array(z.string().max(200)).optional().default([]),
  attributes: z.record(z.string()).optional().default({})
})

export type GenerateProductDescriptionInput = z.infer<typeof generateProductDescriptionSchema>

export interface GenerateProductDescriptionResult {
  description: string
}

export type AIProvider = {
  generateText(prompt: string): Promise<string>
}

export async function generateProductDescriptionUseCase(
  input: GenerateProductDescriptionInput,
  deps: { aiProvider: AIProvider }
): Promise<GenerateProductDescriptionResult> {
  const { name, category_names = [], attributes = {} } = input
  const nameTrimmed = name?.trim() ?? ''
  if (!nameTrimmed) {
    throw new Error('Nome do produto é obrigatório para gerar a descrição.')
  }

  const categoryPart =
    category_names.length > 0
      ? ` Categorias: ${category_names.filter(Boolean).join(', ')}.`
      : ''
  const attributesEntries = Object.entries(attributes).filter(
    ([, v]) => v != null && String(v).trim() !== ''
  )
  const attributesPart =
    attributesEntries.length > 0
      ? ` Atributos: ${attributesEntries.map(([k, v]) => `${k}=${v}`).join(', ')}.`
      : ''

  const prompt = `Gere uma descrição curta de e-commerce para o produto: ${nameTrimmed}.${categoryPart}${attributesPart}

Requisitos:
- Seja persuasivo e objetivo.
- Máximo 2 a 3 frases.
- Em português do Brasil.
- Não inclua título nem marcadores, apenas o texto da descrição.`

  const description = await deps.aiProvider.generateText(prompt)
  return { description }
}
