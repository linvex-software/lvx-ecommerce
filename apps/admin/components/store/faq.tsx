'use client'

import { useNode } from '@craftjs/core'
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
    { question: 'Como faço para comprar?', answer: 'Basta adicionar os produtos ao carrinho e finalizar a compra.' },
    { question: 'Qual o prazo de entrega?', answer: 'O prazo varia conforme a região, geralmente de 5 a 10 dias úteis.' }
  ],
  backgroundColor = '#ffffff',
  textColor = '#000000',
  borderRadius = 8,
  padding = 24,
  margin = 0
}: FAQProps) {
  const {
    connectors: { connect, drag },
    isActive
  } = useNode((state) => ({
    isActive: state.events.selected
  }))

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
      ref={(ref) => {
        if (ref) {
          connect(drag(ref))
        }
      }}
      className={`${isActive ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        backgroundColor: safeBackgroundColor,
        color: safeTextColor,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        margin: `${margin}px 0`
      }}
    >
      {title && <h2 className="text-2xl font-bold mb-6 text-center">{title}</h2>}
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

FAQ.craft = {
  displayName: 'FAQ',
  props: {
    title: 'Perguntas Frequentes',
    items: [
      { question: 'Como faço para comprar?', answer: 'Basta adicionar os produtos ao carrinho e finalizar a compra.' },
      { question: 'Qual o prazo de entrega?', answer: 'O prazo varia conforme a região, geralmente de 5 a 10 dias úteis.' }
    ],
    backgroundColor: '#ffffff',
    textColor: '#000000',
    borderRadius: 8,
    padding: 24,
    margin: 0
  },
  related: {
    settings: FAQSettings
  }
}

function FAQSettings() {
  const {
    actions: { setProp },
    title,
    backgroundColor,
    textColor,
    borderRadius,
    padding,
    margin
  } = useNode((node) => ({
    title: node.data.props.title || 'Perguntas Frequentes',
    backgroundColor: node.data.props.backgroundColor || '#ffffff',
    textColor: node.data.props.textColor || '#000000',
    borderRadius: node.data.props.borderRadius ?? 8,
    padding: node.data.props.padding ?? 24,
    margin: node.data.props.margin ?? 0
  }))

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium mb-1">Título</label>
        <input
          type="text"
          value={title}
          onChange={(e) =>
            setProp((props: FAQProps) => (props.title = e.target.value))
          }
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Cor de Fundo
        </label>
        <select
          value={backgroundColor}
          onChange={(e) =>
            setProp(
              (props: FAQProps) => (props.backgroundColor = e.target.value)
            )
          }
          className="w-full px-3 py-2 border rounded-md"
        >
          {ALLOWED_COLORS.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Cor do Texto</label>
        <select
          value={textColor}
          onChange={(e) =>
            setProp((props: FAQProps) => (props.textColor = e.target.value))
          }
          className="w-full px-3 py-2 border rounded-md"
        >
          {ALLOWED_COLORS.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Border Radius: {borderRadius}px
        </label>
        <input
          type="range"
          min={0}
          max={32}
          value={borderRadius}
          onChange={(e) =>
            setProp(
              (props: FAQProps) => (props.borderRadius = Number(e.target.value))
            )
          }
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Padding: {padding}px
        </label>
        <input
          type="range"
          min={0}
          max={64}
          value={padding}
          onChange={(e) =>
            setProp(
              (props: FAQProps) => (props.padding = Number(e.target.value))
            )
          }
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Margin: {margin}px
        </label>
        <input
          type="range"
          min={0}
          max={64}
          value={margin}
          onChange={(e) =>
            setProp(
              (props: FAQProps) => (props.margin = Number(e.target.value))
            )
          }
          className="w-full"
        />
      </div>
    </div>
  )
}

