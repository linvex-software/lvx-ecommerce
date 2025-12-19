import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

interface R2Config {
  accessKeyId: string
  secretAccessKey: string
  endpoint: string
  bucketName: string
}

export class R2StorageService {
  private s3Client: S3Client
  private bucketName: string
  private publicUrlBase: string

  constructor(config: R2Config) {
    this.bucketName = config.bucketName

    // R2 requer um domínio customizado configurado para URLs públicas
    // O endpoint S3 não funciona para acesso público direto
    if (process.env.R2_PUBLIC_URL) {
      // Remover barra final se houver
      this.publicUrlBase = process.env.R2_PUBLIC_URL.replace(/\/$/, '')
    } else {
      throw new Error(
        'R2_PUBLIC_URL não configurado. ' +
        'O Cloudflare R2 requer um domínio customizado configurado para URLs públicas. ' +
        'Configure R2_PUBLIC_URL no .env com a URL do seu domínio customizado do R2 ' +
        '(ex: https://cdn.seudominio.com ou https://r2.seudominio.com)'
      )
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    })
  }

  /**
   * Faz upload de uma imagem para o R2
   * @param fileBuffer Buffer do arquivo
   * @param fileName Nome do arquivo original
   * @param contentType Tipo MIME do arquivo (ex: image/jpeg)
   * @param folder Pasta onde salvar (ex: 'products')
   * @returns URL pública da imagem
   */
  async uploadImage(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    folder: string = 'products'
  ): Promise<string> {
    // Validar tipo de arquivo
    if (!contentType.startsWith('image/')) {
      throw new Error('Arquivo deve ser uma imagem')
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (fileBuffer.length > maxSize) {
      throw new Error('Arquivo muito grande. Tamanho máximo: 5MB')
    }

    // Gerar nome único para o arquivo
    const fileExtension = fileName.split('.').pop() || 'jpg'
    const uniqueFileName = `${Date.now()}-${uuidv4()}.${fileExtension}`
    const key = `${folder}/${uniqueFileName}`

    // Fazer upload
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      // Tornar o arquivo público (se necessário, ajustar conforme configuração do bucket)
      // ACL: 'public-read' // Remover se o bucket já estiver configurado como público
    })

    try {
      await this.s3Client.send(command)

      // Retornar URL pública
      return `${this.publicUrlBase}/${key}`
    } catch (error) {
      console.error('[R2Storage] Erro ao fazer upload:', error)
      
      // Log detalhado do erro
      if (error instanceof Error) {
        console.error('[R2Storage] Erro detalhado:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        })
        
        // Se for erro de credenciais ou configuração
        if (error.message.includes('credentials') || error.message.includes('InvalidAccessKeyId')) {
          throw new Error('Credenciais do R2 inválidas. Verifique R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY')
        }
        
        // Se for erro de bucket
        if (error.message.includes('NoSuchBucket') || error.message.includes('bucket')) {
          throw new Error(`Bucket "${this.bucketName}" não encontrado. Verifique R2_BUCKET_NAME`)
        }
        
        // Se for erro de endpoint
        if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
          throw new Error(`Não foi possível conectar ao endpoint do R2. Verifique R2_ENDPOINT`)
        }
        
        // Retornar mensagem original se for útil
        throw new Error(`Erro ao fazer upload: ${error.message}`)
      }
      
      throw new Error('Erro desconhecido ao fazer upload da imagem para o storage')
    }
  }
}

// Factory function para criar instância do serviço a partir das variáveis de ambiente
export function createR2StorageService(): R2StorageService {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const endpoint = process.env.R2_ENDPOINT
  const bucketName = process.env.R2_BUCKET_NAME
  const publicUrl = process.env.R2_PUBLIC_URL

  if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName) {
    throw new Error(
      'Variáveis de ambiente do R2 não configuradas. Verifique: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET_NAME'
    )
  }

  if (!publicUrl) {
    throw new Error(
      'R2_PUBLIC_URL não configurado. ' +
      'O Cloudflare R2 requer um domínio customizado para URLs públicas. ' +
      'Configure R2_PUBLIC_URL no .env com a URL do seu domínio customizado do R2. ' +
      'Para configurar um domínio customizado no R2: ' +
      '1. Vá para Cloudflare Dashboard > R2 > Seu Bucket > Settings > Custom Domains ' +
      '2. Adicione um domínio customizado ' +
      '3. Configure R2_PUBLIC_URL com a URL do domínio (ex: https://cdn.seudominio.com)'
    )
  }

  return new R2StorageService({
    accessKeyId,
    secretAccessKey,
    endpoint,
    bucketName
  })
}

