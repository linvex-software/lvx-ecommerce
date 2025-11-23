# Home/PLP (Product Listing Page) - Documentação

## 📋 Visão Geral

Implementação completa da página inicial com listagem de produtos (PLP) para o e-commerce white-label. A página inclui funcionalidades avançadas de filtragem, busca e paginação.

## ✨ Funcionalidades Implementadas

### 1. **Grid de Produtos**
- Layout responsivo com grid adaptativo:
  - Mobile: 1 coluna
  - Tablet (sm): 2 colunas
  - Desktop (xl): 3 colunas
- Cards de produtos com informações detalhadas:
  - Imagem do produto com hover effect
  - Nome e categoria
  - Cores disponíveis (até 4 visíveis)
  - Tamanhos disponíveis
  - Preço
  - Status de estoque (Esgotado, Últimas unidades)
  - Botão de adicionar ao carrinho

### 2. **Sistema de Filtros**

#### Filtro por Categoria
- Checkboxes para selecionar múltiplas categorias
- Categorias disponíveis: Vestuário, Calçados, Acessórios
- Seções colapsáveis para melhor organização

#### Filtro por Preço
- Sliders duplos para definir faixa de preço (min/max)
- Range: R$ 0 - R$ 1000
- Feedback visual em tempo real

#### Filtro por Tamanho
- Botões de seleção múltipla
- Tamanhos: P, M, G, GG, XG, 38-46, Único
- Visual destacado para tamanhos selecionados

#### Filtro por Cor
- Seletor visual com círculos coloridos
- 9 cores disponíveis (Preto, Branco, Cinza, etc.)
- Indicador visual de seleção

### 3. **Busca via Meilisearch (Simulada)**

A busca foi implementada simulando o comportamento do Meilisearch:

- **Debounce de 300ms**: Evita requisições excessivas
- **Busca fuzzy**: Procura em nome, descrição e categoria
- **Feedback visual**: Mostra o termo de busca ativo
- **Botão de limpar**: Remove a busca rapidamente

**Estrutura preparada para integração real:**
```typescript
// Futuro: Substituir por chamada real ao Meilisearch
const searchProducts = async (query: string) => {
  const response = await fetch('/api/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
  return response.json()
}
```

### 4. **Paginação**

- **8 produtos por página**
- Navegação inteligente:
  - Botões Anterior/Próxima
  - Números de página com ellipsis (...)
  - Mantém contexto da página atual
- Contador de resultados
- Reset automático ao mudar filtros

### 5. **Dados Mockados Realistas**

16 produtos com informações completas:
- ID único
- Nome descritivo
- Preço
- Imagem (Unsplash)
- Categoria
- Tamanhos disponíveis (array)
- Cores disponíveis (nome + hex)
- Estoque (com estados: normal, baixo, esgotado)
- Descrição

## 🎨 Design e UX

### Princípios Aplicados

1. **Minimalismo Premium**
   - Espaçamento generoso
   - Tipografia clara e hierárquica
   - Paleta de cores neutra com acentos

2. **Responsividade**
   - Mobile-first approach
   - Filtros colapsáveis em mobile
   - Grid adaptativo

3. **Feedback Visual**
   - Hover effects nos cards
   - Transições suaves
   - Estados de loading (preparado)
   - Badges de estoque (Esgotado, Últimas unidades)

4. **Acessibilidade**
   - Labels descritivos
   - Contraste adequado
   - Navegação por teclado (preparado)

## 📁 Estrutura de Arquivos

```
apps/web/
├── app/
│   └── page.tsx                    # Página principal (PLP)
├── components/
│   ├── ProductCard.tsx             # Card de produto (atualizado)
│   ├── ProductFilters.tsx          # Componente de filtros (NOVO)
│   ├── SearchBar.tsx               # Barra de busca (NOVO)
│   ├── Pagination.tsx              # Paginação (NOVO)
│   ├── Navbar.tsx                  # Navbar existente
│   ├── Cart.tsx                    # Carrinho existente
│   └── ui/
│       ├── button.tsx              # Existente
│       ├── card.tsx                # Existente
│       └── input.tsx               # Input UI (NOVO)
```

## 🔄 Fluxo de Dados

### 1. Estado Global
```typescript
const [filters, setFilters] = useState<FilterState>({
  categories: [],
  priceRange: { min: 0, max: 1000 },
  sizes: [],
  colors: [],
  searchQuery: '',
})
```

