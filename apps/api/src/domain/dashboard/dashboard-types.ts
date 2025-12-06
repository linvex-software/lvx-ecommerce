export interface TopProduct {
  id: string
  name: string
  sku: string
  unitsSold: number
  revenue: string // numeric como string do Drizzle
  category: string | null // primeira categoria do produto ou null
}

