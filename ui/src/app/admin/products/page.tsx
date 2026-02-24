'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, Search } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  stock_quantity: number
  is_active: boolean
  is_featured: boolean
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/products')
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
      const res = await fetch(`http://localhost:8000/api/admin/products/${id}`, { method: 'DELETE' })
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white neon-text">Products</h1>
              <p className="text-gray-400">Manage your product catalog</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors neon-border">
            <Plus className="h-5 w-5" />
            Add Product
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-dark-100 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-dark-100 rounded-xl border border-gray-800">
            <p className="text-gray-400 text-lg">No products found</p>
            <p className="text-gray-500 mt-2">Add your first product to get started</p>
          </div>
        ) : (
          <div className="bg-dark-100 rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-dark-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-dark-200 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-gray-500 text-sm">{product.slug}</p>
                    </td>
                    <td className="px-6 py-4 text-white">Rs. {product.price}</td>
                    <td className="px-6 py-4">
                      <span className={`${product.stock_quantity < 10 ? 'text-red-400' : 'text-green-400'}`}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${product.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 rounded-lg hover:bg-dark-300 transition-colors">
                          <Edit className="h-4 w-4 text-gray-400 hover:text-primary-500" />
                        </button>
                        <button onClick={() => deleteProduct(product.id)} className="p-2 rounded-lg hover:bg-dark-300 transition-colors">
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
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
