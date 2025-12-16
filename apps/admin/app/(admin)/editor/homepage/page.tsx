'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import axios from 'axios'
import { NavbarEditor } from '@/components/editor/NavbarEditor'
import type { NavbarItem } from '@/lib/types/navbar'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

export default function HomepageEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')

  // Se tentar acessar a aba 'blocks', redirecionar para o editor principal
  useEffect(() => {
    if (tab === 'blocks') {
      router.push('/editor')
    }
  }, [tab, router])

  // Se não houver tab ou for navbar, mostrar o editor de navbar
  if (tab === 'blocks') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-sm text-muted-foreground">Redirecionando...</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white w-full shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Menu de Navegação</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gerencie os itens do menu de navegação da sua loja
              </p>
            </div>
            <button
              onClick={() => router.push('/editor')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              📦 Editor de Blocos →
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 w-full">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Arraste os itens para reordená-los. Clique em editar para modificar cada item.
            </p>
          </div>
          <NavbarEditor />
        </div>
      </div>
    </div>
  )
}

