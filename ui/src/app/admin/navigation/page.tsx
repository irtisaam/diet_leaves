'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, GripVertical, Menu, X, Save } from 'lucide-react'

interface NavItem {
  id: string
  label: string
  url: string
  display_order: number
  is_active: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const emptyNav: Partial<NavItem> = {
  label: '',
  url: '',
  display_order: 0,
  is_active: true
}

export default function AdminNavigationPage() {
  const [navItems, setNavItems] = useState<NavItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<NavItem | null>(null)
  const [form, setForm] = useState<Partial<NavItem>>(emptyNav)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchNavItems()
  }, [])

  const fetchNavItems = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/navigation`)
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
      const res = await fetch(`${API_URL}/api/admin/navigation/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setNavItems(navItems.filter(n => n.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const openAddModal = () => {
    setEditing(null)
    setForm({ ...emptyNav, display_order: navItems.length })
    setShowModal(true)
  }

  const openEditModal = (item: NavItem) => {
    setEditing(item)
    setForm(item)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setForm(emptyNav)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editing 
        ? `${API_URL}/api/admin/navigation/${editing.id}`
        : `${API_URL}/api/admin/navigation`
      const method = editing ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      
      if (res.ok) {
        await fetchNavItems()
        closeModal()
      } else {
        const err = await res.json()
        alert(err.detail || 'Failed to save')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Failed to save navigation item')
    } finally {
      setSaving(false)
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
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors neon-border"
          >
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
                  <button onClick={() => openEditModal(item)} className="p-2 rounded-lg hover:bg-dark-300 transition-colors">
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 rounded-xl border border-gray-800 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">
                {editing ? 'Edit Navigation Item' : 'Add Navigation Item'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-dark-200 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Label</label>
                <input
                  type="text"
                  value={form.label || ''}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="w-full bg-dark-200 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Menu Label"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">URL</label>
                <input
                  type="text"
                  value={form.url || ''}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full bg-dark-200 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="/shop"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Order</label>
                <input
                  type="number"
                  value={form.display_order || 0}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full bg-dark-200 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active !== false}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-400">Active</span>
                </label>
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
