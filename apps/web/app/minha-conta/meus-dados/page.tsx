'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCustomerProfile, useUpdateCustomerProfile } from '@/lib/hooks/use-customer-profile'
import { useAddresses, useUpdateAddress, CustomerAddress } from '@/lib/hooks/use-addresses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AccountBreadcrumb } from '@/components/account/AccountBreadcrumb'
import { AccountNavMenu } from '@/components/account/AccountNavMenu'

const BRAZILIAN_STATES = [
  { value: '', label: 'Selecione' },
  { value: 'AC', label: 'AC' },
  { value: 'AL', label: 'AL' },
  { value: 'AP', label: 'AP' },
  { value: 'AM', label: 'AM' },
  { value: 'BA', label: 'BA' },
  { value: 'CE', label: 'CE' },
  { value: 'DF', label: 'DF' },
  { value: 'ES', label: 'ES' },
  { value: 'GO', label: 'GO' },
  { value: 'MA', label: 'MA' },
  { value: 'MT', label: 'MT' },
  { value: 'MS', label: 'MS' },
  { value: 'MG', label: 'MG' },
  { value: 'PA', label: 'PA' },
  { value: 'PB', label: 'PB' },
  { value: 'PR', label: 'PR' },
  { value: 'PE', label: 'PE' },
  { value: 'PI', label: 'PI' },
  { value: 'RJ', label: 'RJ' },
  { value: 'RN', label: 'RN' },
  { value: 'RS', label: 'RS' },
  { value: 'RO', label: 'RO' },
  { value: 'RR', label: 'RR' },
  { value: 'SC', label: 'SC' },
  { value: 'SP', label: 'SP' },
  { value: 'SE', label: 'SE' },
  { value: 'TO', label: 'TO' },
]

