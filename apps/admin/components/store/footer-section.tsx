'use client'

import { useNode } from '@craftjs/core'
import { useMemo } from 'react'

interface FooterSectionProps {
  title?: string
  links?: Array<{ label: string; url: string }>
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

export function FooterSection({
  title = 'Links Úteis',
  links = [
    { label: 'Sobre nós', url: '/sobre' },
    { label: 'Contato', url: '/contato' },
    { label: 'Política de Privacidade', url: '/privacidade' }
  ],
  backgroundColor = '#1f2937',
  textColor = '#ffffff',
  borderRadius = 0,
  padding = 24,
  margin = 0
}: FooterSectionProps) {
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
      {title && <h3 className="font-bold mb-4">{title}</h3>}
      <ul className="space-y-2">
        {links.map((link, index) => (
          <li key={index}>
            <a
              href={link.url}
              className="hover:underline"
              onClick={(e) => {
                // No editor, prevenir navegação
                if (isActive) {
                  e.preventDefault()
                }
              }}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

FooterSection.craft = {
  displayName: 'Seção de Rodapé',
  props: {
    title: 'Links Úteis',
    links: [
      { label: 'Sobre nós', url: '/sobre' },
      { label: 'Contato', url: '/contato' },
      { label: 'Política de Privacidade', url: '/privacidade' }
    ],
    backgroundColor: '#1f2937',
    textColor: '#ffffff',
    borderRadius: 0,
    padding: 24,
    margin: 0
  },
  related: {
    settings: FooterSectionSettings
  }
}

function FooterSectionSettings() {
  const {
    actions: { setProp },
    title,
    backgroundColor,
    textColor,
    borderRadius,
    padding,
    margin
  } = useNode((node) => ({
    title: node.data.props.title || 'Links Úteis',
    backgroundColor: node.data.props.backgroundColor || '#1f2937',
    textColor: node.data.props.textColor || '#ffffff',
    borderRadius: node.data.props.borderRadius ?? 0,
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
            setProp((props: FooterSectionProps) => (props.title = e.target.value))
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
              (props: FooterSectionProps) =>
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
              (props: FooterSectionProps) => (props.textColor = e.target.value)
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
              (props: FooterSectionProps) =>
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
              (props: FooterSectionProps) => (props.padding = Number(e.target.value))
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
              (props: FooterSectionProps) => (props.margin = Number(e.target.value))
            )
          }
          className="w-full"
        />
      </div>
    </div>
  )
}

