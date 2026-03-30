'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Plus, 
  Trash2,
  GripVertical,
  Star,
  Save,
  Loader2
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

interface InventoryItemSimple {
  id: string
  name: string
  unit: string
  unit_cost: number
}

interface ProductMappingRow {
  inventory_item_id: string
  item_name: string
  unit: string
  quantity_per_unit: string
}

interface ProductImage {
  id?: string
  image_url: string
  alt_text: string
  is_primary: boolean
  display_order: number
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

interface ProductFormData {
  name: string
  slug: string
  description: string
  short_description: string
  category_id: string
  price: number
  compare_at_price: number | null
  currency: string
  sku: string
  stock_quantity: number
  is_active: boolean
  is_featured: boolean
  is_on_sale: boolean
  ingredients: string
  servings_per_container: number | null
  nutritional_info: NutritionalInfo
}

const defaultNutritionalInfo: NutritionalInfo = {
  calories: 0,
  calories_from_fat: 0,
  total_fat: 0,
  cholesterol: 0,
  sodium: 0,
  potassium: 0,
  carbohydrate: 0,
  protein: 0,
  vitamin_d: 0,
  iron: 0,
  calcium: 0,
  total_sugar: 0
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function AddProductPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nutritionalImgRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [images, setImages] = useState<ProductImage[]>([])
  const [nutritionalImage, setNutritionalImage] = useState<string>('')
  const [inventoryItems, setInventoryItems] = useState<InventoryItemSimple[]>([])
  const [productMappings, setProductMappings] = useState<ProductMappingRow[]>([])
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    category_id: '',
    price: 0,
    compare_at_price: null,
    currency: 'PKR',
    sku: '',
    stock_quantity: 0,
    is_active: true,
    is_featured: false,
    is_on_sale: false,
    ingredients: '',
    servings_per_container: null,
    nutritional_info: defaultNutritionalInfo
  })

  useEffect(() => {
    fetchCategories()
    fetchInventoryItems()
  }, [])

  const fetchInventoryItems = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/inventory`)
      if (res.ok) {
        const data = await res.json()
        setInventoryItems(Array.isArray(data) ? data : [])
      }
    } catch {}
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/categories`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const addMapping = () => {
    setProductMappings(prev => [...prev, { inventory_item_id: '', item_name: '', unit: '', quantity_per_unit: '1' }])
  }

  const removeMapping = (index: number) => {
    setProductMappings(prev => prev.filter((_, i) => i !== index))
  }

  const updateMapping = (index: number, field: string, value: string) => {
    setProductMappings(prev => prev.map((m, i) => {
      if (i !== index) return m
      if (field === 'inventory_item_id') {
        const item = inventoryItems.find(it => it.id === value)
        return { ...m, inventory_item_id: value, item_name: item?.name || '', unit: item?.unit || '' }
      }
      return { ...m, [field]: value }
    }))
  }

  const computedCost = productMappings.reduce((sum, m) => {
    const item = inventoryItems.find(it => it.id === m.inventory_item_id)
    return sum + (item?.unit_cost || 0) * (parseFloat(m.quantity_per_unit) || 0)
  }, 0)

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'products')

        const res = await fetch(`${API_URL}/api/admin/upload/image`, {
          method: 'POST',
          body: formData
        })

        if (res.ok) {
          const data = await res.json()
          setImages(prev => [...prev, {
            image_url: data.url,
            alt_text: file.name.replace(/\.[^/.]+$/, ''),
            is_primary: prev.length === 0,
            display_order: prev.length
          }])
        }
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleNutritionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('folder', 'nutritional')

      const res = await fetch(`${API_URL}/api/admin/upload/image`, {
        method: 'POST',
        body: uploadData
      })

      if (res.ok) {
        const data = await res.json()
        setNutritionalImage(data.url)
      }
    } catch (error) {
      console.error('Failed to upload nutritional image:', error)
      alert('Failed to upload nutritional image')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index)
      // Reset primary if removed
      if (prev[index].is_primary && newImages.length > 0) {
        newImages[0].is_primary = true
      }
      return newImages.map((img, i) => ({ ...img, display_order: i }))
    })
  }

  const setPrimaryImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      is_primary: i === index
    })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Product name is required')
      return
    }
    
    if (formData.price <= 0) {
      alert('Price must be greater than 0')
      return
    }

    if (images.length === 0) {
      alert('At least one product image is required')
      return
    }

    setLoading(true)
    try {
      const productData = {
        ...formData,
        category_id: formData.category_id || null,
        compare_at_price: formData.compare_at_price || null,
        images: images.map(img => ({
          image_url: img.image_url,
          alt_text: img.alt_text,
          is_primary: img.is_primary,
          display_order: img.display_order
        })),
        // Store nutritional image in description or as separate field
        description: nutritionalImage 
          ? `${formData.description}\n\n[nutritional_image:${nutritionalImage}]`
          : formData.description
      }

      const res = await fetch(`${API_URL}/api/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })

      if (res.ok) {
        const createdProduct = await res.json()
        const newProductId = createdProduct.id
        // Save inventory mappings (best-effort)
        const validMappings = productMappings.filter(m => m.inventory_item_id && parseFloat(m.quantity_per_unit) > 0)
        if (validMappings.length > 0 && newProductId) {
          try {
            await fetch(`${API_URL}/api/admin/inventory/product-mappings/bulk/${newProductId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(validMappings.map(m => ({
                inventory_item_id: m.inventory_item_id,
                quantity_per_unit: parseFloat(m.quantity_per_unit)
              })))
            })
          } catch (e) {
            console.error('Failed to save inventory mappings:', e)
          }
        }
        router.push('/admin/products')
      } else {
        const error = await res.json()
        alert(error.detail || 'Failed to create product')
      }
    } catch (error) {
      console.error('Failed to create product:', error)
      alert('Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/admin/products" 
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-white">Add New Product</h1>
            <p className="text-gray-500 text-sm">Fill in the product details below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-medium text-white mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Nova Liquid Sweetener"
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="auto-generated-from-name"
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Short Description
                </label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                  placeholder="e.g., ORIGINAL SWEETENER"
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-white transition-colors"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed product description for the product page..."
                  rows={4}
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-medium text-white mb-6">Product Images</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div 
                  key={index}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                    img.is_primary ? 'border-white' : 'border-zinc-700'
                  }`}
                >
                  <Image
                    src={img.image_url}
                    alt={img.alt_text}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(index)}
                      className={`p-2 rounded-full ${img.is_primary ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-white hover:text-black'} transition-colors`}
                      title="Set as primary"
                    >
                      <Star className="h-4 w-4" fill={img.is_primary ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {img.is_primary && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-white text-black text-xs font-medium rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-lg border-2 border-dashed border-zinc-700 hover:border-white flex flex-col items-center justify-center gap-2 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-400">Upload</span>
                  </>
                )}
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            
            <p className="text-gray-500 text-sm mt-4">
              Upload product images. The first image or marked as primary will be shown in listings.
            </p>
          </div>

          {/* Pricing */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-medium text-white mb-6">Pricing & Inventory</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price *
                </label>
                <div className="flex">
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="px-3 py-3 bg-zinc-800 border border-zinc-700 border-r-0 rounded-l-lg text-white focus:outline-none"
                  >
                    <option value="PKR">PKR</option>
                    <option value="USD">USD</option>
                  </select>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="flex-1 px-4 py-3 bg-black border border-zinc-700 rounded-r-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Compare at Price
                </label>
                <input
                  type="number"
                  value={formData.compare_at_price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, compare_at_price: parseFloat(e.target.value) || null }))}
                  placeholder="Original price (for sale)"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Product SKU"
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>

            {/* Status Toggles */}
            <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-zinc-800">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-5 h-5 rounded border-zinc-700 bg-black text-white focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-gray-300">Active</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="w-5 h-5 rounded border-zinc-700 bg-black text-white focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-gray-300">Featured</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_on_sale}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_on_sale: e.target.checked }))}
                  className="w-5 h-5 rounded border-zinc-700 bg-black text-white focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-gray-300">On Sale</span>
              </label>
            </div>
          </div>

          {/* Inventory & Costing */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-white">Inventory &amp; Costing</h2>
                <p className="text-gray-500 text-sm mt-0.5">Link raw ingredients/components consumed per unit sold</p>
              </div>
              <button
                type="button"
                onClick={addMapping}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-800 text-white text-sm rounded-lg hover:bg-zinc-700 border border-zinc-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>
            {productMappings.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-6 border border-dashed border-zinc-800 rounded-lg">
                No inventory items linked. Add items to automatically calculate product cost.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 px-1 mb-1">
                  <span className="col-span-6 text-xs text-gray-500">Inventory Item</span>
                  <span className="col-span-3 text-xs text-gray-500">Qty / Unit</span>
                  <span className="col-span-2 text-xs text-gray-500">Unit</span>
                </div>
                {productMappings.map((mapping, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center bg-zinc-800 rounded-lg p-2">
                    <select
                      value={mapping.inventory_item_id}
                      onChange={e => updateMapping(index, 'inventory_item_id', e.target.value)}
                      className="col-span-6 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:border-white"
                    >
                      <option value="">Select item…</option>
                      {inventoryItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={mapping.quantity_per_unit}
                      onChange={e => updateMapping(index, 'quantity_per_unit', e.target.value)}
                      placeholder="1"
                      min="0"
                      step="0.001"
                      className="col-span-3 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:border-white"
                    />
                    <span className="col-span-2 text-gray-400 text-sm">{mapping.unit || '—'}</span>
                    <button type="button" onClick={() => removeMapping(index)} className="col-span-1 text-red-400 hover:text-red-300 flex justify-center">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {computedCost > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-gray-400 text-sm">Estimated cost per unit</span>
                <span className="text-white font-semibold">PKR {computedCost.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Nutritional Info */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-medium text-white mb-6">Nutritional Information</h2>
            
            {/* Nutritional Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nutritional Facts Image
              </label>
              <div className="flex items-start gap-4">
                {nutritionalImage ? (
                  <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-zinc-700">
                    <Image
                      src={nutritionalImage}
                      alt="Nutritional Facts"
                      fill
                      className="object-contain bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setNutritionalImage('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => nutritionalImgRef.current?.click()}
                    className="w-48 h-32 rounded-lg border-2 border-dashed border-zinc-700 hover:border-white flex flex-col items-center justify-center gap-2 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-sm text-gray-400">Upload Image</span>
                  </button>
                )}
                <input
                  ref={nutritionalImgRef}
                  type="file"
                  accept="image/*"
                  onChange={handleNutritionalImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Manual Nutritional Values */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(formData.nutritional_info).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-400 mb-1 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      nutritional_info: {
                        ...prev.nutritional_info,
                        [key]: parseFloat(e.target.value) || 0
                      }
                    }))}
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ingredients
              </label>
              <textarea
                value={formData.ingredients}
                onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
                placeholder="Water, Stevia (E960), Sucralose (E955)..."
                rows={2}
                className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors resize-none"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Servings per Container
              </label>
              <input
                type="number"
                value={formData.servings_per_container || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, servings_per_container: parseInt(e.target.value) || null }))}
                placeholder="e.g., 30"
                min="0"
                className="w-full max-w-xs px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/admin/products"
              className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Create Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
