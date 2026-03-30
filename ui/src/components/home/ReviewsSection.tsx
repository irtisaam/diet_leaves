'use client'

import { useState, useEffect } from 'react'
import { reviewsAPI } from '@/lib/api'
import Link from 'next/link'

interface Review {
  id: string
  product_id: string
  customer_name?: string
  rating: number
  title?: string
  review_text?: string
  is_verified_purchase: boolean
  created_at: string
  product_name?: string
  product_slug?: string
  products?: { name: string; slug: string }
}

interface ReviewsResponse {
  reviews: Review[]
  total: number
  average_rating: number
}

interface ReviewsSectionProps {
  initialData?: Review[]
}

const StarIcon = ({ filled, half = false, size = 'md' }: { filled: boolean; half?: boolean; size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7' }
  return (
    <svg className={`${sizes[size]} ${filled ? 'text-amber-400' : 'text-gray-600'} flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} filled={star <= rating} size={size} />
      ))}
    </div>
  )
}

function getInitials(name?: string) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const avatarColors = [
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-600',
  'from-lime-500 to-green-600',
]

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const colorClass = avatarColors[index % avatarColors.length]
  const initials = getInitials(review.customer_name)
  const date = new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="group relative bg-gradient-to-b from-dark-100 to-dark rounded-2xl p-6 border border-dark-200 hover:border-neon-green/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(57,255,20,0.07)] hover:-translate-y-1 flex flex-col h-full">
      {/* Quote mark decoration */}
      <div className="absolute top-4 right-5 text-6xl font-serif text-neon-green/5 group-hover:text-neon-green/10 transition-colors duration-300 leading-none select-none">
        &ldquo;
      </div>

      {/* Stars + verified badge */}
      <div className="flex items-center justify-between mb-4">
        <StarRating rating={review.rating} size="sm" />
        {review.is_verified_purchase && (
          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Verified
          </span>
        )}
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="text-white font-semibold text-base mb-2 leading-snug">{review.title}</h4>
      )}

      {/* Review text */}
      {review.review_text && (
        <p className="text-gray-400 text-sm leading-relaxed mb-5 flex-1 line-clamp-4">
          {review.review_text}
        </p>
      )}

      {/* Product link */}
      {review.product_name && review.product_slug && (
        <Link
          href={`/products/${review.product_slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-neon-green/70 hover:text-neon-green mb-4 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          {review.product_name}
        </Link>
      )}

      {/* Author row */}
      <div className="flex items-center gap-3 pt-4 border-t border-dark-200">
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg`}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{review.customer_name || 'Anonymous'}</p>
          <p className="text-gray-500 text-xs">{date}</p>
        </div>
      </div>
    </div>
  )
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400 w-3">{star}</span>
      <StarIcon filled size="sm" />
      <div className="flex-1 h-1.5 bg-dark-200 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-gray-500 w-6 text-right">{pct}%</span>
    </div>
  )
}

export default function ReviewsSection({ initialData }: ReviewsSectionProps) {
  const transformedInitialData = initialData ? {
    reviews: initialData.map(r => ({
      ...r,
      product_name: r.products?.name,
      product_slug: r.products?.slug
    })),
    total: initialData.length,
    average_rating: initialData.length > 0
      ? Math.round((initialData.reduce((sum, r) => sum + r.rating, 0) / initialData.length) * 10) / 10
      : 0
  } : null

  const [data, setData] = useState<ReviewsResponse | null>(transformedInitialData)
  const [isLoading, setIsLoading] = useState(!initialData)

  useEffect(() => {
    if (initialData) return
    const fetchReviews = async () => {
      try {
        const response = await reviewsAPI.getFeatured(6) as ReviewsResponse
        setData(response)
      } catch (error) {
        console.error('Failed to fetch reviews:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchReviews()
  }, [initialData])

  if (isLoading) {
    return (
      <section className="py-24 bg-dark relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="h-8 w-64 bg-dark-100 rounded-lg animate-pulse mx-auto mb-4" />
            <div className="h-4 w-48 bg-dark-100 rounded animate-pulse mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-dark-100 rounded-2xl p-6 animate-pulse h-52 border border-dark-200" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!data || data.reviews.length === 0) return null

  // Compute per-star counts for rating breakdown
  const starCounts = [5, 4, 3, 2, 1].map(s => ({
    star: s,
    count: data.reviews.filter(r => r.rating === s).length
  }))

  return (
    <section className="py-24 bg-dark relative overflow-hidden">
      {/* Ambient glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-green/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/3 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 mb-16">
          {/* Left: headline */}
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block text-neon-green text-sm font-semibold tracking-widest uppercase mb-3">
              Customer Reviews
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Loved by{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-emerald-400">
                Health Enthusiasts
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-lg">
              Real experiences from customers who made Diet Leaves part of their wellness journey.
            </p>
          </div>

          {/* Right: overall rating widget */}
          {data.average_rating > 0 && (
            <div className="bg-dark-100 border border-dark-200 rounded-2xl p-8 flex gap-8 items-center flex-shrink-0 shadow-xl">
              <div className="text-center">
                <div className="text-6xl font-black text-white leading-none mb-1">
                  {data.average_rating.toFixed(1)}
                </div>
                <StarRating rating={Math.round(data.average_rating)} size="md" />
                <p className="text-gray-500 text-xs mt-2">{data.total} reviews</p>
              </div>
              <div className="space-y-2 min-w-[140px]">
                {starCounts.map(({ star, count }) => (
                  <RatingBar key={star} star={star} count={count} total={data.reviews.length} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.reviews.map((review, i) => (
            <ReviewCard key={review.id} review={review} index={i} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-neon-green transition-colors group"
          >
            Shop now and share your experience
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
