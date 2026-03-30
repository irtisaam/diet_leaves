'use client'

import { useState, useEffect } from 'react'
import { productsAPI } from '@/lib/api'
import { Product } from '@/types'
import ProductCard from '@/components/product/ProductCard'

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 12

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const data = await productsAPI.getAll({ page, limit })
        const response = data as any
        setProducts(response.products || [])
        setTotal(response.total || 0)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [page])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 neon-text-subtle">Shop All Products</h1>
          <p className="text-gray-400">Browse our complete collection of premium stevia sweeteners</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-dark-100 h-96 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No products available yet.</p>
            <p className="text-gray-500 mt-2">Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12 space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-dark-200 text-white rounded-lg disabled:opacity-50 hover:bg-dark-100 transition-colors"
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      page === i + 1 
                        ? 'bg-primary text-black' 
                        : 'border border-dark-200 text-white hover:bg-dark-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-dark-200 text-white rounded-lg disabled:opacity-50 hover:bg-dark-100 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
