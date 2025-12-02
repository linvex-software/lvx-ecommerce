export interface PickupPoint {
  id: string
  store_id: string
  name: string
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  zip_code: string
  is_active: boolean
  created_at: Date
}

export interface CreatePickupPointInput {
  store_id: string
  name: string
  street: string
  number: string
  complement?: string | null
  neighborhood: string
  city: string
  state: string
  zip_code: string
  is_active?: boolean
}

export interface UpdatePickupPointInput {
  name?: string
  street?: string
  number?: string
  complement?: string | null
  neighborhood?: string
  city?: string
  state?: string
  zip_code?: string
  is_active?: boolean
}

