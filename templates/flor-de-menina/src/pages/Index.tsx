import { HeroBanner } from "@/components/home/HeroBanner";
import { ProductShowcase } from "@/components/home/ProductShowcase";
import { CategoryBanner } from "@/components/home/CategoryBanner";
import { PromoBanner } from "@/components/home/PromoBanner";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import { products } from "@/data/products";

const Index = () => {
  const newProducts = products.filter((p) => p.isNew);
  const bestSellers = products.filter((p) => p.isBestSeller);
  const featuredProducts = products.filter((p) => p.isFeatured);

  return (
    <>
      <HeroBanner />

      <ProductShowcase
        title="Novidades"
        subtitle="Acabaram de Chegar"
        products={newProducts.slice(0, 4)}
        viewAllLink="/produtos?filter=new"
      />

      <CategoryBanner />

      <ProductShowcase
        title="Mais Vendidos"
        subtitle="Favoritos das Clientes"
        products={bestSellers.slice(0, 4)}
        viewAllLink="/produtos?filter=bestseller"
      />

      <PromoBanner />

      <ProductShowcase
        title="Looks de Festa"
        subtitle="Natal & Réveillon"
        products={featuredProducts.slice(0, 4)}
        viewAllLink="/produtos?filter=featured"
      />

      <InstagramFeed />
    </>
  );
};

export default Index;
