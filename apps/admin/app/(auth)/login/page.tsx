import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Login - Painel Admin',
  description: 'Acesse o painel administrativo'
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4 py-16">
      <div className="w-full max-w-md space-y-12">
        {/* Logo e título premium */}
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-light tracking-tight text-gray-900">
            White Label
          </h1>
          <p className="text-sm font-light text-gray-500 tracking-wide">
            Painel administrativo
          </p>
        </div>
        
        {/* Formulário de login */}
        <LoginForm />
      </div>
    </div>
  )
}