### 2. Filtragem (useMemo)
```typescript
const filteredProducts = useMemo(() => {
  // 1. Busca por texto
  // 2. Filtro por categoria
  // 3. Filtro por preço
  // 4. Filtro por tamanho
  // 5. Filtro por cor
  return filtered
}, [filters])
```

### 3. Paginação (useMemo)
```typescript
const paginatedProducts = useMemo(() => {
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
}, [filteredProducts, currentPage])
```

## 🚀 Próximos Passos para Integração Real

### 1. Integração com Meilisearch

```typescript
// lib/meilisearch.ts
import { MeiliSearch } from 'meilisearch'

const client = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST,
  apiKey: process.env.NEXT_PUBLIC_MEILISEARCH_KEY,
})

export const searchProducts = async (query: string, filters: FilterState) => {
  const index = client.index('products')
  
  const results = await index.search(query, {
    filter: [
      filters.categories.length > 0 && `category IN [${filters.categories.join(',')}]`,
      `price >= ${filters.priceRange.min} AND price <= ${filters.priceRange.max}`,
      filters.sizes.length > 0 && `sizes IN [${filters.sizes.join(',')}]`,
      filters.colors.length > 0 && `colors IN [${filters.colors.join(',')}]`,
    ].filter(Boolean),
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
  })
  
  return results
}
```

### 2. Integração com API Backend

```typescript
// lib/hooks/use-products.ts
import { useQuery } from '@tanstack/react-query'

export function useProducts(filters: FilterState, page: number) {
  return useQuery({
    queryKey: ['products', filters, page],
    queryFn: async () => {
      const response = await apiClient.get('/products', {
        params: {
          ...filters,
          page,
          limit: ITEMS_PER_PAGE,
        },
      })
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}
```

### 3. Loading States

```typescript
// Adicionar no componente
const { data, isLoading, error } = useProducts(filters, currentPage)

if (isLoading) return <ProductsSkeleton />
if (error) return <ErrorState />
```

### 4. Lazy Loading (Alternativa à Paginação)

```typescript
// Implementar scroll infinito
const { ref, inView } = useInView()

useEffect(() => {
  if (inView && hasNextPage) {
    fetchNextPage()
  }
}, [inView, hasNextPage])
```

## 🎯 Funcionalidades Adicionais Sugeridas

1. **Ordenação**
   - Menor preço
   - Maior preço
   - Mais vendidos
   - Lançamentos

2. **Visualização**
   - Toggle entre grid/lista
   - Tamanho dos cards (compacto/expandido)

3. **Favoritos**
   - Marcar produtos como favoritos
   - Página de favoritos

4. **Comparação**
   - Selecionar produtos para comparar
   - Modal de comparação

5. **Histórico de Visualização**
   - Produtos recentemente vistos
   - Recomendações baseadas em histórico

## 📊 Métricas de Performance

- **Filtragem**: O(n) - Linear, otimizado com useMemo
- **Paginação**: O(1) - Constante, slice otimizado
- **Busca**: Debounced para reduzir requisições
- **Re-renders**: Minimizados com useCallback e useMemo

## 🔧 Configurações

### Variáveis de Ambiente (Futuro)
```env
NEXT_PUBLIC_MEILISEARCH_HOST=http://localhost:7700
NEXT_PUBLIC_MEILISEARCH_KEY=your_key_here
NEXT_PUBLIC_API_URL=http://localhost:3333
```

### Constantes Configuráveis
```typescript
const ITEMS_PER_PAGE = 8        // Produtos por página
const DEBOUNCE_DELAY = 300      // Delay da busca (ms)
const PRICE_RANGE_MAX = 1000    // Preço máximo do filtro
```

## 🎨 Customização de Cores

As cores dos filtros podem ser facilmente customizadas:

```typescript
const AVAILABLE_COLORS = [
  { name: 'Sua Cor', hex: '#HEXCODE' },
  // ... adicionar mais cores
]
```

## 📱 Responsividade

### Breakpoints
- **Mobile**: < 640px (1 coluna)
- **Tablet**: 640px - 1024px (2 colunas)
- **Desktop**: > 1024px (3 colunas + sidebar)

### Filtros Mobile
- Colapsados por padrão
- Botão toggle para mostrar/ocultar
- Sticky no topo ao scrollar

---

**Desenvolvido seguindo as melhores práticas de Next.js 15, TypeScript e design premium.**
