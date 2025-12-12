import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const locales = ['pt', 'en', 'es'] as const
export const defaultLocale = 'pt' as const

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always'
})

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)

