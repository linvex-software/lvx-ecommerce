'use client'

import { useDesignSettings } from '@/lib/hooks/use-design-settings'
import { Button } from '@/components/ui/button'
import type { HeroBlockProps } from './types'

interface HeroBlockPropsWithDesign extends HeroBlockProps {
  show_text?: boolean
  show_button?: boolean
  designSettings?: {
    hero_title?: string | null
    hero_subtitle?: string | null
    hero_image?: string | null
  }
  blockId?: string
  elementStyles?: Record<string, any>
}

export function HeroBlock({ 
  title, 
  subtitle, 
  image, 
  cta_text, 
  cta_link,
  overlay_opacity = 0.3,
  show_text = true,
  show_button = true,
  designSettings,
  blockId,
  elementStyles
}: HeroBlockPropsWithDesign) {
  // Usar valores do design settings como fallback
  const finalTitle = title || designSettings?.hero_title || 'Bem-vindo à nossa loja'
  const finalSubtitle = subtitle || designSettings?.hero_subtitle || 'Descubra nossos produtos exclusivos'
  const finalImage = image || designSettings?.hero_image

  if (!finalImage) {
    return null
  }

  return (
    <div className="w-full mb-10 sm:mb-14 relative overflow-hidden flex items-center justify-center bg-muted -mt-px lg:max-h-[800px]">
      <div className="w-full h-full flex items-center justify-center">
        <img
          src={finalImage}
          alt={finalTitle}
          className="w-full h-full object-cover object-center"
        />
      </div>
      
      {/* Overlay com gradiente - apenas se houver texto ou botão */}
      {(show_text || show_button) && (
        <div 
          className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none"
          style={{ opacity: overlay_opacity }}
        />
      )}
      
      {/* Conteúdo do Hero - apenas se show_text ou show_button estiverem ativos */}
      {(show_text || show_button) && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="container mx-auto px-4 text-center">
            {show_text && (
              <>
                <h1 
                  data-builder-id={`${blockId}-title`}
                  className="text-4xl md:text-6xl font-bold mb-4 text-foreground drop-shadow-lg"
                  style={elementStyles?.[`${blockId}-title`]}
                >
                  {finalTitle}
                </h1>
                {finalSubtitle && (
                  <p 
                    data-builder-id={`${blockId}-subtitle`}
                    className="text-lg md:text-xl mb-8 text-foreground/90 drop-shadow-md max-w-2xl mx-auto"
                    style={elementStyles?.[`${blockId}-subtitle`]}
                  >
                    {finalSubtitle}
                  </p>
                )}
              </>
            )}
            {show_button && cta_text && cta_link && (
              <Button
                data-builder-id={`${blockId}-button`}
                size="lg"
                className="bg-foreground text-background hover:bg-accent"
                asChild
                style={elementStyles?.[`${blockId}-button`]}
              >
                <a href={cta_link}>{cta_text}</a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

