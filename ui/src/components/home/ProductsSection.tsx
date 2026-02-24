'use client'

import { useState, useEffect } from 'react'
import { productsAPI } from '@/lib/api'
import { Product } from '@/types'
import ProductCard from '@/components/product/ProductCard'

export default function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productsAPI.getAll({ limit: 6 })
        setProducts((data as any).products || [])
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  if (isLoading) {
    return (
      <section className="py-20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-primary-400 text-sm tracking-[0.3em] uppercase mb-4">Our Products</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white neon-text-subtle">
              CHOOSE YOUR FLAVOUR
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#121212] h-[450px] animate-pulse rounded-xl border border-gray-800" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className="py-20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-primary-400 text-sm tracking-[0.3em] uppercase mb-4">Our Products</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white neon-text-subtle">
              CHOOSE YOUR FLAVOUR
            </h2>
          </div>
          <div className="text-center py-20 bg-[#121212] rounded-xl border border-gray-800">
            <p className="text-gray-400 text-lg">Products coming soon...</p>
            <p className="text-gray-600 text-sm mt-2">Check back later for our amazing stevia products</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-primary-400 text-sm tracking-[0.3em] uppercase mb-4">Our Products</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white neon-text-subtle">
            CHOOSE YOUR FLAVOUR
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent mx-auto mt-6"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.slice(0, 6).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
