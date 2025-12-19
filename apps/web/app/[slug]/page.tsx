import { notFound } from 'next/navigation'
import { fetchAPI } from '@/lib/api'
import { DynamicPageRenderer } from '@/components/pages/dynamic-page-renderer'

interface DynamicPage {
  id: string
  title: string
  slug: string
  published: boolean
  contentJson?: Record<string, unknown> | null
  products?: Array<{
    id: string
    productId: string
    orderIndex: number
      product?: {
        id: string
        name: string
        slug: string
        basePrice: string
        sku: string
        status: string
        mainImage?: string | null
      }
  }>
}

async function getDynamicPage(slug: string): Promise<DynamicPage | null> {
  try {
    // No servidor, precisamos garantir que o storeId seja enviado
    const storeId = process.env.NEXT_PUBLIC_STORE_ID || process.env.STORE_ID
    
    if (!storeId) {
      console.error('Store ID não configurado. Configure NEXT_PUBLIC_STORE_ID ou STORE_ID no .env')
      return null
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
    const response = await fetch(`${API_URL}/store/dynamic-pages/${slug}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-store-id': storeId,
      },
      cache: 'no-store', // Sempre buscar dados atualizados
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const errorData = await response.json().catch(() => ({}))
      console.error('Error fetching dynamic page:', response.status, errorData)
      return null
    }

    const data = await response.json()
    return data.page
  } catch (error: any) {
    console.error('Error fetching dynamic page:', error)
    return null
  }
}

export default async function DynamicPageRoute({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  // Next.js 15+ pode passar params como Promise
  const resolvedParams = await Promise.resolve(params)
  const slug = resolvedParams.slug

  const page = await getDynamicPage(slug)

  if (!page || !page.published) {
    notFound()
  }

  return <DynamicPageRenderer page={page} />
}

