import { Link } from "react-router-dom";
import React from "react";

const categories = [
  {
    name: "Vestidos",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop",
    href: "/produtos?category=vestidos",
  },
  {
    name: "Conjuntos",
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=800&fit=crop",
    href: "/produtos?category=conjuntos",
  },
  {
    name: "Blazers",
    image: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600&h=800&fit=crop",
    href: "/produtos?category=blazers",
  },
];

export function CategoryBanner() {
  return (
    <section className="py-16 bg-cream">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-primary text-xs tracking-[0.3em] uppercase font-body mb-3 block">
            Categorias
          </span>
          <h2 className="font-display text-3xl lg:text-4xl text-foreground">Explore por Estilo</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.name}
              to={category.href}
              className="group relative aspect-[3/4] overflow-hidden animate-fade-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                <h3 className="font-display text-2xl !text-white mb-2">{category.name}</h3>
                <span className="inline-block text-secondary/80 text-xs tracking-widest uppercase font-body border-b border-gold pb-1 group-hover:border-primary transition-colors">
                  Ver Coleção
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
