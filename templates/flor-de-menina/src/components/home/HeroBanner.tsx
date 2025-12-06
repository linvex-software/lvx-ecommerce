import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import React from "react";
export function HeroBanner() {
  return (
    <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&h=1080&fit=crop"
          alt="Coleção de Natal"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/70 via-charcoal/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="max-w-xl animate-fade-up">
          <span className="inline-block text-sm tracking-[0.3em] uppercase font-body mb-4">
            Coleção Festas 2024
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
            Elegância em
            <br />
            <span >Vermelho & Branco</span>
          </h2>
          <p className="text-secondary/80 font-body text-base md:text-lg mb-8 max-w-md leading-relaxed">
            Descubra peças exclusivas para brilhar nas festas de fim de ano. Sofisticação e estilo que traduzem a essência feminina.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="xl" variant="gold">
              <Link to="/produtos?filter=featured">Ver Coleção</Link>
            </Button>
            <Button asChild size="xl" variant="elegant">
              <Link to="/produtos">Explorar Tudo</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-secondary/60 text-xs tracking-widest uppercase font-body">Role</span>
        <div className="w-px h-12 bg-gradient-to-b from-secondary/60 to-transparent" />
      </div>
    </section>
  );
}
