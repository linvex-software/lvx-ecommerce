'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { getColorWithOpacity, type ColorConfig } from './types'

export interface ComponentStyleProps {
  textColor?: string | ColorConfig | { mobile?: string; tablet?: string; desktop?: string }
  backgroundColor?: string | ColorConfig | { mobile?: string; tablet?: string; desktop?: string }
  useThemeTextColor?: boolean
  useThemeBackgroundColor?: boolean
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

/**
 * Wrapper component que aplica estilos com prioridade correta
 */
export function ComponentWrapper({
  textColor,
  backgroundColor,
  useThemeTextColor = false,
  useThemeBackgroundColor = false,
  className,
  style = {},
  children
}: ComponentStyleProps) {
  const getResponsiveValue = (
    value: string | ColorConfig | { mobile?: string; tablet?: string; desktop?: string } | undefined,
    useTheme: boolean,
    themeVar: string
  ): string | undefined => {
    if (useTheme) {
      return `var(${themeVar})`
    }

    if (!value) return undefined

    if (typeof value === 'object' && !('type' in value) && !('value' in value)) {
      return value.desktop || value.tablet || value.mobile
    }

    if (typeof value === 'object' && 'type' in value && 'value' in value) {
      return getColorWithOpacity(value)
    }

    return value
  }

  const resolvedTextColor = getResponsiveValue(textColor, useThemeTextColor, '--store-text-color')
  const resolvedBackgroundColor = getResponsiveValue(
    backgroundColor,
    useThemeBackgroundColor,
    '--store-background-color'
  )

  const cssVars: React.CSSProperties = {}
  
  if (resolvedTextColor) {
    cssVars['--component-text-color' as any] = resolvedTextColor
  }
  
  if (resolvedBackgroundColor) {
    cssVars['--component-background-color' as any] = resolvedBackgroundColor
  }

  const inlineStyles: React.CSSProperties = {
    ...cssVars,
    ...(resolvedTextColor && { color: resolvedTextColor }),
    ...(resolvedBackgroundColor && { backgroundColor: resolvedBackgroundColor }),
    ...style
  }

  return (
    <div
      className={cn('component-wrapper', className)}
      style={inlineStyles}
      data-editor-style-applied="true"
    >
      {children}
    </div>
  )
}

export function useComponentStyles(
  textColor?: string | ColorConfig,
  backgroundColor?: string | ColorConfig,
  useThemeTextColor = false,
  useThemeBackgroundColor = false
) {
  const getColor = (color: string | ColorConfig | undefined, useTheme: boolean, themeVar: string): string | undefined => {
    if (useTheme) {
      return `var(${themeVar})`
    }
    if (!color) return undefined
    if (typeof color === 'object' && 'type' in color) {
      return getColorWithOpacity(color)
    }
    return color
  }

  return {
    textColor: getColor(textColor, useThemeTextColor, '--store-text-color'),
    backgroundColor: getColor(backgroundColor, useThemeBackgroundColor, '--store-background-color'),
    cssVars: {
      '--component-text-color': getColor(textColor, useThemeTextColor, '--store-text-color'),
      '--component-background-color': getColor(backgroundColor, useThemeBackgroundColor, '--store-background-color')
    } as React.CSSProperties
  }
}




