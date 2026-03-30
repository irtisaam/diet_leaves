'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, Image as ImageIcon, Video, X, Save, Upload, Info } from 'lucide-react'

interface HeroSection {
  id: string
  title: string
  subtitle: string
  media_type: string
  media_url: string
  link_url: string
  link_text: string
  is_active: boolean
  display_order: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const emptyHero: Partial<HeroSection> = {
  title: '',
  subtitle: '',
  media_type: 'image',
  media_url: '',
  link_url: '',
  link_text: '',
  is_active: true,
  display_order: 0
}

export default function AdminHeroPage() {
  const [heroes, setHeroes] = useState<HeroSection[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<HeroSection | null>(null)
  const [form, setForm] = useState<Partial<HeroSection>>(emptyHero)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchHeroes()
  }, [])

  const fetchHeroes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/hero`)
      if (res.ok) {
        const data = await res.json()
        setHeroes(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch hero sections:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteHero = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hero section?')) return
    try {
      const res = await fetch(`${API_URL}/api/admin/hero/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setHeroes(heroes.filter(h => h.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const openAddModal = () => {
    setEditing(null)
    setForm(emptyHero)
    setShowModal(true)
  }

  const openEditModal = (hero: HeroSection) => {
    setEditing(hero)
    setForm(hero)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setForm(emptyHero)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('folder', 'hero')

      const res = await fetch(`${API_URL}/api/admin/upload/image`, {
        method: 'POST',
        body: uploadData
      })

      if (res.ok) {
        const data = await res.json()
        setForm(prev => ({ ...prev, media_url: data.url }))
      } else {
        alert('Failed to upload image')
      }
    } catch (error) {
      console.error('Failed to upload:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editing 
        ? `${API_URL}/api/admin/hero/${editing.id}`
        : `${API_URL}/api/admin/hero`
      const method = editing ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      
      if (res.ok) {
        await fetchHeroes()
        closeModal()
      } else {
        const err = await res.json()
        alert(err.detail || 'Failed to save')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Failed to save hero section')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white neon-text">Hero Sections</h1>
              <p className="text-gray-400">Manage homepage hero slides</p>
            </div>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors neon-border"
          >
            <Plus className="h-5 w-5" />
            Add Hero
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        ) : heroes.length === 0 ? (
          <div className="text-center py-20 bg-dark-100 rounded-xl border border-gray-800">
            <ImageIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No hero sections yet</p>
            <p className="text-gray-500 mt-2">Add a hero section to showcase on your homepage</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {heroes.map((hero) => (
              <div key={hero.id} className="bg-dark-100 rounded-xl border border-gray-800 overflow-hidden hover:border-primary-500/30 transition-colors">
                <div className="aspect-video bg-dark-200 relative">
                  {hero.media_type === 'video' ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Video className="h-12 w-12 text-gray-600" />
                    </div>
                  ) : hero.media_url ? (
                    <img src={hero.media_url} alt={hero.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-600" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${hero.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {hero.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold">{hero.title || 'No title'}</h3>
                  <p className="text-gray-500 text-sm mt-1">{hero.subtitle || 'No subtitle'}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-500">Order: {hero.display_order}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openEditModal(hero)}
                        className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
                      >
                        <Edit className="h-4 w-4 text-gray-400 hover:text-primary-500" />
                      </button>
                      <button onClick={() => deleteHero(hero.id)} className="p-2 rounded-lg hover:bg-dark-200 transition-colors">
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 rounded-xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">
                {editing ? 'Edit Hero Section' : 'Add Hero Section'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-dark-200 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title || ''}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-dark-200 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Hero title"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Subtitle</label>
                <textarea
                  value={form.subtitle || ''}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full bg-dark-200 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  rows={2}
                  placeholder="Hero subtitle"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Media Type</label>
                <select
                  value={form.media_type || 'image'}
                  onChange={(e) => setForm({ ...form, media_type: e.target.value })}
                  className="w-full bg-dark-200 border border-gray-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Hero Image</label>
                <div className="space-y-2">
                  {form.media_url ? (
                    <div className="relative">
                      <img src={form.media_url} alt="Hero preview" className="w-full h-40 object-cover rounded-lg border border-gray-700" />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, media_url: '' })}
                        className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-40 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors"
                    >
                      <Upload className="h-8 w-8 text-gray-500 mb-2" />
                      <span className="text-gray-400 text-sm">
                        {uploading ? 'Uploading...' : 'Click to upload image'}
                      </span>
                      <span className="text-gray-600 text-xs mt-1">JPEG, PNG, WebP (max 5MB)</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="flex items-start gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-300">
                      Images are uploaded to Supabase Storage in the &quot;hero&quot; folder of the &quot;product-images&quot; bucket.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={form.link_text || ''}
                    onChange={(e) => setForm({ ...form, link_text: e.target.value })}
                    className="w-full bg-dark-200 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    placeholder="Shop Now"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Button Link</label>
                  <input
                    type="text"
                    value={form.link_url || ''}
                    onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                    className="w-full bg-dark-200 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    placeholder="/shop"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={form.display_order || 0}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full bg-dark-200 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer mt-6">
                    <input
                      type="checkbox"
                      checked={form.is_active !== false}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-gray-400">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
