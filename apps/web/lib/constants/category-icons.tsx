import {
  Shirt,
  Footprints,
  Glasses,
  Watch,
  ShoppingBag,
  Headphones,
  Laptop,
  Smartphone,
  Home,
  UtensilsCrossed,
  Car,
  Gamepad2,
  Book,
  Music,
  Camera,
  Heart,
  Star,
  Gift,
  Tag,
  Package,
  Box,
  Grid3x3,
  Layers,
  Circle,
  Square,
  Triangle,
  Hexagon
} from 'lucide-react'

export interface CategoryIcon {
  name: string
  value: string
  component: React.ComponentType<{ className?: string }>
}

export const CATEGORY_ICONS: CategoryIcon[] = [
  { name: 'Camisa', value: 'shirt', component: Shirt },
  { name: 'Sapato', value: 'shoe', component: Footprints },
  { name: 'Óculos', value: 'glasses', component: Glasses },
  { name: 'Relógio', value: 'watch', component: Watch },
  { name: 'Bolsa', value: 'bag', component: ShoppingBag },
  { name: 'Fones de Ouvido', value: 'headphones', component: Headphones },
  { name: 'Notebook', value: 'laptop', component: Laptop },
  { name: 'Smartphone', value: 'smartphone', component: Smartphone },
  { name: 'Casa', value: 'home', component: Home },
  { name: 'Utensílios', value: 'utensils', component: UtensilsCrossed },
  { name: 'Carro', value: 'car', component: Car },
  { name: 'Gamepad', value: 'gamepad', component: Gamepad2 },
  { name: 'Livro', value: 'book', component: Book },
  { name: 'Música', value: 'music', component: Music },
  { name: 'Câmera', value: 'camera', component: Camera },
  { name: 'Coração', value: 'heart', component: Heart },
  { name: 'Estrela', value: 'star', component: Star },
  { name: 'Presente', value: 'gift', component: Gift },
  { name: 'Sacola', value: 'shopping-bag', component: ShoppingBag },
  { name: 'Tag', value: 'tag', component: Tag },
  { name: 'Pacote', value: 'package', component: Package },
  { name: 'Caixa', value: 'box', component: Box },
  { name: 'Grid', value: 'grid', component: Grid3x3 },
  { name: 'Camadas', value: 'layers', component: Layers },
  { name: 'Círculo', value: 'circle', component: Circle },
  { name: 'Quadrado', value: 'square', component: Square },
  { name: 'Triângulo', value: 'triangle', component: Triangle },
  { name: 'Hexágono', value: 'hexagon', component: Hexagon }
]

export function getIconComponent(iconValue?: string | null) {
  if (!iconValue) return null
  const icon = CATEGORY_ICONS.find(i => i.value === iconValue)
  return icon ? icon.component : null
}







