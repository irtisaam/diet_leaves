'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { productsAPI } from '@/lib/api'
import { Product } from '@/types'
import { useCart } from '@/lib/context/CartContext'
import Link from 'next/link'
import { Star, ShoppingCart, ArrowRight } from 'lucide-react'

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

  const hasDiscount = product.compare_at_price && Number(product.compare_at_price) > Number(product.price)
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.compare_at_price!)) * 100)
    : 0

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background — dark with subtle emerald gradient */}
      <div className="absolute inset-0 bg-[#0a0f0d]" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-transparent to-emerald-950/20" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />
      
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Product Image */}
          <div className="relative group">
            {/* Glow behind image */}
            <div className="absolute inset-8 bg-emerald-500/10 rounded-3xl blur-2xl group-hover:bg-emerald-500/15 transition-all duration-700" />
            
            <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden">
              {primaryImage ? (
                <Image
                  src={primaryImage.image_url}
                  alt={product.name}
                  fill
                  className="object-contain drop-shadow-[0_20px_60px_rgba(16,185,129,0.15)] transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                  <span className="text-white/30 text-lg">No image</span>
                </div>
              )}
            </div>

            {/* Discount badge */}
            {hasDiscount && (
              <div className="absolute top-6 right-6 bg-emerald-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30">
                {discountPercent}% OFF
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="text-center lg:text-left space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5">
              <Star className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
              <span className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">Featured Product</span>
            </div>

            {/* Product name */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
              {product.name}
            </h2>
            
            {/* Description */}
            {product.short_description && (
              <p className="text-gray-400 text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                {product.short_description}
              </p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 justify-center lg:justify-start">
              <span className="text-emerald-400 text-3xl font-bold">
                Rs.{Number(product.price).toFixed(0)}
              </span>
              {hasDiscount && (
                <span className="text-gray-600 line-through text-lg">
                  Rs.{Number(product.compare_at_price!).toFixed(0)}
                </span>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
              <button
                onClick={handleAddToCart}
                disabled={isLoading}
                className="group/btn inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-400 transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50"
              >
                <ShoppingCart className="h-4.5 w-4.5" />
                {isLoading ? 'Adding...' : 'Add to Cart'}
              </button>
              <Link
                href={`/products/${product.slug}`}
                className="group/btn inline-flex items-center justify-center gap-2.5 px-8 py-4 border border-white/15 text-white font-semibold rounded-xl hover:bg-white/5 hover:border-white/25 transition-all duration-300 text-center"
              >
                View Details
                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
    </section>
  )
}
