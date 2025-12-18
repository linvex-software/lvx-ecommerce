import { PhysicalSaleRepository } from '../../../infra/db/repositories/physical-sale-repository'
import type { PhysicalSale } from '../../../domain/physical-sales/physical-sales-types'

export interface ProcessPhysicalSaleWebhookDependencies {
  physicalSaleRepository: PhysicalSaleRepository
}

export interface PhysicalSaleWebhookPayload {
  physical_sale_id?: string
  sale_id?: string
  status?: string
  payment_status?: string
  [key: string]: unknown
}

/**
 * Processa webhook relacionado a venda física.
 *
 * Atualiza o status da venda física baseado no evento do webhook.
 * Suporta diferentes providers (Mercado Pago, PagSeguro, etc).
 */
export async function processPhysicalSaleWebhookUseCase(
  payload: PhysicalSaleWebhookPayload,
  storeId: string,
  dependencies: ProcessPhysicalSaleWebhookDependencies
): Promise<void> {
  const { physicalSaleRepository } = dependencies

  // Extrair ID da venda física do payload
  const saleId = payload.physical_sale_id ?? payload.sale_id
  if (!saleId || typeof saleId !== 'string') {
    throw new Error('Physical sale ID not found in webhook payload')
  }

  // Buscar venda física
  const sale = await physicalSaleRepository.findByIdWithRelations(saleId, storeId)
  if (!sale) {
    throw new Error(`Physical sale ${saleId} not found`)
  }

  // Determinar novo status baseado no payload
  const newStatus = determineSaleStatusFromWebhook(payload, sale)

  // Atualizar status se necessário
  if (newStatus && newStatus !== sale.status) {
    await physicalSaleRepository.updateStatus(saleId, storeId, newStatus)
  }
}

function determineSaleStatusFromWebhook(
  payload: PhysicalSaleWebhookPayload,
  sale: { status: PhysicalSale['status'] }
): 'completed' | 'pending' | 'cancelled' | null {
  const status = payload.status ?? payload.payment_status

  if (!status || typeof status !== 'string') {
    return null
  }

  const statusLower = status.toLowerCase()

  // Mapear status de diferentes providers para nosso formato
  if (
    statusLower.includes('paid') ||
    statusLower.includes('approved') ||
    statusLower.includes('completed') ||
    statusLower === 'pago' ||
    statusLower === 'aprovado'
  ) {
    return 'completed'
  }

  if (
    statusLower.includes('pending') ||
    statusLower.includes('waiting') ||
    statusLower === 'pendente' ||
    statusLower === 'aguardando'
  ) {
    return 'pending'
  }

  if (
    statusLower.includes('cancelled') ||
    statusLower.includes('canceled') ||
    statusLower.includes('refunded') ||
    statusLower === 'cancelado' ||
    statusLower === 'reembolsado'
  ) {
    return 'cancelled'
  }

  return null
}

