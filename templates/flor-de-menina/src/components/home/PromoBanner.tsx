import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function PromoBanner() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-wine" />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative container mx-auto px-4 text-center">
        <span className="inline-block  text-xs tracking-[0.4em] uppercase font-body mb-4">
          Especial de Natal
        </span>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-primary-foreground mb-6">
          Até 40% OFF
        </h2>
        <p className="text-primary-foreground/80 font-body text-lg mb-8 max-w-lg mx-auto">
          Peças selecionadas com descontos exclusivos. 
          Aproveite e renove seu guarda-roupa para as festas.
        </p>
        <Button asChild size="xl" variant="gold">
          <Link to="/produtos?filter=sale">Aproveitar Ofertas</Link>
        </Button>
      </div>
    </section>
  );
}
