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

  return (
    <Link href={`/products/${product.slug}`} className="product-card block rounded-xl overflow-hidden group">
      {/* Product Image */}
      <div className="relative aspect-square bg-dark-100 overflow-hidden">
        {/* Product Image */}
        {primaryImage ? (
          <Image
            src={primaryImage.image_url}
            alt={product.name}
            fill
            className="object-cover transform group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-200">
            <span className="text-white/60">No image</span>
          </div>
        )}

        {/* Sale Badge */}
        {product.is_on_sale && (
          <span className="sale-badge">SALE</span>
        )}

        {/* Quick Add Button - appears on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAddToCart}
            disabled={isLoading || product.stock_quantity === 0}
            className="w-full py-2 bg-primary text-black text-sm font-medium rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {product.stock_quantity === 0 ? 'Out of Stock' : 'Quick Add'}
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 bg-dark-100">
        <h3 className="text-white text-lg font-medium mb-1 truncate">{product.name}</h3>
        
        <div className="flex items-center gap-2">
          {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
            <span className="text-gray-500 line-through text-sm">
              Rs.{Number(product.compare_at_price).toFixed(0)}
            </span>
          )}
          <span className="text-primary font-bold text-lg">
            Rs.{Number(product.price).toFixed(0)}
          </span>
          <span className="text-gray-500 text-sm">PKR</span>
        </div>
      </div>
    </Link>
  )
}
