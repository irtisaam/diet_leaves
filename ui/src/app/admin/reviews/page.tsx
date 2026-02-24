'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, Check, X, Trash2 } from 'lucide-react'

interface Review {
  id: string
  product_name?: string
  customer_name: string
  customer_email: string
  rating: number
  title: string
  review_text: string
  is_approved: boolean
  created_at: string
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/reviews')
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const approveReview = async (id: string, approved: boolean) => {
    try {
      const res = await fetch(`http://localhost:8000/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_approved: approved })
      })
      if (res.ok) {
        setReviews(reviews.map(r => r.id === id ? { ...r, is_approved: approved } : r))
      }
    } catch (error) {
      console.error('Failed to update:', error)
    }
  }

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return
    try {
      const res = await fetch(`http://localhost:8000/api/admin/reviews/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const filteredReviews = reviews.filter(r => {
    if (filter === 'pending') return !r.is_approved
    if (filter === 'approved') return r.is_approved
    return true
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white neon-text">Reviews</h1>
            <p className="text-gray-400">Manage product reviews</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'approved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                filter === f ? 'bg-primary-500 text-white' : 'bg-dark-100 text-gray-400 hover:bg-dark-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-20 bg-dark-100 rounded-xl border border-gray-800">
            <Star className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No reviews found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="bg-dark-100 rounded-xl border border-gray-800 p-6 hover:border-primary-500/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                        ))}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${review.is_approved ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {review.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold">{review.title || 'No title'}</h3>
                    <p className="text-gray-400 text-sm mt-2">{review.review_text}</p>
                    <p className="text-gray-600 text-xs mt-3">{review.customer_name} • {review.customer_email}</p>
                  </div>
                  <div className="flex gap-2">
                    {!review.is_approved && (
                      <button onClick={() => approveReview(review.id, true)} className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors">
                        <Check className="h-4 w-4 text-green-400" />
                      </button>
                    )}
                    {review.is_approved && (
                      <button onClick={() => approveReview(review.id, false)} className="p-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 transition-colors">
                        <X className="h-4 w-4 text-yellow-400" />
                      </button>
                    )}
                    <button onClick={() => deleteReview(review.id)} className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
