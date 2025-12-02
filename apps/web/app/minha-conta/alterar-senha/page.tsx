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

export default function AlterarSenhaPage() {
  const { data: profile } = useCustomerProfile()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Por favor, preencha todos os campos')
      return
    }

    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setIsLoading(true)

    try {
      await fetchAPI('/customers/me/password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha')
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
                    { label: 'Alterar Senha' },
                  ]}
                />
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Alterar Senha</h1>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-6">
              Senha alterada com sucesso!
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email Atual</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ''}
                disabled
                className="mt-1 bg-gray-100"
              />
            </div>

            <div>
              <Label htmlFor="currentPassword">Senha Atual *</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Senha Atual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="newPassword">Nova senha *</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
                required
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirme nova senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Alterando...' : 'ALTERAR SENHA'}
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

