export interface Customer {
  id: string
  store_id: string
  name: string
  email: string | null
  cpf: string // CPF obrigatório
  phone: string | null
  password_hash: string | null
  created_at: Date
}

export interface RegisterCustomerInput {
  name: string
  cpf: string
  email?: string | null
  phone?: string | null
  password: string
}

export interface LoginCustomerInput {
  cpf: string
  password: string
}

export interface UpdateCustomerProfileInput {
  name?: string
  email?: string | null
  phone?: string | null
}

export interface CustomerProfile {
  id: string
  store_id: string
  name: string
  email: string | null
  cpf: string // CPF obrigatório
  phone: string | null
  created_at: Date
}

export interface CustomerAddress {
  id: string
  customer_id: string
  street: string
  city: string
  state: string
  zip: string
  is_default: boolean
}

export interface CreateCustomerAddressInput {
  street: string
  city: string
  state: string
  zip: string
  is_default?: boolean
}

export interface UpdateCustomerAddressInput {
  street?: string
  city?: string
  state?: string
  zip?: string
  is_default?: boolean
}

