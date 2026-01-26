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
  { value: '#ffffff', name: 'Branco' },
  { value: '#000000', name: 'Preto' },
  { value: '#f3f4f6', name: 'Cinza Claro' },
  { value: '#1f2937', name: 'Cinza Escuro' },
  { value: '#3b82f6', name: 'Azul' },
  { value: '#10b981', name: 'Verde' },
  { value: '#f59e0b', name: 'Laranja' },
  { value: '#ef4444', name: 'Vermelho' }
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
    const colorExists = ALLOWED_COLORS.some(c => c.value === backgroundColor)
    return colorExists
      ? backgroundColor
      : ALLOWED_COLORS[0].value
  }, [backgroundColor])

  const safeTextColor = useMemo(() => {
    const colorExists = ALLOWED_COLORS.some(c => c.value === textColor)
    return colorExists ? textColor : ALLOWED_COLORS[1].value
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
    items,
    backgroundColor,
    textColor,
    borderRadius,
    padding,
    margin
  } = useNode((node) => ({
    title: node.data.props.title || 'Perguntas Frequentes',
    items: node.data.props.items || [],
    backgroundColor: node.data.props.backgroundColor || '#ffffff',
    textColor: node.data.props.textColor || '#000000',
    borderRadius: node.data.props.borderRadius ?? 8,
    padding: node.data.props.padding ?? 24,
    margin: node.data.props.margin ?? 0
  }))

  const handleAddItem = () => {
    setProp((props: FAQProps) => {
      const currentItems = props.items || []
      props.items = [...currentItems, { question: 'Nova pergunta', answer: 'Nova resposta' }]
    })
  }

  const handleRemoveItem = (index: number) => {
    setProp((props: FAQProps) => {
      const currentItems = props.items || []
      props.items = currentItems.filter((_: FAQItem, i: number) => i !== index)
    })
  }

  const handleUpdateItem = (index: number, field: 'question' | 'answer', value: string) => {
    setProp((props: FAQProps) => {
      const currentItems = props.items || []
      const newItems = [...currentItems]
      newItems[index] = { ...newItems[index], [field]: value }
      props.items = newItems
    })
  }

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
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Perguntas e Respostas</label>
          <button
            type="button"
            onClick={handleAddItem}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + Adicionar
          </button>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {items.map((item: FAQItem, index: number) => (
            <div key={index} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Item {index + 1}</span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remover
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Pergunta</label>
                <input
                  type="text"
                  value={item.question}
                  onChange={(e) => handleUpdateItem(index, 'question', e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded-md"
                  placeholder="Digite a pergunta"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Resposta</label>
                <textarea
                  value={item.answer}
                  onChange={(e) => handleUpdateItem(index, 'answer', e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded-md resize-y min-h-[60px]"
                  placeholder="Digite a resposta"
                  rows={3}
                />
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              Nenhum item adicionado. Clique em "Adicionar" para criar o primeiro.
            </div>
          )}
        </div>
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
            <option key={color.value} value={color.value}>
              {color.value} ({color.name})
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
            <option key={color.value} value={color.value}>
              {color.value} ({color.name})
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

