export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  description: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Vestido Vermelho Festa",
    price: 389.90,
    originalPrice: 459.90,
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&h=800&fit=crop",
    ],
    category: "Vestidos",
    sizes: ["P", "M", "G", "GG"],
    colors: [{ name: "Vermelho", hex: "#8B1538" }],
    description: "Vestido elegante em tecido premium, perfeito para ocasiões especiais. Corte midi com detalhes sofisticados.",
    isNew: true,
    isFeatured: true,
  },
  {
    id: "2",
    name: "Conjunto Branco Luxo",
    price: 459.90,
    images: [
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=800&fit=crop",
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&h=800&fit=crop",
    ],
    category: "Conjuntos",
    sizes: ["P", "M", "G"],
    colors: [{ name: "Branco", hex: "#FFFFFF" }, { name: "Off-White", hex: "#FAF9F6" }],
    description: "Conjunto sofisticado em linho premium. Ideal para looks de verão com muito estilo.",
    isBestSeller: true,
    isFeatured: true,
  },
  {
    id: "3",
    name: "Blusa Cetim Dourada",
    price: 189.90,
    images: [
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&h=800&fit=crop",
    ],
    category: "Blusas",
    sizes: ["P", "M", "G", "GG"],
    colors: [{ name: "Dourado", hex: "#C5A572" }],
    description: "Blusa em cetim com acabamento premium. Elegância para qualquer ocasião.",
    isNew: true,
  },
  {
    id: "4",
    name: "Saia Midi Plissada",
    price: 249.90,
    images: [
      "https://images.unsplash.com/photo-1583496661160-fb5886a0uj0?w=600&h=800&fit=crop",
    ],
    category: "Saias",
    sizes: ["P", "M", "G"],
    colors: [{ name: "Bege", hex: "#D4C4B0" }, { name: "Preto", hex: "#1A1A1A" }],
    description: "Saia midi plissada em tecido fluido. Versátil e elegante.",
    isBestSeller: true,
  },
  {
    id: "5",
    name: "Vestido Natal Vermelho",
    price: 429.90,
    images: [
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=800&fit=crop",
    ],
    category: "Vestidos",
    sizes: ["P", "M", "G", "GG"],
    colors: [{ name: "Vermelho", hex: "#8B1538" }],
    description: "Vestido especial para festas de fim de ano. Corte clássico com toque moderno.",
    isNew: true,
    isFeatured: true,
  },
  {
    id: "6",
    name: "Blazer Estruturado",
    price: 359.90,
    images: [
      "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600&h=800&fit=crop",
    ],
    category: "Blazers",
    sizes: ["P", "M", "G"],
    colors: [{ name: "Branco", hex: "#FFFFFF" }, { name: "Vermelho", hex: "#8B1538" }],
    description: "Blazer estruturado com corte impecável. Peça-chave para looks sofisticados.",
    isBestSeller: true,
  },
  {
    id: "7",
    name: "Calça Alfaiataria",
    price: 279.90,
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop",
    ],
    category: "Calças",
    sizes: ["36", "38", "40", "42", "44"],
    colors: [{ name: "Preto", hex: "#1A1A1A" }, { name: "Bege", hex: "#D4C4B0" }],
    description: "Calça de alfaiataria com caimento perfeito. Elegância para o dia a dia.",
  },
  {
    id: "8",
    name: "Top Cropped Rendado",
    price: 149.90,
    images: [
      "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&h=800&fit=crop",
    ],
    category: "Blusas",
    sizes: ["P", "M", "G"],
    colors: [{ name: "Branco", hex: "#FFFFFF" }, { name: "Nude", hex: "#E8D5C4" }],
    description: "Top cropped com detalhes em renda. Feminino e delicado.",
    isNew: true,
  },
];

export const categories = [
  { id: "vestidos", name: "Vestidos", count: 24 },
  { id: "conjuntos", name: "Conjuntos", count: 18 },
  { id: "blusas", name: "Blusas", count: 32 },
  { id: "saias", name: "Saias", count: 15 },
  { id: "calcas", name: "Calças", count: 20 },
  { id: "blazers", name: "Blazers", count: 12 },
  { id: "acessorios", name: "Acessórios", count: 28 },
];

export const sizeOptions = ["PP", "P", "M", "G", "GG", "36", "38", "40", "42", "44"];

export const colorOptions = [
  { name: "Vermelho", hex: "#8B1538" },
  { name: "Branco", hex: "#FFFFFF" },
  { name: "Preto", hex: "#1A1A1A" },
  { name: "Bege", hex: "#D4C4B0" },
  { name: "Dourado", hex: "#C5A572" },
  { name: "Rosa", hex: "#F4C2C2" },
  { name: "Nude", hex: "#E8D5C4" },
];
