'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCustomerProfile } from '@/lib/hooks/use-customer-profile'
import { fetchAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AccountBreadcrumb } from '@/components/account/AccountBreadcrumb'
import { AccountNavMenu } from '@/components/account/AccountNavMenu'

export default function AlterarEmailPage() {
  const { data: profile } = useCustomerProfile()
  const [newEmail, setNewEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!newEmail || !confirmEmail) {
      setError('Por favor, preencha todos os campos')
      return
    }

    if (newEmail !== confirmEmail) {
      setError('Os emails não coincidem')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError('Email inválido')
      return
    }

    setIsLoading(true)

    try {
      // Usar o endpoint existente de atualização de perfil
      await fetchAPI('/customers/me', {
        method: 'PUT',
        body: JSON.stringify({
          email: newEmail,
        }),
      })

      setSuccess(true)
      setNewEmail('')
      setConfirmEmail('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar email')
    } finally {
      setIsLoading(false)
    }
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
                    { label: 'Alterar E-mail' },
                  ]}
                />
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Alterar E-mail</h1>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-6">
              Email alterado com sucesso!
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="currentEmail">E-mail atual</Label>
              <Input
                id="currentEmail"
                type="email"
                value={profile?.email || ''}
                disabled
                className="mt-1 bg-gray-100"
              />
            </div>

            <div>
              <Label htmlFor="newEmail">Novo e-mail *</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="Novo e-mail"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmEmail">Confirmação do e-mail *</Label>
              <Input
                id="confirmEmail"
                type="email"
                placeholder="Confirmação do e-mail"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Alterando...' : 'ALTERAR E-MAIL'}
            </Button>
          </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

