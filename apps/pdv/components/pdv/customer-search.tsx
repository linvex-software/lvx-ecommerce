'use client'

import { useState } from 'react'
import { Search, UserPlus, X, AlertCircle } from 'lucide-react'
import { Button } from '@white-label/ui'
import { useSearchCustomers, useCreateCustomer, type Customer } from '@/lib/hooks/use-customers'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { maskCPF, unmaskCPF, maskPhone, unmaskPhone, validateCPF } from '@/lib/utils/masks'
import toast from 'react-hot-toast'

interface CustomerSearchProps {
  onSelect: (customer: Customer | null) => void
  selectedCustomer: Customer | null
}

export function CustomerSearch({ onSelect, selectedCustomer }: CustomerSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: ''
  })
  const [cpfError, setCpfError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(searchQuery, 300)
  const { data: customers, isLoading } = useSearchCustomers(debouncedQuery)
  const createCustomer = useCreateCustomer()

  const handleSelect = (customer: Customer) => {
    onSelect(customer)
    setSearchQuery('')
    setShowResults(false)
  }

  const handleCreateCustomer = async () => {
    if (!createForm.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    // CPF é opcional para criação rápida
    let cpfUnmasked: string | null = null
    if (createForm.cpf && createForm.cpf.trim()) {
      // Validar CPF
      cpfUnmasked = unmaskCPF(createForm.cpf)
      if (cpfUnmasked.length !== 11) {
        setCpfError('CPF deve ter 11 dígitos')
        return
      }

      if (!validateCPF(createForm.cpf)) {
        setCpfError('CPF inválido. Verifique os dígitos.')
        return
      }

      setCpfError(null)
    }

    try {
      const customer = await createCustomer.mutateAsync({
        name: createForm.name,
        cpf: cpfUnmasked || null, // Enviar sem máscara ou null
        email: createForm.email || null,
        phone: createForm.phone ? unmaskPhone(createForm.phone) : null // Enviar sem máscara
      })
      onSelect(customer)
      setShowCreateForm(false)
      setCreateForm({ name: '', cpf: '', email: '', phone: '' })
      setCpfError(null)
      setSearchQuery('')
      toast.success('Cliente criado com sucesso')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar cliente')
    }
  }

  const handleClear = () => {
    onSelect(null)
    setSearchQuery('')
    setShowResults(false)
  }

  return (
    <>
      {/* Backdrop */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}

      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowResults(true)
              }}
              onFocus={() => setShowResults(true)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setShowResults(false)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCreateForm(!showCreateForm)}
            title="Criar cliente"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
          {selectedCustomer && (
            <Button size="sm" variant="outline" onClick={handleClear} title="Limpar">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {selectedCustomer && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{selectedCustomer.name}</div>
                {selectedCustomer.email && (
                  <div className="text-xs text-gray-600 mt-1">{selectedCustomer.email}</div>
                )}
                {selectedCustomer.phone && (
                  <div className="text-xs text-gray-600 mt-0.5">{selectedCustomer.phone}</div>
                )}
                {selectedCustomer.cpf && (
                  <div className="text-xs text-gray-500 mt-1">CPF: {maskCPF(selectedCustomer.cpf)}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {showCreateForm && (
          <div className="mt-2 p-3 border border-gray-200 rounded-lg bg-white">
            <h3 className="text-sm font-semibold mb-2">Criar Cliente Rápido</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nome *"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <div>
                <input
                  type="text"
                  placeholder="CPF (opcional) (000.000.000-00)"
                  value={createForm.cpf}
                  onChange={(e) => {
                    const masked = maskCPF(e.target.value)
                    setCreateForm({ ...createForm, cpf: masked })
                    // Validar em tempo real apenas se preenchido
                    if (masked.length > 0) {
                      const unmasked = unmaskCPF(masked)
                      if (unmasked.length === 11) {
                        if (!validateCPF(masked)) {
                          setCpfError('CPF inválido')
                        } else {
                          setCpfError(null)
                        }
                      } else if (unmasked.length < 11) {
                        setCpfError(null)
                      }
                    } else {
                      setCpfError(null)
                    }
                  }}
                  maxLength={14}
                  className={`w-full px-3 py-2 border rounded text-sm ${
                    cpfError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {cpfError && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>{cpfError}</span>
                  </div>
                )}
              </div>
              <input
                type="email"
                placeholder="Email (opcional)"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <input
                type="text"
                placeholder="Telefone (opcional) (00) 00000-0000"
                value={createForm.phone}
                onChange={(e) => {
                  const masked = maskPhone(e.target.value)
                  setCreateForm({ ...createForm, phone: masked })
                }}
                maxLength={15}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateCustomer}
                  disabled={createCustomer.isPending || !!cpfError}
                  className="flex-1"
                >
                  {createCustomer.isPending ? 'Criando...' : 'Criar'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setCreateForm({ name: '', cpf: '', email: '', phone: '' })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {showResults && searchQuery.length >= 2 && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="px-5 py-4 text-sm text-gray-500">Buscando...</div>
            ) : customers && customers.length > 0 ? (
              <>
                <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
                    {customers.length} resultado{customers.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <ul className="divide-y divide-gray-100">
                  {customers.map((customer) => (
                    <li
                      key={customer.id}
                      onClick={() => handleSelect(customer)}
                      className="cursor-pointer px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      {customer.email && (
                        <div className="text-xs text-gray-500">{customer.email}</div>
                      )}
                      {customer.phone && (
                        <div className="text-xs text-gray-500">{customer.phone}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="px-5 py-4 text-sm text-gray-500">
                Nenhum cliente encontrado
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

