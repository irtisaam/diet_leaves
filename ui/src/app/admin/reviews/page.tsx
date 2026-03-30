'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Star, Search, Filter, CheckCircle, XCircle, 
  Trash2, ThumbsUp, ToggleLeft, ToggleRight, Package
} from 'lucide-react'

interface Review {
  id: string
  product_id: string
  product_name: string | null
  product_slug: string | null
  customer_name: string | null
  customer_email: string | null
  rating: number
  title: string | null
  review_text: string | null
  is_verified_purchase: boolean
  is_approved: boolean
  is_active: boolean
  is_featured: boolean
  sort_order: number
  created_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  
  // Filters
  const [filterApproved, setFilterApproved] = useState<boolean | null>(null)
  const [filterActive, setFilterActive] = useState<boolean | null>(null)
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Selected reviews for bulk actions
  const [selectedReviews, setSelectedReviews] = useState<string[]>([])

  useEffect(() => {
    fetchReviews()
  }, [page, filterApproved, filterActive, filterFeatured])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      let url = `${API_URL}/api/admin/reviews?page=${page}&limit=20`
      if (filterApproved !== null) url += `&approved=${filterApproved}`
      if (filterActive !== null) url += `&active=${filterActive}`
      if (filterFeatured !== null) url += `&featured=${filterFeatured}`

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
        setTotal(data.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }

