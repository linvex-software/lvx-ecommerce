'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/routing'
import { useState } from 'react'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

const locales = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' }
]

export function LocaleSwitcher() {
  const locale = useLocale()
  const t = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const switchLocale = (newLocale: string) => {
    setIsOpen(false)
    
    // Setar cookie para persistir escolha
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
    
    // Remover o locale atual do pathname e construir novo path
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
    const newPath = `/${newLocale}${pathWithoutLocale}`
    
    // Navegar para nova rota
    router.push(newPath)
  }

  const currentLocale = locales.find(l => l.code === locale) || locales[0]

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
        aria-label={t('language')}
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">{currentLocale.label}</span>
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-32 bg-background border border-border rounded-md shadow-lg z-50">
            <div className="py-1">
              {locales.map((loc) => (
                <button
                  key={loc.code}
                  onClick={() => switchLocale(loc.code)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${
                    locale === loc.code ? 'bg-muted font-medium' : ''
                  }`}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

