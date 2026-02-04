import { GoogleGenAI } from '@google/genai'

export interface IAIProvider {
  generateText(prompt: string): Promise<string>
}

/**
 * Cliente de IA usando Google Gemini (novo SDK @google/genai).
 * Usa GEMINI_API_KEY do ambiente.
 */
export class GeminiClient implements IAIProvider {
  private readonly client: GoogleGenAI
  private readonly modelName: string

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey.trim() === '') {
      throw new Error(
        'GEMINI_API_KEY não está definida. Configure no .env (obtenha em https://aistudio.google.com/apikey).'
      )
    }
    this.client = new GoogleGenAI({ apiKey })
    // Usar gemini-2.5-flash (modelo mais novo, estável e gratuito - 1M tokens context)
    this.modelName = 'gemini-2.5-flash'
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt
      })
      
      const text = response.text
      if (!text || typeof text !== 'string') {
        throw new Error('Resposta da IA vazia ou inválida.')
      }
      return text.trim()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao gerar texto com IA.'
      if (message.includes('API key') || message.includes('quota') || message.includes('429')) {
        throw new Error('Serviço de IA indisponível ou limite excedido. Tente mais tarde.')
      }
      throw new Error(`Falha na geração com IA: ${message}`)
    }
  }
}
