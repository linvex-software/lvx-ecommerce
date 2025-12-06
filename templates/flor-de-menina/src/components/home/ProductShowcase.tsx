import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Product } from "@/data/products";

interface ProductShowcaseProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllLink?: string;
  viewAllText?: string;
}

export function ProductShowcase({
  title,
  subtitle,
  products,
  viewAllLink,
  viewAllText = "Ver Todos",
}: ProductShowcaseProps) {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          {subtitle && (
            <span className="text-primary text-xs tracking-[0.3em] uppercase font-body mb-3 block">
              {subtitle}
            </span>
          )}
          <h2 className="font-display text-3xl lg:text-4xl text-foreground mb-4">{title}</h2>
          <div className="w-20 h-0.5 bg-gold mx-auto" />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* View All */}
        {viewAllLink && (
          <div className="text-center mt-12">
            <Link
              to={viewAllLink}
              className="inline-flex items-center gap-2 text-foreground font-body text-sm tracking-wider uppercase hover:text-primary transition-colors group"
            >
              {viewAllText}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
