'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react'

interface Banner {
  id: string
  title: string
  description: string
  image_url: string
  link_url: string
  position: string
  is_active: boolean
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/banners')
      if (res.ok) {
        const data = await res.json()
        setBanners(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Delete this banner?')) return
    try {
      const res = await fetch(`http://localhost:8000/api/admin/banners/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setBanners(banners.filter(b => b.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete:', error)
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
              <h1 className="text-3xl font-bold text-white neon-text">Banners</h1>
              <p className="text-gray-400">Manage promotional banners</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors neon-border">
            <Plus className="h-5 w-5" />
            Add Banner
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-20 bg-dark-100 rounded-xl border border-gray-800">
            <ImageIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No banners yet</p>
            <p className="text-gray-500 mt-2">Create banners to promote products or sales</p>
          </div>
        ) : (
          <div className="space-y-4">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-dark-100 rounded-xl border border-gray-800 overflow-hidden hover:border-primary-500/30 transition-colors">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-64 h-40 bg-dark-200 flex-shrink-0">
                    {banner.image_url ? (
                      <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-white font-semibold">{banner.title || 'Untitled'}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs ${banner.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {banner.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm">{banner.description || 'No description'}</p>
                      <p className="text-gray-600 text-xs mt-2">Position: {banner.position}</p>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button className="p-2 rounded-lg hover:bg-dark-200 transition-colors">
                        <Edit className="h-4 w-4 text-gray-400 hover:text-primary-500" />
                      </button>
                      <button onClick={() => deleteBanner(banner.id)} className="p-2 rounded-lg hover:bg-dark-200 transition-colors">
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
    </div>
  )
}
