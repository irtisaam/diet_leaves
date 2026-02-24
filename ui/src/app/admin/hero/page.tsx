'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, Image as ImageIcon, Video } from 'lucide-react'

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

export default function AdminHeroPage() {
  const [heroes, setHeroes] = useState<HeroSection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHeroes()
  }, [])

  const fetchHeroes = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/hero')
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
      const res = await fetch(`http://localhost:8000/api/admin/hero/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setHeroes(heroes.filter(h => h.id !== id))
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
              <h1 className="text-3xl font-bold text-white neon-text">Hero Sections</h1>
              <p className="text-gray-400">Manage homepage hero slides</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors neon-border">
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
                  ) : (
                    <img src={hero.media_url} alt={hero.title} className="w-full h-full object-cover" />
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
                      <button className="p-2 rounded-lg hover:bg-dark-200 transition-colors">
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
    </div>
  )
}
