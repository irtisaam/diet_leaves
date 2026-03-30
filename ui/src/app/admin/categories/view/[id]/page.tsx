'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Tag, Package, Calendar, Edit, FileText, ImageIcon } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface Product {
  id: string
  name: string
  price: number
  image_url: string | null
  is_active: boolean
}

export default function ViewCategoryPage({ params }: { params: { id: string } }) {
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCategory()
    fetchCategoryProducts()
  }, [params.id])

  const fetchCategory = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/categories/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCategory(data)
      } else {
        setError('Category not found')
      }
    } catch (err) {
      setError('Failed to fetch category')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategoryProducts = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/products?category_id=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (err) {
      console.error('Failed to fetch products')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-dark-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Category not found'}</p>
          <Link href="/admin/categories" className="text-primary-500 hover:underline">
            Back to Categories
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/categories"
              className="p-2 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{category.name}</h1>
              <p className="text-gray-400">Category Details</p>
            </div>
          </div>
          <Link
            href={`/admin/categories/edit/${category.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit Category
          </Link>
        </div>

        {/* Category Image */}
        {category.image_url && (
          <div className="bg-dark-100 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary-500" />
              Category Image
            </h2>
            <div className="flex justify-center">
              <img
                src={category.image_url}
                alt={category.name}
                className="max-w-md w-full h-64 object-cover rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-dark-100 rounded-xl p-4 text-center">
            <Package className="h-6 w-6 text-primary-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{products.length}</p>
            <p className="text-sm text-gray-400">Products</p>
          </div>
          <div className="bg-dark-100 rounded-xl p-4 text-center">
            <Tag className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{category.sort_order}</p>
            <p className="text-sm text-gray-400">Sort Order</p>
          </div>
          <div className="bg-dark-100 rounded-xl p-4 text-center">
            <div className={`h-6 w-6 rounded-full mx-auto mb-2 flex items-center justify-center ${
              category.is_active ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              <div className={`h-3 w-3 rounded-full ${
                category.is_active ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
            </div>
            <p className="text-2xl font-bold text-white">{category.is_active ? 'Active' : 'Inactive'}</p>
            <p className="text-sm text-gray-400">Status</p>
          </div>
          <div className="bg-dark-100 rounded-xl p-4 text-center">
            <Calendar className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-white">{new Date(category.created_at).toLocaleDateString()}</p>
            <p className="text-sm text-gray-400">Created</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-dark-100 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-500" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Name</label>
              <p className="text-white font-medium">{category.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Slug</label>
              <p className="text-white font-mono bg-dark-200 px-3 py-1 rounded inline-block">{category.slug}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 block mb-1">Description</label>
              <p className="text-white">{category.description || 'No description provided'}</p>
            </div>
          </div>
        </div>

        {/* Meta Info */}
        <div className="bg-dark-100 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-500" />
            Meta Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Category ID</label>
              <p className="text-white font-mono text-sm">{category.id}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Parent Category</label>
              <p className="text-white">{category.parent_id || 'None (Top Level)'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Created At</label>
              <p className="text-white">{formatDate(category.created_at)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Last Updated</label>
              <p className="text-white">{formatDate(category.updated_at)}</p>
            </div>
          </div>
        </div>

        {/* Products in Category */}
        {products.length > 0 && (
          <div className="bg-dark-100 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary-500" />
              Products in this Category ({products.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.slice(0, 8).map((product) => (
                <Link
                  key={product.id}
                  href={`/admin/products/view/${product.id}`}
                  className="bg-dark-200 rounded-lg p-3 hover:bg-dark-300 transition-colors group"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                  ) : (
                    <div className="w-full h-24 bg-dark-300 rounded-lg mb-2 flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-600" />
                    </div>
                  )}
                  <p className="text-sm text-white font-medium truncate group-hover:text-primary-500 transition-colors">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-400">₹{Number(product.price).toFixed(0)}</p>
                </Link>
              ))}
            </div>
            {products.length > 8 && (
              <p className="text-center text-gray-400 text-sm mt-4">
                +{products.length - 8} more products
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
