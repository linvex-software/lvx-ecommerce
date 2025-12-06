import { z } from 'zod'
import { PhysicalSaleRepository } from '../../../infra/db/repositories/physical-sale-repository'
import type {
  PhysicalSalesListResult,
  ListPhysicalSalesFilters
} from '../../../domain/physical-sales/physical-sales-types'

const listPhysicalSalesSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  seller_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
})

export interface ListPhysicalSalesDependencies {
  physicalSaleRepository: PhysicalSaleRepository
}

export async function listPhysicalSalesUseCase(
  storeId: string,
  query: z.infer<typeof listPhysicalSalesSchema>,
  dependencies: ListPhysicalSalesDependencies
): Promise<PhysicalSalesListResult> {
  const { physicalSaleRepository } = dependencies

  const validated = listPhysicalSalesSchema.parse(query)

  // Se não houver datas, usar últimos 30 dias como padrão
  const defaultEndDate = new Date()
  const defaultStartDate = new Date()
  defaultStartDate.setDate(defaultStartDate.getDate() - 30)

  const filters: ListPhysicalSalesFilters = {
    start_date: validated.start_date
      ? new Date(validated.start_date)
      : defaultStartDate,
    end_date: validated.end_date ? new Date(validated.end_date) : defaultEndDate,
    seller_id: validated.seller_id,
    product_id: validated.product_id,
    page: validated.page,
    limit: validated.limit
  }

  return await physicalSaleRepository.listByStore(storeId, filters)
}

export { listPhysicalSalesSchema }

