'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { productsAPI } from '@/lib/api'
import { Product } from '@/types'
import { useCart } from '@/lib/context/CartContext'

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
    <section className="py-16 bg-gradient-to-r from-red-900 to-red-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Product Image */}
          <div className="relative h-[400px] md:h-[500px]">
            {primaryImage ? (
              <Image
                src={primaryImage.image_url}
                alt={product.name}
                fill
                className="object-contain"
              />
            ) : (
              <div className="w-full h-full bg-dark-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">No image</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="text-center md:text-left">
            <p className="text-red-300 text-lg mb-2">SWEET</p>
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-8" style={{ textShadow: '0 0 40px rgba(255,255,255,0.3)' }}>
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
                className="btn-secondary disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add to cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
