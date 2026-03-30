'use client'

import { useState, useEffect } from 'react'
import { productsAPI } from '@/lib/api'
import { Product } from '@/types'
import ProductCard from '@/components/product/ProductCard'
import Link from 'next/link'

interface ProductsSectionProps {
  initialData?: Product[]
}

export default function ProductsSection({ initialData }: ProductsSectionProps) {
  const [products, setProducts] = useState<Product[]>(initialData || [])
  const [isLoading, setIsLoading] = useState(!initialData)

  useEffect(() => {
    // Only fetch if no initial data provided
    if (initialData) return
    
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
  }, [initialData])

  if (isLoading) {
    return (
      <section className="py-20 bg-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4 neon-text-subtle">
            Choose Your Flavor
          </h2>
          <p className="text-gray-400 text-center mb-12">Premium stevia sweeteners for every taste</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-dark-100 aspect-square rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className="py-20 bg-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4 neon-text-subtle">
            Choose Your Flavor
          </h2>
          <p className="text-gray-400 text-center mb-12">Premium stevia sweeteners for every taste</p>
          <div className="text-center py-16">
            <p className="text-gray-400">Products coming soon...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 neon-text-subtle">
            Choose Your Flavor
          </h2>
          <p className="text-gray-400">Premium stevia sweeteners for every taste</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.slice(0, 6).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link href="/shop" className="btn-outline">
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}
