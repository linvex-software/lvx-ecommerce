'use client'

import { useDesignSettings } from '@/lib/hooks/use-design-settings'
import { HeroBlock } from './HeroBlock'
import { ProductsBlock } from './ProductsBlock'
import { CategoriesBlock } from './CategoriesBlock'
import { BannerBlock } from './BannerBlock'
import { FAQBlock } from './FAQBlock'
import { TextBlock } from './TextBlock'
import { ImageBlock } from './ImageBlock'
import type { Block } from './types'

interface BlockRendererProps {
  blocks: Block[]
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  const { data: designSettings } = useDesignSettings()

  // Filtrar apenas blocos habilitados e ordenar
  const enabledBlocks = blocks
    .filter(block => block.enabled)
    .sort((a, b) => a.order - b.order)

  if (enabledBlocks.length === 0) {
    return null
  }

  return (
    <>
      {enabledBlocks.map((block, index) => {
        const key = `${block.type}-${index}-${block.order}`
        const blockId = `block-${block.type}-${index}`
        const elementStyles = block.elementStyles || {}

        switch (block.type) {
          case 'hero':
            return (
              <div key={key} data-builder-id={blockId}>
                <HeroBlock
                  {...(block.props as any)}
                  designSettings={designSettings?.design_settings}
                  blockId={blockId}
                  elementStyles={elementStyles}
                />
              </div>
            )

          case 'products':
            return (
              <div key={key} data-builder-id={`block-${block.type}-${index}`}>
                <ProductsBlock
                  {...(block.props as any)}
                  blockId={`block-${block.type}-${index}`}
                  elementStyles={elementStyles}
                />
              </div>
            )

          case 'categories':
            return (
              <div key={key} data-builder-id={`block-${block.type}-${index}`}>
                <CategoriesBlock
                  {...(block.props as any)}
                  blockId={`block-${block.type}-${index}`}
                  elementStyles={elementStyles}
                />
              </div>
            )

          case 'banner':
            return (
              <div key={key} data-builder-id={`block-${block.type}-${index}`}>
                <BannerBlock
                  {...(block.props as any)}
                  blockId={`block-${block.type}-${index}`}
                  elementStyles={elementStyles}
                />
              </div>
            )

          case 'faq':
            return (
              <div key={key} data-builder-id={`block-${block.type}-${index}`}>
                <FAQBlock
                  {...(block.props as any)}
                  blockId={`block-${block.type}-${index}`}
                  elementStyles={elementStyles}
                />
              </div>
            )

          case 'text':
            return (
              <div key={key} data-builder-id={`block-${block.type}-${index}`}>
                <TextBlock
                  {...(block.props as any)}
                  blockId={`block-${block.type}-${index}`}
                  elementStyles={elementStyles}
                />
              </div>
            )

          case 'image':
            return (
              <div key={key} data-builder-id={`block-${block.type}-${index}`}>
                <ImageBlock
                  {...(block.props as any)}
                  blockId={`block-${block.type}-${index}`}
                  elementStyles={elementStyles}
                />
              </div>
            )

          default:
            return null
        }
      })}
    </>
  )
}

