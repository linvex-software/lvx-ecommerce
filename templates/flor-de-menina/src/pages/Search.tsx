import { useState, useMemo } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ProductCard } from "@/components/product/ProductCard";
import { products } from "@/data/products";

export default function Search() {
  const [query, setQuery] = useState("");

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery)
    );
  }, [query]);

  const suggestions = ["Vestido", "Conjunto", "Blazer", "Acessórios"];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Busca" }]} />
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* Search Input */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <SearchIcon
              size={24}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O que você está procurando?"
              className="w-full pl-14 pr-12 py-5 border border-border bg-background font-body text-lg focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Suggestions */}
          {!query && (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground mb-3">Sugestões de busca:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuery(suggestion)}
                    className="px-4 py-2 bg-secondary text-sm font-body hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {query && (
          <div>
            <p className="text-muted-foreground font-body mb-8">
              {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""} para "{query}"
            </p>

            {searchResults.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground font-body mb-2">
                  Nenhum produto encontrado para "{query}"
                </p>
                <p className="text-sm text-muted-foreground">
                  Tente usar outros termos ou explore nossas categorias
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {searchResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
