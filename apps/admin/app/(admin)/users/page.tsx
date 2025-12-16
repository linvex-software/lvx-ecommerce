'use client'

import { useState } from 'react'
import { Plus, UserPlus, Trash2, Eye, EyeOff, KeyRound, Ban } from 'lucide-react'
import { Button } from '@white-label/ui'
import { useUsers, useCreateUser, useDeleteUser, useUpdateUserPassword, type CreateUserInput } from '@/lib/hooks/use-users'
import { useAuthStore } from '@/store/auth-store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function UsersPage() {
  const currentUser = useAuthStore((state) => state.user)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string>('')
  const [formData, setFormData] = useState<CreateUserInput>({
    name: '',
    email: '',
    password: '',
    role: 'vendedor'
  })

  // Estados para modal de alteração de senha
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string>('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordModalErrors, setPasswordModalErrors] = useState<{
    newPassword?: string
    confirmPassword?: string
  }>({})

  const { data, isLoading } = useUsers()
  const createUser = useCreateUser()
  const deleteUser = useDeleteUser()
  const updatePassword = useUpdateUserPassword()

  const users = data?.users || []

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value })

    // Validação de senha
    if (value.length > 0 && value.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres.')
    } else {
      setPasswordError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar senha antes de enviar
    if (formData.password.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    try {
      await createUser.mutateAsync(formData)
      setShowCreateForm(false)
      setShowPassword(false)
      setPasswordError('')
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

  const handleOpenPasswordModal = (userId: string, userName: string) => {
    setSelectedUserId(userId)
    setSelectedUserName(userName)
    setNewPassword('')
    setConfirmPassword('')
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setPasswordModalErrors({})
    setShowPasswordModal(true)
  }

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false)
    setSelectedUserId(null)
    setSelectedUserName('')
    setNewPassword('')
    setConfirmPassword('')
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setPasswordModalErrors({})
  }

  const validatePasswordModal = () => {
    const errors: { newPassword?: string; confirmPassword?: string } = {}

    if (!newPassword || newPassword.length < 6) {
      errors.newPassword = 'A senha deve ter pelo menos 6 caracteres.'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirme a nova senha.'
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem.'
    }

    setPasswordModalErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleUpdatePassword = async () => {
    if (!selectedUserId) return

    if (!validatePasswordModal()) {
      return
    }

    try {
      await updatePassword.mutateAsync({
        userId: selectedUserId,
        password: newPassword
      })
      handleClosePasswordModal()
    } catch (error) {
      // Erro já tratado no hook
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
    }
    if (role === 'vendedor') {
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    }
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">Equipe</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Gerencie os usuários que têm acesso ao painel da sua loja.
          </p>
        </div>
        <Button
          onClick={() => {
            setShowCreateForm(!showCreateForm)
            if (showCreateForm) {
              setShowPassword(false)
              setPasswordError('')
              setFormData({
                name: '',
                email: '',
                password: '',
                role: 'vendedor'
              })
            }
          }}
          className="gap-2 w-full sm:w-auto"
        >
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
        <Card className="dark:bg-surface-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Criar novo usuário</CardTitle>
                <CardDescription>Adicione um membro à equipe da sua loja.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-text-primary dark:text-[#CCCCCC]">
                    Nome completo
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo"
                    className="dark:bg-[#111111] dark:border-[#2A2A2A] dark:hover:border-[#3A3A3A] dark:placeholder:text-[#777777]"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-text-primary dark:text-[#CCCCCC]">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="dark:bg-[#111111] dark:border-[#2A2A2A] dark:hover:border-[#3A3A3A] dark:placeholder:text-[#777777]"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {/* Senha */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-text-primary dark:text-[#CCCCCC]">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className={`pr-12 dark:bg-[#111111] dark:border-[#2A2A2A] dark:hover:border-[#3A3A3A] dark:placeholder:text-[#777777] dark:text-white ${passwordError ? 'border-error focus-visible:ring-error' : ''
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      tabIndex={0}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-xs text-error">{passwordError}</p>
                  )}
                </div>

                {/* Função */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-text-primary dark:text-[#CCCCCC]">
                    Função
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        role: value as 'admin' | 'operador' | 'vendedor'
                      })
                    }
                  >
                    <SelectTrigger
                      id="role"
                      className="dark:bg-[#111111] dark:border-[#2A2A2A] dark:hover:border-[#3A3A3A]"
                    >
                      <SelectValue placeholder="Selecione uma função" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-surface-2 dark:border-[#2A2A2A]">
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setShowPassword(false)
                    setPasswordError('')
                    setFormData({
                      name: '',
                      email: '',
                      password: '',
                      role: 'vendedor'
                    })
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createUser.isPending || !!passwordError}
                  className="w-full sm:w-auto"
                >
                  {createUser.isPending ? 'Criando...' : 'Criar usuário'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de usuários */}
      <Card className="dark:bg-surface-2">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="dark:border-[#1D1D1D] hover:bg-transparent">
                <TableHead className="dark:text-[#E0E0E0]">Nome</TableHead>
                <TableHead className="dark:text-[#E0E0E0]">Email</TableHead>
                <TableHead className="dark:text-[#E0E0E0]">Função</TableHead>
                <TableHead className="text-right dark:text-[#E0E0E0]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-text-secondary">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-text-secondary">
                    Nenhum usuário cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user, index) => (
                  <TableRow
                    key={user.id}
                    className="dark:border-[#1D1D1D] dark:hover:bg-[#1A1A1A] even:dark:bg-[#111111]/30"
                  >
                    <TableCell className="font-medium text-text-primary dark:text-white">
                      {user.name}
                    </TableCell>
                    <TableCell className="text-text-secondary dark:text-[#B5B5B5]">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getRoleBadge(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenPasswordModal(user.id, user.name)}
                          disabled={updatePassword.isPending || (currentUser?.role !== 'admin' && currentUser?.id !== user.id)}
                          className="text-text-primary hover:text-primary dark:text-white dark:hover:text-primary"
                        >
                          {currentUser?.role === 'admin' || currentUser?.id === user.id ? (
                            <KeyRound className="h-4 w-4 mr-2" />
                          ) : (
                            <Ban className="h-4 w-4 mr-2" />
                          )}
                          <span className="hidden sm:inline">Gerenciar senha</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id, user.name)}
                          disabled={deleteUser.isPending}
                          className="text-error hover:text-error hover:bg-error/10 dark:text-error dark:hover:bg-error/20"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Excluir</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal de alteração de senha */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="dark:bg-surface-2 dark:border-[#1D1D1D]">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Alterar senha</DialogTitle>
            <DialogDescription className="dark:text-[#B5B5B5]">
              Defina uma nova senha para este usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="dark:text-[#CCCCCC]">
                Nova senha *
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (passwordModalErrors.newPassword) {
                      setPasswordModalErrors({
                        ...passwordModalErrors,
                        newPassword: undefined
                      })
                    }
                  }}
                  placeholder="Digite a nova senha"
                  className={`pr-10 dark:bg-[#111111] dark:border-[#2A2A2A] dark:hover:border-[#3A3A3A] dark:placeholder:text-[#777777] dark:text-white ${passwordModalErrors.newPassword ? 'border-error focus-visible:ring-error' : ''
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded dark:text-white/80 dark:hover:text-white"
                  aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  tabIndex={0}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordModalErrors.newPassword && (
                <p className="text-xs text-error">{passwordModalErrors.newPassword}</p>
              )}
              {!passwordModalErrors.newPassword && newPassword.length > 0 && newPassword.length < 6 && (
                <p className="text-xs text-text-secondary dark:text-[#B5B5B5]">
                  Mínimo 6 caracteres
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="dark:text-[#CCCCCC]">
                Confirmar nova senha *
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (passwordModalErrors.confirmPassword) {
                      setPasswordModalErrors({
                        ...passwordModalErrors,
                        confirmPassword: undefined
                      })
                    }
                  }}
                  placeholder="Repita a nova senha"
                  className={`pr-10 dark:bg-[#111111] dark:border-[#2A2A2A] dark:hover:border-[#3A3A3A] dark:placeholder:text-[#777777] dark:text-white ${passwordModalErrors.confirmPassword ? 'border-error focus-visible:ring-error' : ''
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded dark:text-white/80 dark:hover:text-white"
                  aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  tabIndex={0}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordModalErrors.confirmPassword && (
                <p className="text-xs text-error">{passwordModalErrors.confirmPassword}</p>
              )}
            </div>
          </div>
          <DialogFooter className="dark:border-t-[#1D1D1D]">
            <Button
              type="button"
              variant="outline"
              onClick={handleClosePasswordModal}
              disabled={updatePassword.isPending}
              className="dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:hover:bg-[#1A1A1A]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUpdatePassword}
              disabled={
                updatePassword.isPending ||
                !newPassword ||
                !confirmPassword ||
                Object.keys(passwordModalErrors).length > 0 ||
                newPassword.length < 6 ||
                newPassword !== confirmPassword
              }
            >
              {updatePassword.isPending ? 'Salvando...' : 'Salvar nova senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
