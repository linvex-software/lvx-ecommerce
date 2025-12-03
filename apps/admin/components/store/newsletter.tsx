'use client'

import { useNode } from '@craftjs/core'
import { useMemo } from 'react'

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
      <div className="text-center max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        {description && <p className="mb-4">{description}</p>}
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Seu e-mail"
            className="flex-1 px-4 py-2 border rounded-md"
            disabled
          />
          {buttonEnabled && (
            <button
              className="px-6 py-2 rounded-md hover:opacity-90 transition-colors"
              style={{ 
                backgroundColor: 'var(--store-primary-color, #000000)',
                color: '#ffffff'
              }}
              disabled
            >
              {buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

Newsletter.craft = {
  displayName: 'Newsletter',
  props: {
    title: 'Receba nossas ofertas',
    description: 'Cadastre-se e receba promoções exclusivas',
    buttonText: 'Cadastrar',
    buttonEnabled: true,
    backgroundColor: '#f3f4f6',
    textColor: '#000000',
    borderRadius: 8,
    padding: 24,
    margin: 0
  },
  related: {
    settings: NewsletterSettings
  }
}

function NewsletterSettings() {
  const {
    actions: { setProp },
    title,
    description,
    buttonText,
    buttonEnabled,
    backgroundColor,
    textColor,
    borderRadius,
    padding,
    margin
  } = useNode((node) => ({
    title: node.data.props.title || 'Receba nossas ofertas',
    description: node.data.props.description || 'Cadastre-se e receba promoções exclusivas',
    buttonText: node.data.props.buttonText || 'Cadastrar',
    buttonEnabled: node.data.props.buttonEnabled ?? true,
    backgroundColor: node.data.props.backgroundColor || '#f3f4f6',
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
            setProp((props: NewsletterProps) => (props.title = e.target.value))
          }
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Descrição</label>
        <input
          type="text"
          value={description}
          onChange={(e) =>
            setProp(
              (props: NewsletterProps) => (props.description = e.target.value)
            )
          }
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Texto do Botão</label>
        <input
          type="text"
          value={buttonText}
          onChange={(e) =>
            setProp(
              (props: NewsletterProps) => (props.buttonText = e.target.value)
            )
          }
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={buttonEnabled}
            onChange={(e) =>
              setProp(
                (props: NewsletterProps) =>
                  (props.buttonEnabled = e.target.checked)
              )
            }
          />
          <span className="text-sm">Botão habilitado</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Cor de Fundo
        </label>
        <select
          value={backgroundColor}
          onChange={(e) =>
            setProp(
              (props: NewsletterProps) =>
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
              (props: NewsletterProps) => (props.textColor = e.target.value)
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
              (props: NewsletterProps) =>
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
              (props: NewsletterProps) => (props.padding = Number(e.target.value))
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
              (props: NewsletterProps) => (props.margin = Number(e.target.value))
            )
          }
          className="w-full"
        />
      </div>
    </div>
  )
}

