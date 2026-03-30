'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Plus, Edit, Trash2, Search, Tag, Eye } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/categories`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      const res = await fetch(`${API_URL}/api/admin/categories/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCategories(categories.filter(c => c.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Categories</h1>
              <p className="text-gray-400">Manage product categories</p>
            </div>
          </div>
          <Link
            href="/admin/categories/add"
            className="flex items-center gap-2 btn-primary"
          >
            <Plus className="h-5 w-5" />
            Add Category
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-100 border border-dark-200 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Categories Table */}
        {loading ? (
          <div className="bg-dark-100 rounded-xl p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-dark-100 rounded-xl p-8 text-center">
            <Tag className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No categories found</p>
            <Link href="/admin/categories/add" className="btn-primary inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add your first category
            </Link>
          </div>
        ) : (
          <div className="bg-dark-100 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-200">
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Image</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Name</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Slug</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Order</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Status</th>
                  <th className="text-right py-4 px-6 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="border-b border-dark-200 hover:bg-dark-200/50">
                    <td className="py-4 px-6">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-dark-200">
                        {category.image_url ? (
                          <Image
                            src={category.image_url}
                            alt={category.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tag className="h-5 w-5 text-gray-600" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-white font-medium">{category.name}</span>
                      {category.description && (
                        <p className="text-gray-500 text-sm mt-1 truncate max-w-xs">{category.description}</p>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <code className="text-gray-400 bg-dark-200 px-2 py-1 rounded text-sm">{category.slug}</code>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-400">{category.display_order}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded text-xs ${
                        category.is_active 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/categories/view/${category.id}`}
                          className="p-2 rounded-lg bg-dark-200 hover:bg-dark-300 transition-colors"
                        >
                          <Eye className="h-4 w-4 text-gray-400" />
                        </Link>
                        <Link
                          href={`/admin/categories/edit/${category.id}`}
                          className="p-2 rounded-lg bg-dark-200 hover:bg-dark-300 transition-colors"
                        >
                          <Edit className="h-4 w-4 text-gray-400" />
                        </Link>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="p-2 rounded-lg bg-dark-200 hover:bg-red-500/20 transition-colors group"
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
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
