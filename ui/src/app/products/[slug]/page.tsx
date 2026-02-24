'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Share2 } from 'lucide-react'
import { productsAPI } from '@/lib/api'
import { Product, Review } from '@/types'
import { useCart } from '@/lib/context/CartContext'
import ProductCard from '@/components/product/ProductCard'

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const { addToCart, isLoading: cartLoading } = useCart()

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true)
      try {
        const data = await productsAPI.getBySlug(slug)
        setProduct(data as Product)

        // Fetch reviews
        const reviewsData = await productsAPI.getReviews((data as Product).id)
        setReviews(reviewsData as Review[])

        // Fetch related products
        const related = await productsAPI.getAll({ limit: 4 })
        setRelatedProducts(
          ((related as any).products || []).filter((p: Product) => p.id !== (data as Product).id).slice(0, 4)
        )
      } catch (error) {
        console.error('Failed to fetch product:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (slug) {
      fetchProduct()
    }
  }, [slug])

  const handleAddToCart = async () => {
    if (!product) return
    try {
      await addToCart(product.id, quantity)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  const handleBuyNow = async () => {
    if (!product) return
    try {
      await addToCart(product.id, quantity)
      window.location.href = '/checkout'
    } catch (error) {
      console.error('Failed to buy now:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse flex flex-col md:flex-row gap-12">
            <div className="w-full md:w-1/2 h-[500px] bg-dark-100 rounded-lg" />
            <div className="w-full md:w-1/2 space-y-4">
              <div className="h-8 bg-dark-100 rounded w-1/4" />
              <div className="h-12 bg-dark-100 rounded w-3/4" />
              <div className="h-6 bg-dark-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-dark py-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">Product not found</h1>
          <Link href="/shop" className="text-primary-400 hover:underline">
            Back to shop
          </Link>
        </div>
      </div>
    )
  }

  const currentImage = product.images?.[selectedImage] || product.images?.[0]

  return (
    <div className="min-h-screen bg-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Product Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative h-[500px] bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg overflow-hidden">
              {currentImage ? (
                <Image
                  src={currentImage.image_url}
                  alt={product.name}
                  fill
                  className="object-contain p-8"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/60">
                  No image available
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 flex-shrink-0 rounded border-2 overflow-hidden ${
                      selectedImage === index ? 'border-white' : 'border-dark-200'
                    }`}
                  >
                    <Image
                      src={img.image_url}
                      alt=""
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <p className="text-gray-400 uppercase text-sm tracking-wider">DIET LEAVES</p>
            
            <h1 className="text-4xl font-bold text-white">{product.name}</h1>

            {/* Price */}
            <div className="flex items-center gap-4">
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-gray-400 line-through text-xl">
                  Rs.{product.compare_at_price.toFixed(0)} PKR
                </span>
              )}
              <span className="text-white text-2xl font-bold">
                Rs.{product.price.toFixed(0)} PKR
              </span>
              {product.is_on_sale && (
                <span className="bg-dark-100 text-white px-3 py-1 text-sm rounded">
                  Sale
                </span>
              )}
            </div>

            <p className="text-gray-400">
              <Link href="/shipping" className="underline">Shipping</Link> calculated at checkout.
            </p>

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-white">Quantity</label>
              <div className="quantity-selector inline-flex">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                  <Minus className="h-4 w-4" />
                </button>
                <input 
                  type="number" 
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-white"
                />
                <button onClick={() => setQuantity(q => q + 1)}>
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Add to Cart & Buy Now */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={cartLoading || product.stock_quantity === 0}
                className="w-full btn-secondary disabled:opacity-50"
              >
                {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={cartLoading || product.stock_quantity === 0}
                className="w-full btn-primary disabled:opacity-50"
              >
                Buy it now
              </button>
            </div>

            {/* Nutritional Info */}
            {product.nutritional_info && (
              <div className="bg-blue-600/20 p-6 rounded-lg">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="text-red-500">0</span>
                  <span className="text-sm text-gray-400">Sugar & Calories</span>
                </h3>
                <h4 className="text-white font-semibold mb-2">Nutritional Facts</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Fat</span>
                    <span className="text-white">{product.nutritional_info.total_fat}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vitamin D</span>
                    <span className="text-white">{product.nutritional_info.vitamin_d}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cholesterol</span>
                    <span className="text-white">{product.nutritional_info.cholesterol}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Iron</span>
                    <span className="text-white">{product.nutritional_info.iron}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sodium</span>
                    <span className="text-white">{product.nutritional_info.sodium}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Calcium</span>
                    <span className="text-white">{product.nutritional_info.calcium}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Potassium</span>
                    <span className="text-white">{product.nutritional_info.potassium}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Sugar</span>
                    <span className="text-white">{product.nutritional_info.total_sugar}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Carbohydrate</span>
                    <span className="text-white">{product.nutritional_info.carbohydrate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Protein</span>
                    <span className="text-white">{product.nutritional_info.protein}%</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-blue-500/30">
                  <p className="text-xs text-gray-400">
                    Calories: {product.nutritional_info.calories} | Calories from fat: {product.nutritional_info.calories_from_fat}
                  </p>
                </div>

                {product.ingredients && (
                  <div className="mt-4 pt-4 border-t border-blue-500/30">
                    <h4 className="text-white font-semibold mb-2">Ingredients</h4>
                    <p className="text-sm text-gray-400">{product.ingredients}</p>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="pt-6 border-t border-dark-200">
                <h3 className="text-white font-bold text-xl mb-2">SWEETENS EVERYTHING</h3>
                <p className="text-gray-400">{product.description}</p>
              </div>
            )}

            {/* Share */}
            <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div className="mt-16 pt-16 border-t border-dark-200">
            <h2 className="text-2xl font-bold text-white mb-8">Customer Reviews</h2>
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-dark-100 p-6 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                    {review.is_verified_purchase && (
                      <span className="text-xs text-green-400">Verified Purchase</span>
                    )}
                  </div>
                  {review.title && <h4 className="text-white font-medium">{review.title}</h4>}
                  <p className="text-gray-400 mt-2">{review.review_text}</p>
                  <p className="text-gray-500 text-sm mt-4">
                    {review.customer_name || 'Anonymous'} - {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-16 border-t border-dark-200">
            <h2 className="text-2xl font-bold text-white mb-8">You may also like</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
