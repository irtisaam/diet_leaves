'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Share2, X, ChevronRight, ShieldCheck, Truck, Leaf } from 'lucide-react'
import { productsAPI } from '@/lib/api'
import { Product, Review } from '@/types'
import { useCart } from '@/lib/context/CartContext'
import ProductCard from '@/components/product/ProductCard'
import ProductReviews from '@/components/product/ProductReviews'

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showNutriLabel, setShowNutriLabel] = useState(false)

  const { addToCart, isLoading: cartLoading } = useCart()

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true)
      try {
        const data = await productsAPI.getBySlug(slug)
        setProduct(data as Product)

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
            <div className="w-full md:w-1/2 h-[500px] bg-dark-100 rounded-xl" />
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
          <Link href="/shop" className="text-primary hover:underline">
            Back to shop
          </Link>
        </div>
      </div>
    )
  }

  const currentImage = product.images?.[selectedImage] || product.images?.[0]

  // Parse nutritional image marker from description
  const nutritionalImageMatch = product.description?.match(/\[nutritional_image:(https?:\/\/[^\]]+)\]/)
  const nutritionalImageUrl = nutritionalImageMatch ? nutritionalImageMatch[1] : null
  const cleanDescription = product.description?.replace(/\[nutritional_image:[^\]]+\]/, '').trim()

  return (
    <div className="min-h-screen bg-dark py-8 md:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-400 truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          {/* Left — Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-dark-100 rounded-2xl overflow-hidden border border-dark-200/60 group">
              {currentImage ? (
                <Image
                  src={currentImage.image_url}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40">
                  <Leaf className="h-16 w-16" />
                </div>
              )}
              {product.is_on_sale && (
                <span className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 text-xs font-bold rounded-full tracking-wide">
                  SALE
                </span>
              )}
            </div>

            {/* Thumbnails Row */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images && product.images.map((img, index) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(index)}
                  className={`w-16 h-16 flex-shrink-0 rounded-xl border-2 overflow-hidden transition-all ${
                    selectedImage === index 
                      ? 'border-primary ring-2 ring-primary/30' 
                      : 'border-dark-200/60 hover:border-gray-500'
                  }`}
                >
                  <Image
                    src={img.image_url}
                    alt=""
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              {/* Nutritional Label as small thumbnail */}
              {nutritionalImageUrl && (
                <button
                  onClick={() => setShowNutriLabel(true)}
                  className="w-16 h-16 flex-shrink-0 rounded-xl border-2 border-emerald-600/50 hover:border-emerald-400 overflow-hidden transition-all relative group"
                  title="View Nutritional Label"
                >
                  <Image
                    src={nutritionalImageUrl}
                    alt="Nutrition"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100"
                  />
                  <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white leading-tight text-center">NUTRI<br/>LABEL</span>
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Right — Product Info */}
          <div className="space-y-6">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <span className="text-primary text-xs font-bold tracking-[0.2em] uppercase bg-primary/10 px-3 py-1 rounded-full">
                Diet Leaves
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">{product.name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-primary text-3xl font-bold">
                Rs.{Number(product.price).toFixed(0)}
              </span>
              {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
                <>
                  <span className="text-gray-500 line-through text-lg">
                    Rs.{Number(product.compare_at_price).toFixed(0)}
                  </span>
                  <span className="text-red-400 text-sm font-semibold">
                    {Math.round((1 - Number(product.price) / Number(product.compare_at_price)) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            <p className="text-gray-500 text-sm">
              <Link href="/shipping" className="underline hover:text-primary transition-colors">Shipping</Link> calculated at checkout.
            </p>

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">Quantity</label>
              <div className="inline-flex items-center bg-dark-100 border border-dark-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-3 text-gray-400 hover:text-white hover:bg-dark-200 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input 
                  type="number" 
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 text-center bg-transparent text-white font-semibold text-sm border-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="p-3 text-gray-400 hover:text-white hover:bg-dark-200 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Add to Cart & Buy Now */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={cartLoading || product.stock_quantity === 0}
                className="flex-1 py-3.5 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={cartLoading || product.stock_quantity === 0}
                className="flex-1 py-3.5 rounded-xl bg-primary text-dark font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Buy it Now
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Leaf, text: '100% Natural' },
                { icon: ShieldCheck, text: 'Quality Assured' },
                { icon: Truck, text: 'Fast Delivery' },
              ].map(b => (
                <div key={b.text} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-dark-100/60 border border-dark-200/40">
                  <b.icon className="h-4 w-4 text-primary/80" />
                  <span className="text-[10px] text-gray-400 font-medium">{b.text}</span>
                </div>
              ))}
            </div>

            {/* Nutritional Info Card */}
            {product.nutritional_info && (
              <div className="bg-gradient-to-br from-emerald-950/40 to-dark-100/80 p-5 rounded-2xl border border-emerald-800/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-primary" />
                    Nutritional Facts
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                      {product.nutritional_info.calories} cal
                    </span>
                    {nutritionalImageUrl && (
                      <button
                        onClick={() => setShowNutriLabel(true)}
                        className="text-xs text-primary hover:text-primary/80 underline"
                      >
                        View Label
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                  {[
                    ['Total Fat', product.nutritional_info.total_fat],
                    ['Cholesterol', product.nutritional_info.cholesterol],
                    ['Sodium', product.nutritional_info.sodium],
                    ['Carbohydrate', product.nutritional_info.carbohydrate],
                    ['Total Sugar', product.nutritional_info.total_sugar],
                    ['Protein', product.nutritional_info.protein],
                    ['Vitamin D', product.nutritional_info.vitamin_d],
                    ['Iron', product.nutritional_info.iron],
                    ['Calcium', product.nutritional_info.calcium],
                    ['Potassium', product.nutritional_info.potassium],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex justify-between py-1 border-b border-emerald-900/20">
                      <span className="text-gray-500">{label}</span>
                      <span className="text-gray-300 font-medium">{val}%</span>
                    </div>
                  ))}
                </div>
                {product.ingredients && (
                  <div className="mt-3 pt-3 border-t border-emerald-900/30">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">Ingredients</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{product.ingredients}</p>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {cleanDescription && (
              <div className="pt-4 border-t border-dark-200/60">
                <h3 className="text-white font-bold text-lg mb-2">About This Product</h3>
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{cleanDescription}</p>
              </div>
            )}

            {/* Share */}
            <button className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors text-sm">
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Nutritional Label Lightbox */}
        {showNutriLabel && nutritionalImageUrl && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNutriLabel(false)}
          >
            <div
              className="relative max-w-md w-full bg-dark-100 rounded-2xl border border-dark-200 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-dark-200">
                <p className="text-sm text-white font-semibold">Nutritional Label</p>
                <button
                  onClick={() => setShowNutriLabel(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Image
                src={nutritionalImageUrl}
                alt="Nutritional information"
                width={400}
                height={520}
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <ProductReviews productId={product.id} productName={product.name} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-16 border-t border-dark-200/60">
            <h2 className="text-2xl font-bold text-white mb-8">You May Also Like</h2>
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
