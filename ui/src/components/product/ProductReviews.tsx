'use client'

import { useState, useEffect } from 'react'
import { Star, ThumbsUp, User, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface Review {
  id: string
  product_id: string
  customer_name: string | null
  rating: number
  title: string | null
  review_text: string | null
  is_verified_purchase: boolean
  is_featured: boolean
  created_at: string
}

interface ReviewStats {
  total_reviews: number
  average_rating: number
  rating_distribution: Record<number, number>
}

interface ProductReviewsProps {
  productId: string
  productName: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    review_text: '',
    customer_name: '',
    customer_email: ''
  })

  useEffect(() => {
    fetchReviews()
    fetchStats()
  }, [productId])

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reviews/${productId}`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
      }
    } catch (err) {
      console.error('Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reviews/stats/${productId}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch review stats')
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch(`${API_URL}/api/reviews/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          ...formData
        })
      })

      if (res.ok) {
        setSubmitSuccess(true)
        setFormData({
          rating: 5,
          title: '',
          review_text: '',
          customer_name: '',
          customer_email: ''
        })
        setShowForm(false)
        // Don't refresh reviews since new ones need approval
      }
    } catch (err) {
      console.error('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (rating: number, interactive = false, size = 'h-5 w-5') => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive ? () => setFormData({ ...formData, rating: star }) : undefined}
            className={interactive ? 'cursor-pointer focus:outline-none' : 'cursor-default'}
            disabled={!interactive}
          >
            <Star
              className={`${size} ${
                star <= rating 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'fill-gray-600 text-gray-600'
              } ${interactive ? 'hover:fill-yellow-300 hover:text-yellow-300' : ''}`}
            />
          </button>
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3)

  return (
    <div className="mt-16 border-t border-dark-200 pt-12">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Customer Reviews</h2>
          {stats && stats.total_reviews > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {renderStars(Math.round(stats.average_rating))}
                <span className="text-xl font-bold text-white">{stats.average_rating}</span>
              </div>
              <span className="text-gray-400">
                Based on {stats.total_reviews} review{stats.total_reviews !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-black font-semibold rounded-lg transition-colors"
        >
          Write a Review
        </button>
      </div>

      {/* Rating Distribution */}
      {stats && stats.total_reviews > 0 && (
        <div className="bg-dark-100 rounded-xl p-6 mb-8">
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.rating_distribution[rating] || 0
              const percentage = stats.total_reviews > 0 
                ? (count / stats.total_reviews) * 100 
                : 0
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-8">{rating} star</span>
                  <div className="flex-1 h-2 bg-dark-300 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-12 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Success Message */}
      {submitSuccess && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span>Thank you for your review! It will be visible after approval.</span>
          </div>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <div className="bg-dark-100 rounded-xl p-6 mb-8 border border-dark-200">
          <h3 className="text-lg font-semibold text-white mb-4">Write Your Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Your Rating</label>
              {renderStars(formData.rating, true, 'h-8 w-8')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Your Name</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Your Email</label>
                <input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Review Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                placeholder="Great product!"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Your Review</label>
              <textarea
                value={formData.review_text}
                onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white focus:border-primary-500 focus:outline-none resize-none"
                placeholder="Share your experience with this product..."
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-dark-200 hover:bg-dark-300 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-dark-100 rounded-xl">
          <Star className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Reviews Yet</h3>
          <p className="text-gray-400 mb-4">Be the first to review {productName}</p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-black font-semibold rounded-lg transition-colors"
            >
              Write a Review
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {displayedReviews.map((review) => (
            <div
              key={review.id}
              className={`bg-dark-100 rounded-xl p-6 border ${
                review.is_featured ? 'border-primary-500/50' : 'border-dark-200'
              }`}
            >
              {review.is_featured && (
                <div className="flex items-center gap-2 text-primary-500 text-sm mb-3">
                  <ThumbsUp className="h-4 w-4" />
                  <span>Featured Review</span>
                </div>
              )}
              
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-dark-300 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {review.customer_name || 'Anonymous'}
                      </span>
                      {review.is_verified_purchase && (
                        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded">
                          <CheckCircle className="h-3 w-3" />
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">{formatDate(review.created_at)}</span>
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>

              {review.title && (
                <h4 className="font-semibold text-white mb-2">{review.title}</h4>
              )}
              
              {review.review_text && (
                <p className="text-gray-300">{review.review_text}</p>
              )}
            </div>
          ))}

          {/* Show More/Less Button */}
          {reviews.length > 3 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="w-full py-3 flex items-center justify-center gap-2 text-primary-500 hover:text-primary-400 transition-colors"
            >
              {showAllReviews ? (
                <>
                  Show Less <ChevronUp className="h-5 w-5" />
                </>
              ) : (
                <>
                  Show All {reviews.length} Reviews <ChevronDown className="h-5 w-5" />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
