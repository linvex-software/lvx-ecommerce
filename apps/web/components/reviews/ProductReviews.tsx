'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Star, Check } from 'lucide-react'
import { fetchAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/useAuthStore'

interface ReviewSummary {
  average_rating: number
  total_reviews: number
  rating_breakdown: {
    rating: number
    count: number
  }[]
  top_tags: {
    tag: string
    count: number
    rating: number
  }[]
}

interface Review {
  id: string
  rating: number
  tags: Array<{ tag: string; rating: number }>
  created_at: string
}

interface ReviewsResponse {
  reviews: Review[]
}

interface EligibilityResponse {
  eligibility: {
    canReview: boolean
    orderItemId?: string
  }
}

interface TagsResponse {
  tags: string[]
}

interface ProductReviewsProps {
  productId: string
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { customer } = useAuthStore()
  const queryClient = useQueryClient()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Buscar resumo de avaliações
  const { data: summaryData } = useQuery<{ summary: ReviewSummary }>({
    queryKey: ['product-reviews-summary', productId],
    queryFn: async () => {
      return await fetchAPI(`/products/${productId}/reviews/summary`)
    }
  })

  // Buscar lista de avaliações
  const { data: reviewsData } = useQuery<ReviewsResponse>({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      return await fetchAPI(`/products/${productId}/reviews`)
    }
  })

  // Verificar elegibilidade (apenas se autenticado)
  const { data: eligibilityData } = useQuery<EligibilityResponse>({
    queryKey: ['product-reviews-eligibility', productId],
    queryFn: async () => {
      // fetchAPI já adiciona o token de autenticação automaticamente se disponível
      return await fetchAPI(`/products/${productId}/reviews/eligibility`)
    },
    enabled: !!customer,
    retry: false
  })

  // Buscar tags disponíveis para rating
  const { data: tagsData } = useQuery<TagsResponse>({
    queryKey: ['review-tags', selectedRating],
    queryFn: async () => {
      if (!selectedRating) return { tags: [] }
      return await fetchAPI(`/reviews/tags/${selectedRating}`)
    },
    enabled: !!selectedRating
  })

  // Criar avaliação
  const createReviewMutation = useMutation({
    mutationFn: async (data: {
      order_item_id: string
      rating: number
      tags: string[]
    }) => {
      // fetchAPI já adiciona o token de autenticação automaticamente se disponível
      return await fetchAPI(`/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews-summary', productId] })
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] })
      queryClient.invalidateQueries({ queryKey: ['product-reviews-eligibility', productId] })
      setShowReviewForm(false)
      setSelectedRating(null)
      setSelectedTags([])
    }
  })

  const summary = summaryData?.summary
  const reviews = reviewsData?.reviews || []
  const canReview = eligibilityData?.eligibility.canReview || false
  const orderItemId = eligibilityData?.eligibility.orderItemId
  const availableTags = tagsData?.tags || []

  const handleSubmitReview = () => {
    if (!selectedRating || !orderItemId) return

    createReviewMutation.mutate({
      order_item_id: orderItemId,
      rating: selectedRating,
      tags: selectedTags
    })
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date)
  }

  if (!summary) {
    return null
  }

  return (
    <div className="mt-16 pt-8 border-t border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Avaliações</h2>
        {canReview && !showReviewForm && (
          <Button onClick={() => setShowReviewForm(true)} variant="outline">
            Avaliar Produto
          </Button>
        )}
      </div>

      {/* Resumo */}
      <div className="mb-8 p-6 border border-border rounded-lg bg-card">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Média e total */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold">{summary.average_rating.toFixed(1)}</div>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    className={cn(
                      star <= Math.round(summary.average_rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    )}
                  />
                ))}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {summary.total_reviews} {summary.total_reviews === 1 ? 'avaliação' : 'avaliações'}
              </div>
            </div>
          </div>

          {/* Breakdown de ratings */}
          {summary.rating_breakdown.length > 0 && (
            <div className="flex-1 space-y-2">
              {summary.rating_breakdown.map((breakdown) => {
                const percentage = summary.total_reviews > 0
                  ? (breakdown.count / summary.total_reviews) * 100
                  : 0
                return (
                  <div key={breakdown.rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-20">
                      <span className="text-sm font-medium">{breakdown.rating}</span>
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-10 text-right">
                      {breakdown.count}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Tags mais citadas */}
        {summary.top_tags.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-semibold mb-3">Tags mais citadas</h3>
            <div className="flex flex-wrap gap-2">
              {summary.top_tags.map((tag) => (
                <span
                  key={tag.tag}
                  className="px-3 py-1 bg-muted rounded-full text-sm"
                >
                  {tag.tag} ({tag.count})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Formulário de avaliação */}
      {showReviewForm && canReview && (
        <div className="mb-8 p-6 border border-border rounded-lg bg-card">
          <h3 className="text-lg font-semibold mb-4">Avaliar produto</h3>
          <div className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium mb-2">Avaliação</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => {
                      setSelectedRating(rating)
                      setSelectedTags([])
                    }}
                    className={cn(
                      'p-2 rounded transition-colors',
                      selectedRating === rating
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    <Star
                      size={24}
                      className={cn(
                        selectedRating && rating <= selectedRating
                          ? 'fill-current'
                          : ''
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            {selectedRating && availableTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Tags (opcional)</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'px-3 py-1 rounded-full text-sm border transition-colors',
                        selectedTags.includes(tag)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:border-primary'
                      )}
                    >
                      {selectedTags.includes(tag) && <Check size={14} className="inline mr-1" />}
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitReview}
                disabled={!selectedRating || createReviewMutation.isPending}
              >
                {createReviewMutation.isPending ? 'Enviando...' : 'Enviar Avaliação'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewForm(false)
                  setSelectedRating(null)
                  setSelectedTags([])
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de avaliações */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={cn(
                        star <= review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDate(review.created_at)}
                </span>
              </div>
              {review.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {review.tags.map((tag) => (
                    <span
                      key={tag.tag}
                      className="px-2 py-1 bg-muted rounded-full text-xs"
                    >
                      {tag.tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 border border-border rounded-lg bg-muted/50 text-center">
          <p className="text-muted-foreground">
            Ainda não há avaliações para este produto
          </p>
        </div>
      )}
    </div>
  )
}

