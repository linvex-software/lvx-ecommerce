import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Login - LVX Commerce',
  description: 'Acesse o painel administrativo'
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-slate-50 px-4 py-8 sm:py-16">
      <div className="w-full max-w-lg space-y-8 sm:space-y-12">
        {/* Logo e título premium */}
        <div className="text-center space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-5xl sm:text-6xl font-light tracking-tight text-gray-900">
            LVX Commerce
          </h1>
          <p className="text-base sm:text-sm font-light text-gray-600 tracking-wide">
            Painel Administrativo
          </p>
        </div>

        {/* Formulário de login */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

