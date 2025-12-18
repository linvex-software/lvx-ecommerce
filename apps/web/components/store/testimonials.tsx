'use client'

import { useMemo } from 'react'

interface Testimonial {
  name: string
  text: string
  rating: number
}

interface TestimonialsProps {
  title?: string
  testimonials?: Testimonial[]
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

export function Testimonials({
  title = 'O que nossos clientes dizem',
  testimonials = [
    { name: 'Cliente 1', text: 'Excelente produto!', rating: 5 },
    { name: 'Cliente 2', text: 'Muito satisfeito!', rating: 5 }
  ],
  backgroundColor = '#ffffff',
  textColor = '#000000',
  borderRadius = 8,
  padding = 24,
  margin = 0
}: TestimonialsProps) {
  const safeBackgroundColor = useMemo(() => {
    return ALLOWED_COLORS.includes(backgroundColor)
      ? backgroundColor
      : ALLOWED_COLORS[0]
  }, [backgroundColor])

  const safeTextColor = useMemo(() => {
    return ALLOWED_COLORS.includes(textColor) ? textColor : ALLOWED_COLORS[1]
  }, [textColor])

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
      {title && (
        <h2 className="text-2xl font-bold mb-6 text-center">{title}</h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="border rounded-lg p-4 bg-white/50">
            <div className="flex gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={
                    i < testimonial.rating
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }
                >
                  ★
                </span>
              ))}
            </div>
            <p className="mb-2">{testimonial.text}</p>
            <p className="text-sm font-semibold">— {testimonial.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}









