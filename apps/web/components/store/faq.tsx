'use client'

import { useMemo, useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

interface FAQProps {
  title?: string
  items?: FAQItem[]
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

export function FAQ({
  title = 'Perguntas Frequentes',
  items = [
    {
      question: 'Como faço para comprar?',
      answer: 'Basta adicionar os produtos ao carrinho e finalizar a compra.'
    },
    {
      question: 'Qual o prazo de entrega?',
      answer: 'O prazo varia conforme a região, geralmente de 5 a 10 dias úteis.'
    }
  ],
  backgroundColor = '#ffffff',
  textColor = '#000000',
  borderRadius = 8,
  padding = 24,
  margin = 0
}: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

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
      <div className="space-y-2 max-w-2xl mx-auto">
        {items.map((item, index) => (
          <div key={index} className="border rounded-lg overflow-hidden">
            <button
              className="w-full px-4 py-3 text-left font-semibold flex justify-between items-center hover:bg-gray-50 transition-colors"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <span>{item.question}</span>
              <span>{openIndex === index ? '−' : '+'}</span>
            </button>
            {openIndex === index && (
              <div className="px-4 py-3 border-t bg-gray-50">
                <p>{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}






