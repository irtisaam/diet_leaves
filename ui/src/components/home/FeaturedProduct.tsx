'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { productsAPI } from '@/lib/api'
import { Product } from '@/types'
import { useCart } from '@/lib/context/CartContext'
import Link from 'next/link'

export default function FeaturedProduct() {
  const [product, setProduct] = useState<Product | null>(null)
  const { addToCart, isLoading } = useCart()

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await productsAPI.getFeatured(1)
        const products = data as Product[]
        if (products.length > 0) {
          setProduct(products[0])
        }
      } catch (error) {
        console.error('Failed to fetch featured product:', error)
      }
    }
    fetchFeatured()
  }, [])

  if (!product) {
    return null
  }

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  // Get primary image or first image
  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]

  return (
    <section className="py-20 bg-gradient-to-br from-red-900 via-red-800 to-red-900 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/20 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Product Image */}
          <div className="relative h-[400px] md:h-[500px]">
            {primaryImage ? (
              <Image
                src={primaryImage.image_url}
                alt={product.name}
                fill
                className="object-contain drop-shadow-2xl"
              />
            ) : (
              <div className="w-full h-full bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-white/50">No image</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="text-center md:text-left">
            <span className="text-red-300 text-sm uppercase tracking-widest">Featured Product</span>
            <h2 className="text-4xl md:text-6xl font-bold text-white mt-2 mb-6" style={{ textShadow: '0 0 40px rgba(255,255,255,0.2)' }}>
              {product.name.toUpperCase()}
            </h2>
            
            {product.short_description && (
              <p className="text-red-200 text-lg mb-8">
                {product.short_description}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button
                onClick={handleAddToCart}
                disabled={isLoading}
                className="px-8 py-4 bg-white text-red-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add to Cart'}
              </button>
              <Link
                href={`/products/${product.slug}`}
                className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-center"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
