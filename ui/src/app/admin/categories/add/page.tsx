'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Upload, X } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function AddCategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    display_order: 0,
    is_active: true
  })

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let imageUrl = null

      // Upload image if selected
      if (imageFile) {
        const uploadData = new FormData()
        uploadData.append('file', imageFile)
        uploadData.append('folder', 'categories')

        const uploadRes = await fetch(`${API_URL}/api/admin/upload/image`, {
          method: 'POST',
          body: uploadData
        })

        if (!uploadRes.ok) {
          throw new Error('Failed to upload image')
        }

        const uploadResult = await uploadRes.json()
        imageUrl = uploadResult.url
      }

      // Create category
      const categoryData = {
        ...formData,
        image_url: imageUrl
      }

      const res = await fetch(`${API_URL}/api/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to create category')
      }

      router.push('/admin/categories')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/categories" className="p-2 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Add Category</h1>
            <p className="text-gray-400">Create a new product category</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-dark-100 rounded-xl p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white"
                  placeholder="e.g., Stevia Drops"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white"
                  placeholder="e.g., stevia-drops"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white"
                placeholder="Category description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-5 h-5 rounded bg-dark-200 border-dark-300 text-primary focus:ring-primary"
                />
                <label htmlFor="is_active" className="text-sm text-gray-400">Active</label>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="bg-dark-100 rounded-xl p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white">Category Image</h2>

            {imagePreview ? (
              <div className="relative w-40 h-40 rounded-lg overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="Category preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-dark-300 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-8 w-8 text-gray-500 mb-2" />
                <span className="text-gray-400 text-sm">Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link
              href="/admin/categories"
              className="px-6 py-2 bg-dark-200 text-white rounded-lg hover:bg-dark-300 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
