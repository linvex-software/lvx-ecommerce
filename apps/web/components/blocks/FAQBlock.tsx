'use client'

import { useState } from 'react'
import type { FAQBlockProps } from './types'

interface FAQBlockPropsWithStyles extends FAQBlockProps {
  blockId?: string
  elementStyles?: Record<string, any>
}

export function FAQBlock({
  title = 'Perguntas Frequentes',
  items = [],
  blockId,
  elementStyles
}: FAQBlockPropsWithStyles) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (!items || items.length === 0) {
    return null
  }

  return (
    <section
      id={blockId}
      className="py-12 px-4"
      style={elementStyles}
    >
      <div className="container mx-auto max-w-3xl">
        {title && (
          <h2 className="text-2xl font-bold mb-6 text-center">{title}</h2>
        )}
        <div className="space-y-4">
          {items.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium">{faq.question}</span>
                <span className="text-gray-400">
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>
              {openIndex === index && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

