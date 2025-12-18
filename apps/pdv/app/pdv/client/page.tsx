'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, UserPlus, ArrowRight, X } from 'lucide-react'
import { Button } from '@white-label/ui'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { StepProgress } from '@/components/pdv/step-progress'
import { usePDV } from '@/context/pdv-context'
import { useSearchCustomers, useCreateCustomer, type Customer } from '@/lib/hooks/use-customers'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { maskCPF, unmaskCPF, maskPhone, unmaskPhone, validateCPF } from '@/lib/utils/masks'
import toast from 'react-hot-toast'
import { AlertCircle } from 'lucide-react'

export default function ClientStepPage() {
  const router = useRouter()
  const { state, setCustomer, setCurrentStep } = usePDV()
  const [searchQuery, setSearchQuery] = useState('')
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
    setCustomer(customer)
    toast.success('Cliente selecionado')
  }

  const handleCreateCustomer = async () => {
    if (!createForm.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    let cpfUnmasked: string | null = null
    if (createForm.cpf && createForm.cpf.trim()) {
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
      const payload: any = {
        name: createForm.name.trim(),
      }
      
      // Só incluir CPF se preenchido
      if (cpfUnmasked) {
        payload.cpf = cpfUnmasked
      }
      
      // Só incluir email se preenchido
      if (createForm.email && createForm.email.trim()) {
        payload.email = createForm.email.trim()
      }
      
      // Só incluir telefone se preenchido
      if (createForm.phone) {
        payload.phone = unmaskPhone(createForm.phone)
      }

      const customer = await createCustomer.mutateAsync(payload)
      setCustomer(customer)
      setShowCreateForm(false)
      setCreateForm({ name: '', cpf: '', email: '', phone: '' })
      setCpfError(null)
      setSearchQuery('')
      toast.success('Cliente criado com sucesso')
    } catch (error: any) {
      // Melhorar tratamento de erro para mostrar detalhes de validação
      const errorData = error.response?.data
      if (errorData?.details && Array.isArray(errorData.details)) {
        // Erros de validação do Zod
        const errorMessages = errorData.details.map((err: any) => {
          const field = err.path?.join('.') || 'campo'
          return `${field}: ${err.message}`
        })
        toast.error(`Erro de validação: ${errorMessages.join(', ')}`)
      } else if (errorData?.error) {
        toast.error(errorData.error)
      } else {
        toast.error('Erro ao criar cliente')
      }
      console.error('Erro ao criar cliente:', error.response?.data || error)
    }
  }

  const handleContinue = () => {
    if (!state.customer) {
      toast.error('Selecione ou crie um cliente para continuar')
      return
    }
    setCurrentStep('vendor')
    router.push('/pdv/vendor')
  }

  const handleClear = () => {
    setCustomer(null)
    setSearchQuery('')
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <StepProgress currentStep="client" />

      <div className="p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Selecionar Cliente
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Busque um cliente existente ou crie um novo</p>
        </div>

        {/* Cliente Selecionado */}
        {state.customer && (
          <Card className="mb-6 border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                    {state.customer.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{state.customer.name}</p>
                    {state.customer.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{maskPhone(state.customer.phone)}</p>
                    )}
                    {state.customer.cpf && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">CPF: {maskCPF(state.customer.cpf)}</p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleClear}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Busca de Cliente */}
        <Card className="mb-4 shadow-sm border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar cliente por nome, CPF ou telefone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="h-12"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Criar</span>
                </Button>
              </div>

              {/* Resultados da Busca */}
              {searchQuery.length >= 2 && (
                <div className="border border-gray-200 rounded-lg bg-white max-h-60 overflow-y-auto">
                  {isLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Buscando...</div>
                  ) : customers && customers.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {customers.map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => handleSelect(customer)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          {customer.email && (
                            <div className="text-xs text-gray-500">{customer.email}</div>
                          )}
                          {customer.phone && (
                            <div className="text-xs text-gray-500">{customer.phone}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      Nenhum cliente encontrado
                    </div>
                  )}
                </div>
              )}

              {/* Formulário de Criação */}
              {showCreateForm && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Criar Cliente Rápido</h3>
                  <div className="space-y-3">
                    <Input
                      type="text"
                      placeholder="Nome *"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="h-11"
                    />
                    <div>
                      <Input
                        type="text"
                        placeholder="CPF (opcional) (000.000.000-00)"
                        value={createForm.cpf}
                        onChange={(e) => {
                          const masked = maskCPF(e.target.value)
                          setCreateForm({ ...createForm, cpf: masked })
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
                        className={`h-11 ${cpfError ? 'border-red-500' : ''}`}
                      />
                      {cpfError && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="h-3 w-3" />
                          <span>{cpfError}</span>
                        </div>
                      )}
                    </div>
                    <Input
                      type="email"
                      placeholder="Email (opcional)"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="h-11"
                    />
                    <Input
                      type="text"
                      placeholder="Telefone (opcional) (00) 00000-0000"
                      value={createForm.phone}
                      onChange={(e) => {
                        const masked = maskPhone(e.target.value)
                        setCreateForm({ ...createForm, phone: masked })
                      }}
                      maxLength={15}
                      className="h-11"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateCustomer}
                        disabled={createCustomer.isPending || !!cpfError}
                        className="flex-1"
                      >
                        {createCustomer.isPending ? 'Criando...' : 'Criar Cliente'}
                      </Button>
                      <Button
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
            </div>
          </CardContent>
        </Card>

        {/* Botão Continuar */}
        <Button
          onClick={handleContinue}
          disabled={!state.customer}
          className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all"
          size="lg"
        >
          Continuar para Vendedor
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

