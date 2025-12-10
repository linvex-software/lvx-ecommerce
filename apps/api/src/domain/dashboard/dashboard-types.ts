export interface TopProduct {
  id: string
  name: string
  sku: string
  unitsSold: number
  revenue: string // numeric como string do Drizzle
  category: string | null // primeira categoria do produto ou null
}

export interface SalesByDay {
  date: string // formato YYYY-MM-DD
  ordersCount: number
  revenue: string // em reais, como string (numeric do banco)
}

export interface RevenueMetrics {
  totalRevenue: string // em reais, como string (numeric do banco)
  ordersCount: number
  averageOrderValue: string // em reais, como string (numeric do banco)
}

export interface OperationalMetrics {
  pendingOrders: number
  awaitingShipment: number
  lowStock: number
}

export interface CriticalStockProduct {
  id: string
  name: string
  sku: string
  currentStock: number
  minStock: number | null
}

