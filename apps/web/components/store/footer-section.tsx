'use client'

import { useMemo } from 'react'
import Link from 'next/link'

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
      {title && <h3 className="font-bold mb-4">{title}</h3>}
      <ul className="space-y-2">
        {links.map((link, index) => (
          <li key={index}>
            <Link href={link.url} className="hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}




