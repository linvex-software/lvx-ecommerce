'use client'

import { useMemo, useState } from 'react'

interface NewsletterProps {
  title?: string
  description?: string
  buttonText?: string
  buttonEnabled?: boolean
  backgroundColor?: string
  textColor?: string
  borderRadius?: number
  padding?: number
  margin?: number
}

const ALLOWED_COLORS = [
  '#ffffff',
  '#000000',
  '#f3f4f6',
  '#1f2937',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444'
]

export function Newsletter({
  title = 'Receba nossas ofertas',
  description = 'Cadastre-se e receba promoções exclusivas',
  buttonText = 'Cadastrar',
  buttonEnabled = true,
  backgroundColor = '#f3f4f6',
  textColor = '#000000',
  borderRadius = 8,
  padding = 24,
  margin = 0
}: NewsletterProps) {
  const [email, setEmail] = useState('')

  const safeBackgroundColor = useMemo(() => {
    return ALLOWED_COLORS.includes(backgroundColor)
      ? backgroundColor
      : ALLOWED_COLORS[0]
  }, [backgroundColor])

  const safeTextColor = useMemo(() => {
    return ALLOWED_COLORS.includes(textColor) ? textColor : ALLOWED_COLORS[1]
  }, [textColor])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Implementar lógica de newsletter
    alert('Newsletter cadastrada!')
    setEmail('')
  }

  return (
    <div
      style={{
        backgroundColor: safeBackgroundColor,
        color: safeTextColor,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        margin: `${margin}px 0`
      }}
    >
      <div className="text-center max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        {description && <p className="mb-4">{description}</p>}
        {buttonEnabled && (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-md"
              required
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {buttonText}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}