export default function MeusDadosPage() {
  const [activeTab, setActiveTab] = useState('dados')
  const { data: profile, isLoading: isLoadingProfile } = useCustomerProfile()
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateCustomerProfile()
  const { data: addresses, isLoading: isLoadingAddresses } = useAddresses()
  const updateAddress = useUpdateAddress()

  // Dados pessoais
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [successProfile, setSuccessProfile] = useState(false)

  // Endereço
  const [address, setAddress] = useState({
    id: '',
    zip: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  })
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [successAddress, setSuccessAddress] = useState(false)

  // Preencher formulário quando perfil carregar
  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setEmail(profile.email || '')
      setPhone(profile.phone || '')
    }
  }, [profile])

  // Preencher endereço padrão quando endereços carregarem
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddress = addresses.find((addr) => addr.is_default) || addresses[0]
      if (defaultAddress) {
        // Parsear o campo street que pode conter: rua, número, bairro, complemento
        let street = defaultAddress.street
        let number = ''
        let complement = ''
        let neighborhood = ''

        // Tentar extrair número (padrão: "Rua, 123" ou "Rua 123")
        const numberMatch = street.match(/,?\s*(\d+)(?:\s*-\s*([^,]+))?/)
        if (numberMatch) {
          number = numberMatch[1]
          complement = numberMatch[2] || ''
          street = street.replace(numberMatch[0], '').trim()
        }

        // Tentar extrair bairro (padrão: "Bairro: Nome")
        const bairroMatch = street.match(/Bairro:\s*([^,]+)/i)
        if (bairroMatch) {
          neighborhood = bairroMatch[1].trim()
          street = street.replace(bairroMatch[0], '').trim().replace(/,\s*$/, '')
        }
        
        setAddress({
          id: defaultAddress.id,
          zip: defaultAddress.zip,
          street: street,
          number: number,
          complement: complement,
          neighborhood: neighborhood,
          city: defaultAddress.city,
          state: defaultAddress.state,
        })
      }
    }
  }, [addresses])

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value)
    setAddress({ ...address, zip: formatted })
  }

  const handleCepBlur = async () => {
    const cep = address.zip.replace(/\D/g, '')

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

      setAddress({
        ...address,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      })
    } catch (error) {
      // Erro silencioso
    } finally {
      setIsLoadingCep(false)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessProfile(false)

    updateProfile(
      {
        name: name || undefined,
        email: email || null,
        phone: phone || null,
      },
      {
        onSuccess: () => {
          setSuccessProfile(true)
          setTimeout(() => setSuccessProfile(false), 3000)
        },
      }
    )
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessAddress(false)

    if (!address.id) {
      return
    }

    const normalizedZip = address.zip.replace(/\D/g, '')
    const streetParts = [
      address.street,
      address.number,
      address.neighborhood ? `Bairro: ${address.neighborhood}` : '',
      address.complement,
    ].filter(Boolean)

    updateAddress.mutate(
      {
        id: address.id,
        street: streetParts.join(', '),
        city: address.city,
        state: address.state,
        zip: normalizedZip,
      },
      {
        onSuccess: () => {
          setSuccessAddress(true)
          setTimeout(() => setSuccessAddress(false), 3000)
        },
      }
    )
  }

  if (isLoadingProfile || isLoadingAddresses) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start gap-6 pt-16 lg:pt-0">
            <AccountNavMenu />
            
            <div className="flex-1">
              <div className="flex justify-center mb-6">
                <AccountBreadcrumb
                  items={[
                    { label: 'Home', href: '/' },
                    { label: 'Área do Cliente', href: '/minha-conta' },
                    { label: 'Alterar Dados Cadastrais' },
                  ]}
                />
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Alterar Dados Cadastrais</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="dados">Seus dados</TabsTrigger>
              <TabsTrigger value="endereco">Endereço</TabsTrigger>
            </TabsList>

            <TabsContent value="dados">
              {successProfile && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-6">
                  Dados atualizados com sucesso!
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    type="text"
                    value={profile?.cpf || ''}
                    disabled
                    className="mt-1 bg-gray-100"
                  />
                  <p className="mt-1 text-sm text-gray-500">CPF não pode ser alterado</p>
                </div>

                <div>
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Link href="/minha-conta">
                    <Button variant="outline" type="button">
                      CANCELAR
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? 'Alterando...' : 'ALTERAR'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="endereco">
              {successAddress && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-6">
                  Endereço atualizado com sucesso!
                </div>
              )}

              {!address.id ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Você ainda não tem endereços cadastrados</p>
                  <Link href="/minha-conta/enderecos">
                    <Button>Gerenciar Endereços</Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleAddressSubmit} className="space-y-6">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <Label htmlFor="zip">CEP *</Label>
                      <Input
                        id="zip"
                        type="text"
                        placeholder="00000-000"
                        value={address.zip}
                        onChange={handleCepChange}
                        onBlur={handleCepBlur}
                        className="mt-1"
                        required
                        disabled={isLoadingCep}
                        maxLength={9}
                      />
                    </div>
                    <div className="pt-7">
                      <Link
                        href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Não sabe o seu CEP? Consulte Aqui
                      </Link>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="street">Endereço *</Label>
                    <Input
                      id="street"
                      type="text"
                      placeholder="Endereço"
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        type="text"
                        placeholder="Número"
                        value={address.number}
                        onChange={(e) => setAddress({ ...address, number: e.target.value })}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        type="text"
                        placeholder="Complemento"
                        value={address.complement}
                        onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      type="text"
                      placeholder="Bairro"
                      value={address.neighborhood}
                      onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="Cidade"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <select
                      id="state"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                      required
                    >
                      {BRAZILIAN_STATES.map((state) => (
                        <option key={state.value} value={state.value}>
                          {state.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Link href="/minha-conta">
                      <Button variant="outline" type="button">
                        CANCELAR
                      </Button>
                    </Link>
                    <Button type="submit" disabled={updateAddress.isPending}>
                      {updateAddress.isPending ? 'Alterando...' : 'ALTERAR'}
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
