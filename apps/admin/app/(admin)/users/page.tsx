'use client'

import { useState } from 'react'
import { Plus, UserPlus, Trash2 } from 'lucide-react'
import { Button } from '@white-label/ui'
import { useUsers, useCreateUser, useDeleteUser, type CreateUserInput } from '@/lib/hooks/use-users'
import { Input } from '@/components/ui/input'

export default function UsersPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState<CreateUserInput>({
    name: '',
    email: '',
    password: '',
    role: 'vendedor'
  })

  const { data, isLoading } = useUsers()
  const createUser = useCreateUser()
  const deleteUser = useDeleteUser()

  const users = data?.users || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createUser.mutateAsync(formData)
      setShowCreateForm(false)
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'vendedor'
      })
    } catch (error) {
      // Erro já tratado no hook
    }
  }

  const handleDelete = async (id: string, userName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) {
      await deleteUser.mutateAsync(id)
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700',
      operador: 'bg-blue-100 text-blue-700',
      vendedor: 'bg-green-100 text-green-700'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-700'
  }

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrador',
      operador: 'Operador',
      vendedor: 'Vendedor'
    }
    return labels[role as keyof typeof labels] || role
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-gray-900">Equipe</h1>
          <p className="mt-2 text-sm font-light text-gray-500">
            Gerencie os usuários da sua loja
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          {showCreateForm ? (
            'Cancelar'
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Novo usuário
            </>
          )}
        </Button>
      </div>

      {/* Formulário de criação */}
      {showCreateForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Criar Novo Usuário</h2>
              <p className="text-sm text-gray-500">Adicione um membro à equipe da loja</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
                  Nome
                </label>
                <Input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
                  Email
                </label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
                  Senha
                </label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
                  Função
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as 'admin' | 'operador' | 'vendedor'
                    })
                  }
                  className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="operador">Operador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuários */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
                  Nome
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
                  Função
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                    Carregando...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                    Nenhum usuário cadastrado
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getRoleBadge(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={deleteUser.isPending}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

