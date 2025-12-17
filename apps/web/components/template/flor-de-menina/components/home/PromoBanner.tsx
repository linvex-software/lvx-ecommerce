'use client'

import Link from "next/link";
import { Button } from "../ui/button";
import { useSafeNode } from "../../lib/hooks/use-safe-node";
import { EditableText } from "../common/editable-text";
import { Element, useNode } from '@craftjs/core';

export function PromoBanner() {
  const { connectors: { connect } } = useSafeNode();
  
  // Obter nodeId do PromoBanner para gerar IDs únicos
  let nodeId = 'node_promo_banner';
  try {
    const node = useNode();
    nodeId = node.id;
  } catch {
    // Não está no contexto do editor
  }

  return (
    <section ref={(ref: HTMLElement | null) => { if (ref) connect(ref) }} className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-wine" />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative container mx-auto px-4 text-center">
        <Element
          id={`${nodeId}_subtitle`}
          is={EditableText}
          tag="span"
          className="inline-block text-xs tracking-[0.4em] uppercase font-body mb-4"
          content="Especial de Natal"
        />
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-primary-foreground mb-6">
          <Element
            id={`${nodeId}_title`}
            is={EditableText}
            tag="span"
            className=""
            content="Até 40% OFF"
          />
        </h2>
        <Element
          id={`${nodeId}_description`}
          is={EditableText}
          tag="p"
          className="text-primary-foreground/80 font-body text-lg mb-8 max-w-lg mx-auto"
          content="Peças selecionadas com descontos exclusivos. Aproveite e renove seu guarda-roupa para as festas."
        />
        <Button asChild size="xl" variant="gold">
          <Link href="/produtos?filter=sale">
            <Element
              id={`${nodeId}_cta`}
              is={EditableText}
              tag="span"
              className=""
              content="Aproveitar Ofertas"
            />
          </Link>
        </Button>
      </div>
    </section>
  );
}

PromoBanner.craft = {
  displayName: 'Promo Banner',
  props: {},
  isCanvas: true,
  rules: {
    canMoveIn: () => false,
    canMoveOut: () => false,
  },
}
