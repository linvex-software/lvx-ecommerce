'use client'

import { Card } from '@/components/ui/card'
import type { ThemeConfig } from './theme-form'
import type { Banner } from './banner-manager'

interface LivePreviewProps {
  config: ThemeConfig
}

export function LivePreview({ config }: LivePreviewProps) {
  // Aplicar CSS vars dinamicamente
  const style = {
    '--color-primary': config.primaryColor,
    '--color-secondary': config.secondaryColor,
    '--color-background': config.backgroundColor || '#FFFFFF',
    '--color-text': config.textColor || '#000000',
    fontFamily: config.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif'
  } as React.CSSProperties

  const mockProducts = [
    { name: 'Blazer Essential', price: 'R$ 599,00', image: null },
    { name: 'Vestido Aurora', price: 'R$ 399,00', image: null },
    { name: 'Bolsa Luna', price: 'R$ 249,00', image: null }
  ]

  return (
    <Card
      className={`h-full min-h-[600px] overflow-hidden rounded-2xl border-gray-100 shadow-lg lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] ${config.darkMode ? 'dark' : ''}`}
      style={style}
    >
      <div
        className={`h-full overflow-y-auto transition-colors duration-300 ${
          config.darkMode ? 'bg-gray-900' : ''
        }`}
        style={{
          backgroundColor: config.darkMode ? '#111827' : 'var(--color-background)',
          color: config.darkMode ? '#F9FAFB' : 'var(--color-text)'
        }}
      >
        {/* Header */}
        <header
          className={`border-b backdrop-blur-sm transition-colors ${
            config.darkMode
              ? 'border-gray-700/60 bg-gray-800/95'
              : 'border-gray-200/60 bg-white/95'
          }`}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-5">
            <nav className="flex gap-8">
              {['Novidades', 'Feminino', 'Masculino', 'Acessórios'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-sm font-medium transition-colors hover:opacity-70"
                  style={{
                    color: config.darkMode ? '#F9FAFB' : 'var(--color-text)'
                  }}
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>
        </header>

        {/* Hero Banner */}
        {config.banners.find((b) => b.type === 'hero' && b.image_url) && (
          <div className="relative h-64 w-full overflow-hidden bg-gray-100">
            {(() => {
              const heroBanner = config.banners.find((b) => b.type === 'hero' && b.image_url)
              return heroBanner ? (
                <div className="relative h-full w-full">
                  <img
                    src={heroBanner.image_url}
                    alt={heroBanner.title || 'Banner'}
                    className="h-full w-full object-cover"
                  />
                  {(heroBanner.title || heroBanner.subtitle) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="text-center text-white">
                        {heroBanner.title && (
                          <h2 className="text-3xl font-light tracking-wide">
                            {heroBanner.title}
                          </h2>
                        )}
                        {heroBanner.subtitle && (
                          <p className="mt-2 text-sm font-light opacity-90">
                            {heroBanner.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : null
            })()}
          </div>
        )}

        {/* Content */}
        <main className="mx-auto max-w-6xl px-6 py-16">
          {/* Section Title */}
          <div className="mb-12 text-center">
            <h1
              className="text-5xl font-light tracking-tight"
              style={{
                color: config.darkMode ? '#F9FAFB' : 'var(--color-text)'
              }}
            >
              Novidades
            </h1>
            <p
              className="mt-4 text-base font-light opacity-70"
              style={{
                color: config.darkMode ? '#D1D5DB' : 'var(--color-text)'
              }}
            >
              Descubra nossa coleção exclusiva
            </p>
          </div>

          {/* Products Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mockProducts.map((product, index) => (
              <div
                key={index}
                className={`group cursor-pointer overflow-hidden rounded-xl border transition-all hover:shadow-lg ${
                  config.darkMode
                    ? 'border-gray-700/60 bg-gray-800'
                    : 'border-gray-200/60 bg-white'
                }`}
              >
                <div
                  className={`aspect-square w-full overflow-hidden ${
                    config.darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex h-full w-full items-center justify-center">
                    <span
                      className={`text-sm font-semibold ${
                        config.darkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      {product.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3
                    className="text-base font-medium leading-tight text-center"
                    style={{
                      color: config.darkMode ? '#F9FAFB' : 'var(--color-text)'
                    }}
                  >
                    {product.name}
                  </h3>
                  <p
                    className="mt-3 text-lg font-semibold text-center"
                    style={{
                      color: config.darkMode ? '#F9FAFB' : 'var(--color-text)'
                    }}
                  >
                    {product.price}
                  </p>
                  <button
                    className="mt-4 w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition-all hover:opacity-90 flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Secondary Banner */}
          {config.banners.find((b) => b.type === 'secondary' && b.image_url) && (
            <div
              className={`mt-12 h-48 w-full overflow-hidden rounded-xl ${
                config.darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}
            >
              {(() => {
                const secondaryBanner = config.banners.find(
                  (b) => b.type === 'secondary' && b.image_url
                )
                return secondaryBanner ? (
                  <img
                    src={secondaryBanner.image_url}
                    alt={secondaryBanner.title || 'Banner'}
                    className="h-full w-full object-cover"
                  />
                ) : null
              })()}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer
          className={`border-t py-8 transition-colors ${
            config.darkMode
              ? 'border-gray-700/60 bg-gray-800/95'
              : 'border-gray-200/60 bg-white/95'
          }`}
        >
          <div className="mx-auto max-w-6xl px-6 text-center">
            <p
              className={`text-xs font-light ${
                config.darkMode ? 'text-gray-400' : 'opacity-60'
              }`}
            >
              © 2025 White Label E-commerce
            </p>
          </div>
        </footer>
      </div>
    </Card>
  )
}

