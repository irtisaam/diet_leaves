'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'
import { useCart } from '@/lib/context/CartContext'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, isLoading } = useCart()

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await addToCart(product.id)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  // Get primary image or first image
  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]

  // Determine background color based on product name/category (for visual variety like juus.pk)
  const bgColors: Record<string, string> = {
    original: 'from-blue-400 to-blue-600',
    cardamom: 'from-green-500 to-green-700',
    vanilla: 'from-yellow-400 to-yellow-600',
    strawberry: 'from-red-500 to-red-700',
    default: 'from-primary-500 to-primary-700',
  }

  const productNameLower = product.name.toLowerCase()
  let bgGradient = bgColors.default
  for (const [key, value] of Object.entries(bgColors)) {
    if (productNameLower.includes(key)) {
      bgGradient = value
      break
    }
  }

  return (
    <Link href={`/products/${product.slug}`} className="product-card block group rounded-xl overflow-hidden">
      <div className={`relative h-[350px] bg-gradient-to-br ${bgGradient} overflow-hidden`}>
        {/* Hover Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Product Image */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          {primaryImage ? (
            <Image
              src={primaryImage.image_url}
              alt={product.name}
              width={220}
              height={220}
              className="object-contain max-h-full transform group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-40 h-40 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-white/20">
              <span className="text-white/60 text-sm">No image</span>
            </div>
          )}
        </div>

        {/* Title Overlay */}
        <div className="absolute top-6 left-6 right-6 text-center">
          <p className="text-white/90 text-xs tracking-[0.3em] uppercase font-medium">
            {product.short_description || 'STEVIA SWEETENER'}
          </p>
        </div>

        {/* Sale Badge */}
        {product.is_on_sale && (
          <span className="absolute bottom-4 left-4 bg-primary-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg shadow-primary-500/50">
            SALE
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-5 bg-[#121212] border-t border-gray-800">
        <h3 className="text-white font-semibold text-lg group-hover:text-primary-400 transition-colors">{product.name}</h3>
        
        <div className="flex items-center gap-3 mt-2">
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-gray-500 line-through text-sm">
              Rs.{product.compare_at_price.toFixed(0)}
            </span>
          )}
          <span className="text-primary-400 font-bold text-lg">
            Rs.{product.price.toFixed(0)}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isLoading || product.stock_quantity === 0}
          className="w-full mt-4 py-3 px-4 bg-transparent border border-gray-700 text-gray-300 font-medium rounded-lg
                     hover:border-primary-500 hover:text-primary-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]
                     disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
        >
          {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  )
}
