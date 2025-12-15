'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  CustomerAddress,
} from '@/lib/hooks/use-addresses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2, MapPin } from 'lucide-react'
import { AccountBreadcrumb } from '@/components/account/AccountBreadcrumb'
import { AccountNavMenu } from '@/components/account/AccountNavMenu'

export default function EnderecosPage() {
  const { data: addresses, isLoading } = useAddresses()
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()
  const deleteAddress = useDeleteAddress()
  const setDefaultAddress = useSetDefaultAddress()

  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    is_default: false,
  })

  const handleCreate = () => {
    setIsCreating(true)
    setEditingId(null)
    setFormData({
      street: '',
      city: '',
      state: '',
      zip: '',
      is_default: false,
    })
  }

  const handleEdit = (address: CustomerAddress) => {
    setEditingId(address.id)
    setIsCreating(false)
    setFormData({
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
      is_default: address.is_default,
    })
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    setFormData({
      street: '',
      city: '',
      state: '',
      zip: '',
      is_default: false,
    })
  }

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value)
    setFormData({ ...formData, zip: formatted })
  }

  const handleCepBlur = async () => {
    const cep = formData.zip.replace(/\D/g, '')

    if (cep.length !== 8) {
      return
    }

    setIsLoadingCep(true)

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (data.erro) {
        return
      }

      setFormData(prev => ({
        ...prev,
        street: data.logradouro || prev.street,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }))
    } catch (error) {
      // Erro silencioso
    } finally {
      setIsLoadingCep(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedZip = formData.zip.replace(/\D/g, '')

    if (editingId) {
      updateAddress.mutate(
        {
          id: editingId,
          ...formData,
          zip: normalizedZip,
        },
        {
          onSuccess: () => {
            handleCancel()
          },
        }
      )
    } else {
      createAddress.mutate(
        {
          ...formData,
          zip: normalizedZip,
        },
        {
          onSuccess: () => {
            handleCancel()
          },
        }
      )
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este endereço?')) {
      deleteAddress.mutate(id)
    }
  }

  const handleSetDefault = (id: string) => {
    setDefaultAddress.mutate(id)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <AccountBreadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Área do Cliente', href: '/minha-conta' },
                { label: 'Gestão de Endereços' },
              ]}
            />
            <div className="flex flex-col lg:flex-row gap-6 mt-6 lg:mt-0 pt-16 lg:pt-0">
              <AccountNavMenu />
              <div className="flex-1">
                <p>Carregando...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-6">
            <AccountNavMenu />
            
            <div className="flex-1">
              <div className="flex justify-center mb-6">
                <AccountBreadcrumb
                  items={[
                    { label: 'Home', href: '/' },
                    { label: 'Área do Cliente', href: '/minha-conta' },
                    { label: 'Gestão de Endereços' },
                  ]}
                />
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Gestão de Endereços</h1>
                  {!isCreating && !editingId && (
                    <Button onClick={handleCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Endereço
                    </Button>
                  )}
                </div>

                {/* Formulário de criar/editar */}
                {(isCreating || editingId) && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                    <h2 className="text-lg font-semibold mb-4">
                      {editingId ? 'Editar Endereço' : 'Novo Endereço'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="zip">CEP *</Label>
                          <div className="relative">
                            <Input
                              id="zip"
                              type="text"
                              placeholder="00000-000"
                              value={formData.zip}
                              onChange={handleCepChange}
                              onBlur={handleCepBlur}
                              className="mt-1"
                              required
                              disabled={isLoadingCep}
                              maxLength={9}
                            />
                            {isLoadingCep && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-1">
                                <span className="h-4 w-4 block rounded-full border-2 border-t-transparent border-primary animate-spin"></span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="state">Estado (UF) *</Label>
                          <Input
                            id="state"
                            type="text"
                            placeholder="SP"
                            maxLength={2}
                            value={formData.state}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                state: e.target.value.toUpperCase(),
                              })
                            }
                            className="mt-1"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="city">Cidade *</Label>
                        <Input
                          id="city"
                          type="text"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="street">Rua e Número *</Label>
                        <Input
                          id="street"
                          type="text"
                          placeholder="Rua Exemplo, 123"
                          value={formData.street}
                          onChange={(e) =>
                            setFormData({ ...formData, street: e.target.value })
                          }
                          className="mt-1"
                          required
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          id="is_default"
                          type="checkbox"
                          checked={formData.is_default}
                          onChange={(e) =>
                            setFormData({ ...formData, is_default: e.target.checked })
                          }
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <Label htmlFor="is_default" className="ml-2">
                          Definir como endereço padrão
                        </Label>
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <Button variant="outline" type="button" onClick={handleCancel}>
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={createAddress.isPending || updateAddress.isPending}
                        >
                          {createAddress.isPending || updateAddress.isPending
                            ? 'Salvando...'
                            : editingId
                              ? 'Atualizar'
                              : 'Adicionar'}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Lista de endereços */}
                {addresses && addresses.length > 0 ? (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className="bg-gray-50 rounded-lg border border-gray-200 p-6"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {address.is_default && (
                                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                  Padrão
                                </span>
                              )}
                              <MapPin className="h-4 w-4 text-gray-400" />
                            </div>
                            <p className="font-semibold text-gray-900">{address.street}</p>
                            <p className="text-gray-600">
                              {address.city}, {address.state}
                            </p>
                            <p className="text-gray-600">CEP: {address.zip}</p>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            {!address.is_default && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetDefault(address.id)}
                                disabled={setDefaultAddress.isPending}
                              >
                                Definir como padrão
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(address)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(address.id)}
                              disabled={deleteAddress.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  !isCreating && (
                    <div className="text-center py-12">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Você ainda não tem endereços cadastrados</p>
                      <Button onClick={handleCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Primeiro Endereço
                      </Button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
