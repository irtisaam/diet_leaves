'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, GripVertical, Menu } from 'lucide-react'

interface NavItem {
  id: string
  label: string
  url: string
  display_order: number
  is_active: boolean
}

export default function AdminNavigationPage() {
  const [navItems, setNavItems] = useState<NavItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNavItems()
  }, [])

  const fetchNavItems = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/navigation')
      if (res.ok) {
        const data = await res.json()
        setNavItems(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch navigation:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteNavItem = async (id: string) => {
    if (!confirm('Delete this navigation item?')) return
    try {
      const res = await fetch(`http://localhost:8000/api/admin/navigation/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setNavItems(navItems.filter(n => n.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white neon-text">Navigation</h1>
              <p className="text-gray-400">Manage menu items</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors neon-border">
            <Plus className="h-5 w-5" />
            Add Item
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        ) : navItems.length === 0 ? (
          <div className="text-center py-20 bg-dark-100 rounded-xl border border-gray-800">
            <Menu className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No navigation items</p>
          </div>
        ) : (
          <div className="bg-dark-100 rounded-xl border border-gray-800 overflow-hidden">
            {navItems.sort((a, b) => a.display_order - b.display_order).map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 border-b border-gray-800 last:border-b-0 hover:bg-dark-200 transition-colors">
                <GripVertical className="h-5 w-5 text-gray-600 cursor-grab" />
                <div className="flex-1">
                  <p className="text-white font-medium">{item.label}</p>
                  <p className="text-gray-500 text-sm">{item.url}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${item.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </span>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg hover:bg-dark-300 transition-colors">
                    <Edit className="h-4 w-4 text-gray-400 hover:text-primary-500" />
                  </button>
                  <button onClick={() => deleteNavItem(item.id)} className="p-2 rounded-lg hover:bg-dark-300 transition-colors">
                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
