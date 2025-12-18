import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { products, categories, sizeOptions, colorOptions } from "@/data/products";
import { cn } from "@/lib/utils";

export default function Products() {
  const [searchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = useState("newest");

  const category = searchParams.get("category");
  const filter = searchParams.get("filter");

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (category) {
      result = result.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    // Special filters
    if (filter === "new") {
      result = result.filter((p) => p.isNew);
    } else if (filter === "bestseller") {
      result = result.filter((p) => p.isBestSeller);
    } else if (filter === "featured") {
      result = result.filter((p) => p.isFeatured);
    }

    // Size filter
    if (selectedSizes.length > 0) {
      result = result.filter((p) => p.sizes.some((s) => selectedSizes.includes(s)));
    }

    // Color filter
    if (selectedColors.length > 0) {
      result = result.filter((p) => p.colors.some((c) => selectedColors.includes(c.name)));
    }

    // Price filter
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [category, filter, selectedSizes, selectedColors, priceRange, sortBy]);

  const pageTitle = category
    ? categories.find((c) => c.id === category)?.name || "Produtos"
    : filter === "new"
    ? "Novidades"
    : filter === "bestseller"
    ? "Mais Vendidos"
    : filter === "featured"
    ? "Looks de Festa"
    : "Todos os Produtos";

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceRange([0, 500]);
  };

  const hasActiveFilters = selectedSizes.length > 0 || selectedColors.length > 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-cream py-12">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: "Produtos", href: "/produtos" }, { label: pageTitle }]} />
          <h1 className="font-display text-4xl lg:text-5xl text-foreground mt-4">{pageTitle}</h1>
          <p className="text-muted-foreground font-body mt-2">
            {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 text-sm font-body tracking-wide uppercase hover:text-primary transition-colors lg:hidden"
          >
            <SlidersHorizontal size={18} />
            Filtros
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                {selectedSizes.length + selectedColors.length}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground hidden sm:block">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border border-border px-4 py-2 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="newest">Mais Recentes</option>
              <option value="price-asc">Menor Preço</option>
              <option value="price-desc">Maior Preço</option>
              <option value="name">Nome A-Z</option>
            </select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside
            className={cn(
              "fixed lg:static inset-0 z-50 lg:z-0 bg-background lg:bg-transparent w-full lg:w-64 flex-shrink-0 transition-transform duration-300 lg:transform-none",
              isFilterOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}
          >
            <div className="h-full lg:h-auto overflow-y-auto p-6 lg:p-0">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <h3 className="font-display text-xl">Filtros</h3>
                <button onClick={() => setIsFilterOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              {/* Categories */}
              <div className="mb-8 hidden lg:block">
                <h4 className="font-display text-lg mb-4">Categorias</h4>
                <ul className="space-y-2">
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <a
                        href={`/produtos?category=${cat.id}`}
                        className={cn(
                          "flex justify-between text-sm font-body py-1 hover:text-primary transition-colors",
                          category === cat.id ? "text-primary font-medium" : "text-muted-foreground"
                        )}
                      >
                        <span>{cat.name}</span>
                        <span>({cat.count})</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sizes */}
              <div className="mb-8">
                <h4 className="font-display text-lg mb-4">Tamanho</h4>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={cn(
                        "w-10 h-10 border text-sm font-body transition-colors",
                        selectedSizes.includes(size)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="mb-8">
                <h4 className="font-display text-lg mb-4">Cor</h4>
                <div className="flex flex-wrap gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => toggleColor(color.name)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        selectedColors.includes(color.name)
                          ? "ring-2 ring-primary ring-offset-2"
                          : "border-border"
                      )}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Limpar Filtros
                </Button>
              )}

              {/* Mobile Apply */}
              <div className="lg:hidden mt-8">
                <Button onClick={() => setIsFilterOpen(false)} className="w-full">
                  Ver {filteredProducts.length} Produto{filteredProducts.length !== 1 ? "s" : ""}
                </Button>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground font-body mb-4">
                  Nenhum produto encontrado com os filtros selecionados.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
