'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Editor, Frame } from '@craftjs/core'
import Navbar from '@/components/Navbar'
import {
  Hero,
  Banner,
  ProductGrid,
  Newsletter,
  Testimonials,
  FAQ,
  FooterSection,
  Categories,
  ProdutosBentoGrid,
  Navbar as NavbarStore
} from '@/components/store'
import { useCartStore } from '@/lib/store/useCartStore'
import { fetchAPI } from '@/lib/api'

// Wrapper para conectar o Navbar ao carrinho
function NavbarWrapper() {
  const { items, openCart } = useCartStore()
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
  
  return <Navbar cartCount={cartCount} onCartClick={openCart} />
}

// Função para remover Navbar do layout do editor
function removeNavbarFromLayout(layout: Record<string, unknown>): Record<string, unknown> {
  if (!layout || typeof layout !== 'object') {
    return layout
  }

  const cleaned = JSON.parse(JSON.stringify(layout)) as Record<string, unknown>
  const nodes = cleaned.nodes as Record<string, unknown> | undefined

  if (!nodes) {
    return cleaned
  }

  // Identificar todos os IDs de nós Navbar
  const navbarIds = new Set<string>()
  
  for (const [nodeId, nodeData] of Object.entries(nodes)) {
    const node = nodeData as Record<string, unknown> | undefined
    if (!node) continue
    
    const type = node.type as Record<string, unknown> | undefined
    const resolvedName = type?.resolvedName as string | undefined
    
    if (resolvedName === 'Navbar') {
      navbarIds.add(nodeId)
    }
  }

  if (navbarIds.size === 0) {
    return cleaned
  }

  // Função recursiva para limpar filhos
  const cleanChildren = (children: string[]): string[] => {
    return children.filter(childId => {
      if (navbarIds.has(childId)) {
        return false
      }
      
      const childNode = nodes[childId] as Record<string, unknown> | undefined
      if (!childNode) return true
      
      const childChildren = childNode.nodes as string[] | undefined
      if (childChildren && Array.isArray(childChildren)) {
        childNode.nodes = cleanChildren(childChildren)
      }
      
      return true
    })
  }

  // Remover nós Navbar
  const cleanedNodes: Record<string, unknown> = {}
  
  for (const [nodeId, nodeData] of Object.entries(nodes)) {
    if (navbarIds.has(nodeId)) {
      continue
    }
    
    const node = nodeData as Record<string, unknown>
    const children = node.nodes as string[] | undefined
    
    if (children && Array.isArray(children)) {
      cleanedNodes[nodeId] = {
        ...node,
        nodes: cleanChildren(children)
      }
    } else {
      cleanedNodes[nodeId] = nodeData
    }
  }

  // Limpar a raiz se necessário
  const rootNodeId = cleaned.ROOT as string | undefined
  if (rootNodeId) {
    if (navbarIds.has(rootNodeId)) {
      // Se a raiz for Navbar, encontrar o primeiro filho que não seja Navbar
      const rootNode = nodes[rootNodeId] as Record<string, unknown> | undefined
      const rootChildren = rootNode?.nodes as string[] | undefined
      
      if (rootChildren && Array.isArray(rootChildren)) {
        const firstNonNavbar = rootChildren.find(id => !navbarIds.has(id))
        if (firstNonNavbar) {
          cleaned.ROOT = firstNonNavbar
        }
      }
    } else {
      // Limpar os filhos da raiz
      const rootNode = nodes[rootNodeId] as Record<string, unknown> | undefined
      const rootChildren = rootNode?.nodes as string[] | undefined
      
      if (rootChildren && Array.isArray(rootChildren)) {
        const cleanedRootChildren = cleanChildren(rootChildren)
        if (cleanedNodes[rootNodeId]) {
          (cleanedNodes[rootNodeId] as Record<string, unknown>).nodes = cleanedRootChildren
        }
      }
    }
  }

  cleaned.nodes = cleanedNodes

  return cleaned
}

const resolver = {
  Hero,
  Banner,
  ProductGrid,
  Newsletter,
  Testimonials,
  FAQ,
  FooterSection,
  Categories,
  ProdutosBentoGrid,
  Navbar: NavbarStore
}

export default function HomePage() {
  const [layoutData, setLayoutData] = useState<Record<string, unknown> | null>(null)
  const [useDefaultLayout, setUseDefaultLayout] = useState(false)

  // Carregar layout do banco (rota pública)
  const { data: layoutResponse, isLoading } = useQuery<{
    layout_json: Record<string, unknown> | null
  }>({
    queryKey: ['store-layout'],
    queryFn: () => fetchAPI('/editor/layout'),
    retry: false,
    refetchOnWindowFocus: false
  })

  useEffect(() => {
    if (layoutResponse?.layout_json) {
      // Remover Navbar do layout antes de salvar
      const cleanedLayout = removeNavbarFromLayout(layoutResponse.layout_json)
      setLayoutData(cleanedLayout)
      setUseDefaultLayout(false)
    } else if (!isLoading && layoutResponse?.layout_json === null) {
      // Se não houver layout salvo, usar layout default
      setUseDefaultLayout(true)
    }
  }, [layoutResponse, isLoading])

  // Layout default caso não tenha layout salvo
  if (useDefaultLayout || (!layoutData && !isLoading)) {
    return (
      <div className="min-h-screen">
        <NavbarWrapper />
        <main className="container mx-auto px-4 py-8">
          <Hero />
          <ProductGrid />
          <Newsletter />
        </main>
      </div>
    )
  }

  // Renderizar layout do editor
  // O Navbar fixo usa o componente antigo, o Navbar do editor usa o componente do store
  return (
    <div className="min-h-screen">
      <NavbarWrapper />
      <main className="overflow-x-hidden">
        <style dangerouslySetInnerHTML={{__html: `
          /* Esconder qualquer Navbar que venha do layout do editor (dentro do main) */
          main .store-navbar-editor,
          main nav.store-navbar-editor,
          main [role="navigation"].store-navbar-editor {
            display: none !important;
          }
        `}} />
        <div className="container mx-auto">
          {layoutData && (
            <Editor enabled={false} resolver={resolver}>
              <Frame data={layoutData as any} />
            </Editor>
          )}
        </div>
      </main>
    </div>
  )
}
