import { z } from 'zod'
import { PhysicalSaleRepository } from '../../../infra/db/repositories/physical-sale-repository'
import type { PhysicalSalesByProductReport } from '../../../domain/physical-sales/physical-sales-types'

const getPhysicalSalesReportByProductSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  seller_id: z.string().uuid().optional()
})

export interface GetPhysicalSalesReportByProductDependencies {
  physicalSaleRepository: PhysicalSaleRepository
}

export async function getPhysicalSalesReportByProductUseCase(
  storeId: string,
  query: z.infer<typeof getPhysicalSalesReportByProductSchema>,
  dependencies: GetPhysicalSalesReportByProductDependencies
): Promise<PhysicalSalesByProductReport[]> {
  const { physicalSaleRepository } = dependencies

  const validated = getPhysicalSalesReportByProductSchema.parse(query)

  // Se não houver datas, usar últimos 30 dias como padrão
  const defaultEndDate = new Date()
  const defaultStartDate = new Date()
  defaultStartDate.setDate(defaultStartDate.getDate() - 30)

  const startDate = validated.start_date
    ? new Date(validated.start_date)
    : defaultStartDate
  const endDate = validated.end_date ? new Date(validated.end_date) : defaultEndDate

  return await physicalSaleRepository.getReportByProduct(
    storeId,
    startDate,
    endDate,
    validated.seller_id
  )
}

export { getPhysicalSalesReportByProductSchema }

