'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Plus, Edit, Trash2, Search, Package, Eye } from 'lucide-react'

interface ProductImage {
  id: string
  image_url: string
  is_primary: boolean
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price: number | null
  stock_quantity: number
  is_active: boolean
  is_featured: boolean
  is_on_sale: boolean
  images: ProductImage[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/products`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      const res = await fetch(`${API_URL}/api/admin/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const getPrimaryImage = (product: Product) => {
    const primary = product.images?.find(img => img.is_primary)
    return primary?.image_url || product.images?.[0]?.image_url
  }

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-white">Products</h1>
              <p className="text-gray-500 text-sm">Manage your product catalog</p>
            </div>
          </div>
          <Link 
            href="/admin/products/add"
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Product
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900 rounded-xl border border-zinc-800">
            <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No products found</p>
            <p className="text-gray-600 mt-2">Add your first product to get started</p>
            <Link 
              href="/admin/products/add"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Product
            </Link>
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                          {getPrimaryImage(product) ? (
                            <Image
                              src={getPrimaryImage(product)!}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{product.name}</p>
                          <p className="text-gray-500 text-sm">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-white">Rs. {product.price}</span>
                        {product.compare_at_price && (
                          <span className="text-gray-500 text-sm line-through ml-2">
                            Rs. {product.compare_at_price}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`${product.stock_quantity < 10 ? 'text-red-400' : 'text-gray-300'}`}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          product.is_active 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {product.is_on_sale && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            Sale
                          </span>
                        )}
                        {product.is_featured && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link 
                          href={`/admin/products/view/${product.id}`}
                          className="p-2 rounded-lg hover:bg-zinc-700 transition-colors"
                        >
                          <Eye className="h-4 w-4 text-gray-400 hover:text-white" />
                        </Link>
                        <Link 
                          href={`/admin/products/${product.id}`}
                          className="p-2 rounded-lg hover:bg-zinc-700 transition-colors"
                        >
                          <Edit className="h-4 w-4 text-gray-400 hover:text-white" />
                        </Link>
                        <button 
                          onClick={() => deleteProduct(product.id)} 
                          className="p-2 rounded-lg hover:bg-zinc-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
