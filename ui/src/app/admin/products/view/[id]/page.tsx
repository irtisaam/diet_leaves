'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, Edit, Package, Tag, DollarSign, 
  BarChart3, Info, Check, X, Star, TrendingUp 
} from 'lucide-react'

interface ProductImage {
  id: string
  image_url: string
  is_primary: boolean
}

interface NutritionalInfo {
  calories: number
  calories_from_fat: number
  total_fat: number
  cholesterol: number
  sodium: number
  potassium: number
  carbohydrate: number
  protein: number
  vitamin_d: number
  iron: number
  calcium: number
  total_sugar: number
}

interface Product {
  id: string
  name: string
  slug: string
  description: string
  short_description: string
  price: number
  compare_at_price: number | null
  cost_price: number | null
  stock_quantity: number
  sku: string | null
  barcode: string | null
  is_active: boolean
  is_featured: boolean
  is_on_sale: boolean
  weight: number | null
  category_id: string | null
  images: ProductImage[]
  nutritional_info: NutritionalInfo | null
  ingredients: string | null
  servings_per_container: string | null
  created_at: string
  updated_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function AdminProductViewPage() {
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/products/${productId}`)
      if (res.ok) {
        const data = await res.json()
        setProduct(data)
      }
    } catch (error) {
      console.error('Failed to fetch product:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-dark py-8 text-center">
        <h1 className="text-2xl text-white">Product not found</h1>
        <Link href="/admin/products" className="text-primary hover:underline mt-4 inline-block">
          Back to Products
        </Link>
      </div>
    )
  }

  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]
  const currentImage = product.images?.[selectedImage] || primaryImage

  return (
    <div className="min-h-screen bg-dark py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/products" className="p-2 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{product.name}</h1>
              <p className="text-gray-400">Product Details</p>
            </div>
          </div>
          <Link href={`/admin/products/${product.id}`} className="btn-primary flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Product
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-dark-100 rounded-xl p-4 border border-dark-200">
              <div className="aspect-square relative rounded-lg overflow-hidden bg-dark-200">
                {currentImage ? (
                  <Image
                    src={currentImage.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <Package className="h-16 w-16" />
                  </div>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto">
                  {product.images.map((img, index) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                        selectedImage === index ? 'border-primary' : 'border-dark-200'
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

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-dark-100 rounded-xl p-4 border border-dark-200 text-center">
                <DollarSign className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">Rs.{Number(product.price).toFixed(0)}</p>
                <p className="text-gray-400 text-sm">Price</p>
              </div>
              <div className="bg-dark-100 rounded-xl p-4 border border-dark-200 text-center">
                <BarChart3 className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{product.stock_quantity}</p>
                <p className="text-gray-400 text-sm">Stock</p>
              </div>
              <div className="bg-dark-100 rounded-xl p-4 border border-dark-200 text-center">
                <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {product.compare_at_price 
                    ? `${Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100)}%`
                    : '0%'
                  }
                </p>
                <p className="text-gray-400 text-sm">Discount</p>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Basic Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Slug</p>
                    <p className="text-white">{product.slug}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">SKU</p>
                    <p className="text-white">{product.sku || '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Short Description</p>
                  <p className="text-white">{product.short_description || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Description</p>
                  <p className="text-white whitespace-pre-wrap">
                    {product.description?.replace(/\[nutritional_image:[^\]]+\]/, '').trim() || '-'}
                  </p>
                </div>
                {product.description?.match(/\[nutritional_image:(https?:\/\/[^\]]+)\]/) && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Nutritional Label Image</p>
                    <Image
                      src={product.description.match(/\[nutritional_image:(https?:\/\/[^\]]+)\]/)![1]}
                      alt="Nutritional label"
                      width={300}
                      height={350}
                      className="rounded-lg border border-dark-200"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Status Badges */}
            <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Status
              </h2>
              <div className="flex flex-wrap gap-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  product.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {product.is_active ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  {product.is_active ? 'Active' : 'Inactive'}
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  product.is_featured ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  <Star className="h-4 w-4" />
                  {product.is_featured ? 'Featured' : 'Not Featured'}
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  product.is_on_sale ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  <Tag className="h-4 w-4" />
                  {product.is_on_sale ? 'On Sale' : 'Regular Price'}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Pricing
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Price</p>
                  <p className="text-2xl font-bold text-primary">Rs.{Number(product.price).toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Compare at Price</p>
                  <p className="text-xl text-white">
                    {product.compare_at_price ? `Rs.${Number(product.compare_at_price).toFixed(0)}` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Cost Price</p>
                  <p className="text-xl text-white">
                    {product.cost_price ? `Rs.${Number(product.cost_price).toFixed(0)}` : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Nutritional Info */}
            {product.nutritional_info && (
              <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
                <h2 className="text-lg font-semibold text-white mb-4">Nutritional Information</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Calories</span>
                    <span className="text-white">{product.nutritional_info.calories}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Calories from Fat</span>
                    <span className="text-white">{product.nutritional_info.calories_from_fat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Fat</span>
                    <span className="text-white">{product.nutritional_info.total_fat}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cholesterol</span>
                    <span className="text-white">{product.nutritional_info.cholesterol}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sodium</span>
                    <span className="text-white">{product.nutritional_info.sodium}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Potassium</span>
                    <span className="text-white">{product.nutritional_info.potassium}%</span>
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
                
                {product.ingredients && (
                  <div className="mt-4 pt-4 border-t border-dark-200">
                    <p className="text-gray-400 text-sm">Ingredients</p>
                    <p className="text-white mt-1">{product.ingredients}</p>
                  </div>
                )}
              </div>
            )}

            {/* Meta Info */}
            <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
              <h2 className="text-lg font-semibold text-white mb-4">Meta Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Created</span>
                  <span className="text-white">{new Date(product.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Updated</span>
                  <span className="text-white">{new Date(product.updated_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Product ID</span>
                  <span className="text-white font-mono text-xs">{product.id}</span>
                </div>
              </div>
            </div>

            {/* View on Site */}
            <Link 
              href={`/products/${product.slug}`}
              target="_blank"
              className="block w-full text-center py-3 bg-dark-200 text-white rounded-lg hover:bg-dark-300 transition-colors"
            >
              View on Website →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
