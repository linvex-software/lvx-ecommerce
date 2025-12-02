'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useRegister } from '@/lib/hooks/use-register'
import { useCreateAddress } from '@/lib/hooks/use-addresses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion, AnimatePresence } from 'framer-motion'

type Step = 1 | 2 | 3

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

export default function PrimeiroAcessoPage() {
  const router = useRouter()
  const { register, isLoading: isRegistering, error } = useRegister()
  const createAddress = useCreateAddress()
  const [step, setStep] = useState<Step>(1)
  const [direction, setDirection] = useState(1)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  
  // Step 1: Email/CPF
  const [identifier, setIdentifier] = useState('')
  
  // Step 2: Dados pessoais
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  
  // Step 3: Endereço
  const [address, setAddress] = useState({
    zip: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  })
  
  const [formError, setFormError] = useState<string | null>(null)

  const isEmail = identifier.includes('@')
  const normalizedIdentifier = identifier.replace(/\D/g, '')

  const goToStep = (newStep: Step) => {
    setDirection(newStep > step ? 1 : -1)
    setStep(newStep)
  }

  const handleStep1Next = () => {
    if (!identifier) {
      setFormError('Por favor, preencha o campo de e-mail ou CPF')
      return
    }

    const normalized = normalizedIdentifier
    if (!isEmail && normalized.length !== 11) {
      setFormError('CPF deve ter 11 dígitos')
      return
    }

    if (isEmail && !identifier.includes('@')) {
      setFormError('Email inválido')
      return
    }

    setCpf(isEmail ? '' : normalized)
    setFormError(null)
    goToStep(2)
  }

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!name || !cpf || !phone || !password) {
      setFormError('Por favor, preencha todos os campos obrigatórios')
      return
    }

    if (password.length < 6) {
      setFormError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setFormError(null)
    goToStep(3)
  }

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
    setFormError(null)

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (data.erro) {
        setFormError('CEP não encontrado')
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
      setFormError('Erro ao buscar CEP. Preencha manualmente.')
    } finally {
      setIsLoadingCep(false)
    }
  }

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!address.street || !address.city || !address.state || !address.zip || !address.number || !address.neighborhood) {
      setFormError('Por favor, preencha todos os campos obrigatórios do endereço')
      return
    }

    try {
      // 1. Criar usuário e fazer login automático
      await register({
        name,
        cpf,
        email: isEmail ? identifier : null,
        phone: phone.replace(/\D/g, ''),
        password,
      })

      // 2. Criar endereço com o token obtido do registro
      const normalizedZip = address.zip.replace(/\D/g, '')
      const streetParts = [
        address.street,
        address.number,
        address.neighborhood ? `Bairro: ${address.neighborhood}` : '',
        address.complement,
      ].filter(Boolean)
      
      await createAddress.mutateAsync({
        street: streetParts.join(', '),
        city: address.city,
        state: address.state,
        zip: normalizedZip,
        is_default: true,
      })

      router.push('/minha-conta')
    } catch (err: any) {
      setFormError(err.message || 'Erro ao finalizar cadastro')
    }
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    }),
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">
            Primeiro Acesso
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Em poucos segundos você cria sua conta e aproveita todos os benefícios da loja
          </p>
        </div>

        {/* Steps */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              step === 1 ? 'bg-primary text-white' : step > 1 ? 'bg-primary/80 text-white' : 'bg-gray-200'
            }`}>
              {step > 1 ? '✓' : '1'}
            </div>
            <span className="ml-2 text-sm font-medium hidden sm:block">Informações Pessoais</span>
            <span className="ml-2 text-sm font-medium sm:hidden">Pessoais</span>
          </div>
          <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              step === 2 ? 'bg-primary text-white' : step > 2 ? 'bg-primary/80 text-white' : 'bg-gray-200'
            }`}>
              {step > 2 ? '✓' : '2'}
            </div>
            <span className="ml-2 text-sm font-medium">Endereço</span>
          </div>
          <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className={`flex items-center ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              step === 3 ? 'bg-primary text-white' : 'bg-gray-200'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium hidden sm:block">Crie sua conta</span>
            <span className="ml-2 text-sm font-medium sm:hidden">Finalizar</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-6"
              >
                <div>
                  <Label htmlFor="identifier" className="font-bold text-base">
                    Digite seu e-mail ou CPF
                  </Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="seu email ou cpf"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="mt-2"
                    onKeyDown={(e) => e.key === 'Enter' && handleStep1Next()}
                  />
                </div>

                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
                    {formError}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Link href="/login">
                    <Button variant="outline">CANCELAR</Button>
                  </Link>
                  <Button onClick={handleStep1Next}>CONTINUAR</Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                onSubmit={handleStep2Next}
                className="space-y-6"
              >
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nome Completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
                    className="mt-1"
                    maxLength={11}
                    required
                  />
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

                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                    required
                    minLength={6}
                  />
                  <p className="mt-1 text-sm text-gray-500">Mínimo de 6 caracteres</p>
                </div>

                {(error || formError) && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
                    {formError || error}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goToStep(1)}
                  >
                    ANTERIOR
                  </Button>
                  <Button type="submit">
                    PRÓXIMO
                  </Button>
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.form
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                onSubmit={handleStep3Submit}
                className="space-y-6"
              >
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

                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
                    {formError}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goToStep(2)}
                  >
                    ANTERIOR
                  </Button>
                  <Button
                    type="submit"
                    disabled={isRegistering || createAddress.isPending}
                  >
                    {isRegistering || createAddress.isPending
                      ? 'Finalizando...'
                      : 'CRIAR CONTA'}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
