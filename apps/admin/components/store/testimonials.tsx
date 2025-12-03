'use client'

import { useNode } from '@craftjs/core'
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
  const {
    connectors: { connect, drag },
    isActive
  } = useNode((state) => ({
    isActive: state.events.selected
  }))

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 bg-white/50"
          >
            <div className="flex gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}
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

Testimonials.craft = {
  displayName: 'Depoimentos',
  props: {
    title: 'O que nossos clientes dizem',
    testimonials: [
      { name: 'Cliente 1', text: 'Excelente produto!', rating: 5 },
      { name: 'Cliente 2', text: 'Muito satisfeito!', rating: 5 }
    ],
    backgroundColor: '#ffffff',
    textColor: '#000000',
    borderRadius: 8,
    padding: 24,
    margin: 0
  },
  related: {
    settings: TestimonialsSettings
  }
}

function TestimonialsSettings() {
  const {
    actions: { setProp },
    title,
    testimonials,
    backgroundColor,
    textColor,
    borderRadius,
    padding,
    margin
  } = useNode((node) => ({
    title: node.data.props.title || 'O que nossos clientes dizem',
    testimonials: node.data.props.testimonials || [
      { name: 'Cliente 1', text: 'Excelente produto!', rating: 5 },
      { name: 'Cliente 2', text: 'Muito satisfeito!', rating: 5 }
    ],
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
            setProp((props: TestimonialsProps) => (props.title = e.target.value))
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
              (props: TestimonialsProps) =>
                (props.backgroundColor = e.target.value)
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
            setProp(
              (props: TestimonialsProps) => (props.textColor = e.target.value)
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
              (props: TestimonialsProps) =>
                (props.borderRadius = Number(e.target.value))
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
              (props: TestimonialsProps) => (props.padding = Number(e.target.value))
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
              (props: TestimonialsProps) => (props.margin = Number(e.target.value))
            )
          }
          className="w-full"
        />
      </div>
    </div>
  )
}