  const updateReview = async (reviewId: string, updateData: Record<string, any>) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      if (res.ok) {
        fetchReviews()
      }
    } catch (err) {
      console.error('Failed to update review')
    }
  }

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return
    try {
      const res = await fetch(`${API_URL}/api/admin/reviews/${reviewId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        fetchReviews()
      }
    } catch (err) {
      console.error('Failed to delete review')
    }
  }

  const bulkApprove = async () => {
    if (selectedReviews.length === 0) return
    try {
      await fetch(`${API_URL}/api/admin/reviews/bulk-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_ids: selectedReviews,
          update_data: { is_approved: true }
        })
      })
      setSelectedReviews([])
      fetchReviews()
    } catch (err) {
      console.error('Failed to bulk approve')
    }
  }

  const toggleSelectAll = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([])
    } else {
      setSelectedReviews(reviews.map(r => r.id))
    }
  }

  const toggleSelectReview = (reviewId: string) => {
    if (selectedReviews.includes(reviewId)) {
      setSelectedReviews(selectedReviews.filter(id => id !== reviewId))
    } else {
      setSelectedReviews([...selectedReviews, reviewId])
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const renderStars = (rating: number) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-600 text-gray-600'
          }`}
        />
      ))}
    </div>
  )

  const filteredReviews = reviews.filter(review => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (review.customer_name?.toLowerCase().includes(term)) ||
      (review.product_name?.toLowerCase().includes(term)) ||
      (review.title?.toLowerCase().includes(term)) ||
      (review.review_text?.toLowerCase().includes(term))
    )
  })

  return (
    <div className="min-h-screen bg-dark-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Reviews Management</h1>
              <p className="text-gray-400">{total} total reviews</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-dark-100 rounded-xl p-4 mb-6 border border-dark-200">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-200 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterApproved(filterApproved === null ? false : filterApproved === false ? true : null)}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                  filterApproved === null 
                    ? 'bg-dark-200 text-gray-400' 
                    : filterApproved 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                <Filter className="h-4 w-4" />
                {filterApproved === null ? 'All Status' : filterApproved ? 'Approved' : 'Pending'}
              </button>

              <button
                onClick={() => setFilterActive(filterActive === null ? true : filterActive ? false : null)}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                  filterActive === null 
                    ? 'bg-dark-200 text-gray-400' 
                    : filterActive 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-red-500/20 text-red-400'
                }`}
              >
                {filterActive === null ? 'All' : filterActive ? 'Active' : 'Inactive'}
              </button>

              <button
                onClick={() => setFilterFeatured(filterFeatured === null ? true : null)}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                  filterFeatured 
                    ? 'bg-primary-500/20 text-primary-400' 
                    : 'bg-dark-200 text-gray-400'
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
                Featured Only
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedReviews.length > 0 && (
          <div className="bg-primary-500/20 border border-primary-500/30 rounded-lg p-4 mb-6 flex items-center justify-between">
            <span className="text-primary-400">
              {selectedReviews.length} review{selectedReviews.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={bulkApprove}
                className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                Approve Selected
              </button>
              <button
                onClick={() => setSelectedReviews([])}
                className="px-4 py-2 bg-dark-200 text-gray-400 rounded-lg hover:bg-dark-300 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Reviews Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-dark-100 rounded-xl">
            <Star className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Reviews Found</h3>
            <p className="text-gray-400">No reviews match your current filters.</p>
          </div>
        ) : (
          <div className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-dark-200">
                <tr>
                  <th className="py-3 px-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedReviews.length === reviews.length && reviews.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Review</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Product</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Rating</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Priority</th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-200">
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-dark-200/50 transition-colors">
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedReviews.includes(review.id)}
                        onChange={() => toggleSelectReview(review.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="max-w-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">
                            {review.customer_name || 'Anonymous'}
                          </span>
                          {review.is_verified_purchase && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                              Verified
                            </span>
                          )}
                        </div>
                        {review.title && (
                          <p className="text-sm text-white font-medium">{review.title}</p>
                        )}
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {review.review_text || 'No review text'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(review.created_at)}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {review.product_name ? (
                        <Link
                          href={`/admin/products/view/${review.product_id}`}
                          className="text-primary-400 hover:underline flex items-center gap-2"
                        >
                          <Package className="h-4 w-4" />
                          {review.product_name}
                        </Link>
                      ) : (
                        <span className="text-gray-500">Unknown Product</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {renderStars(review.rating)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded w-fit ${
                          review.is_approved 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {review.is_approved ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {review.is_approved ? 'Approved' : 'Pending'}
                        </span>
                        {review.is_featured && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-primary-500/20 text-primary-400 w-fit">
                            <ThumbsUp className="h-3 w-3" />
                            Featured
                          </span>
                        )}
                        {!review.is_active && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 w-fit">
                            Hidden
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={review.sort_order}
                          onChange={(e) => updateReview(review.id, { sort_order: parseInt(e.target.value) || 0 })}
                          className="w-16 px-2 py-1 bg-dark-200 border border-dark-300 rounded text-white text-sm text-center focus:outline-none focus:border-primary-500"
                          title="Sort priority (lower = higher on page)"
                          min={0}
                        />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Approve/Reject */}
                        <button
                          onClick={() => updateReview(review.id, { is_approved: !review.is_approved })}
                          className={`p-2 rounded-lg transition-colors ${
                            review.is_approved 
                              ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400' 
                              : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                          }`}
                          title={review.is_approved ? 'Unapprove' : 'Approve'}
                        >
                          {review.is_approved ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </button>

                        {/* Feature */}
                        <button
                          onClick={() => updateReview(review.id, { is_featured: !review.is_featured })}
                          className={`p-2 rounded-lg transition-colors ${
                            review.is_featured 
                              ? 'bg-primary-500/20 text-primary-400' 
                              : 'bg-dark-200 text-gray-400 hover:bg-dark-300'
                          }`}
                          title={review.is_featured ? 'Unfeature' : 'Feature'}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </button>

                        {/* Toggle Active */}
                        <button
                          onClick={() => updateReview(review.id, { is_active: !review.is_active })}
                          className={`p-2 rounded-lg transition-colors ${
                            review.is_active 
                              ? 'bg-dark-200 text-gray-400 hover:bg-dark-300' 
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                          title={review.is_active ? 'Hide' : 'Show'}
                        >
                          {review.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => deleteReview(review.id)}
                          className="p-2 rounded-lg bg-dark-200 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {total > 20 && (
              <div className="flex justify-center gap-2 py-4 border-t border-dark-200">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-dark-200 rounded-lg text-gray-400 disabled:opacity-50 hover:bg-dark-300 transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-400">
                  Page {page} of {Math.ceil(total / 20)}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / 20)}
                  className="px-4 py-2 bg-dark-200 rounded-lg text-gray-400 disabled:opacity-50 hover:bg-dark-300 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
