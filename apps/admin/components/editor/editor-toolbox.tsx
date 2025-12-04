'use client'

import { useEditor } from '@craftjs/core'
import { useState } from 'react'
import { Search, ChevronRight } from 'lucide-react'
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
  Navbar
} from '@/components/store'

// Componentes organizados por tipo
const basicComponents = [
  { name: 'Hero', component: Hero },
  { name: 'Banner', component: Banner },
  { name: 'Categorias', component: Categories }
]

const productComponents = [
  { name: 'Grade de Produtos', component: ProductGrid },
  { name: 'Produtos BentoGrid', component: ProdutosBentoGrid }
]

const contentComponents = [
  { name: 'Newsletter', component: Newsletter },
  { name: 'Depoimentos', component: Testimonials },
  { name: 'FAQ', component: FAQ }
]

const layoutComponents = [
  { name: 'Navbar', component: Navbar },
  { name: 'Seção de Rodapé', component: FooterSection }
]

const sections = [
  { 
    name: 'Básicos', 
    expanded: true, 
    components: basicComponents 
  },
  { 
    name: 'Produtos', 
    expanded: false, 
    components: productComponents 
  },
  { 
    name: 'Conteúdo', 
    expanded: false, 
    components: contentComponents 
  },
  { 
    name: 'Layout', 
    expanded: false, 
    components: layoutComponents 
  }
]

// Todos os componentes para busca
const allComponents = [
  ...basicComponents,
  ...productComponents,
  ...contentComponents,
  ...layoutComponents
]

export function EditorToolbox() {
  const { connectors, enabled } = useEditor((state) => ({
    enabled: state.options.enabled
  }))
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Básicos': true,
    'Produtos': false,
    'Conteúdo': false,
    'Layout': false
  })
  const [searchQuery, setSearchQuery] = useState('')

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }))
  }

  if (!connectors) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto h-full">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Componentes</h2>
        </div>
      </div>
    )
  }

  if (!enabled) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto h-full">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Componentes</h2>
        </div>
      </div>
    )
  }

  const filteredComponents = allComponents.filter(comp =>
    comp.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto h-full flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search Widget"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent"
          />
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery ? (
          // Modo busca: mostrar todos os componentes filtrados
          filteredComponents.length > 0 ? (
            <div className="p-3 grid grid-cols-2 gap-2 bg-gray-50">
              {filteredComponents.map(({ name, component: Component }) => (
                <div
                  key={name}
                  ref={(ref) => {
                    if (ref && connectors && enabled) {
                      connectors.create(ref, <Component />)
                    }
                  }}
                  className="p-2.5 bg-white border border-gray-200 rounded-md cursor-move hover:border-[#7c3aed] hover:shadow-sm transition-all group"
                >
                  <div className="text-xs font-medium text-gray-700 text-center leading-tight group-hover:text-[#7c3aed]">
                    {name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              Nenhum componente encontrado
            </div>
          )
        ) : (
          // Modo normal: mostrar por seções
          sections.map((section) => {
            const isExpanded = expandedSections[section.name]

            return (
              <div key={section.name} className="border-b border-gray-100">
                <button
                  onClick={() => toggleSection(section.name)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900">{section.name}</span>
                  <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </div>
                </button>
                
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  {section.components.length > 0 && (
                    <div className="p-3 grid grid-cols-2 gap-2 bg-gray-50">
                      {section.components.map(({ name, component: Component }) => (
                        <div
                          key={name}
                          ref={(ref) => {
                            if (ref && connectors && enabled) {
                              connectors.create(ref, <Component />)
                            }
                          }}
                          className="p-2.5 bg-white border border-gray-200 rounded-md cursor-move hover:border-[#7c3aed] hover:shadow-sm transition-all group"
                        >
                          <div className="text-xs font-medium text-gray-700 text-center leading-tight group-hover:text-[#7c3aed]">
                            {name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

