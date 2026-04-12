'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Edit, Trash2, ToggleLeft, ToggleRight,
  Tag, Percent, DollarSign, Calendar, Hash, Save, X, Search,
  BarChart2, TrendingUp,
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface PromoCode {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'flat'
  discount_value: number
  min_order_amount: number
  max_discount_amount: number | null
  usage_limit: number | null
  usage_count: number
  is_active: boolean
  valid_from: string | null
  valid_until: string | null
  created_at: string
  updated_at: string
}

interface PromoForm {
  code: string
  description: string
  discount_type: 'percentage' | 'flat'
  discount_value: string
  min_order_amount: string
  max_discount_amount: string
  usage_limit: string
  is_active: boolean
  valid_from: string
  valid_until: string
}

const emptyForm: PromoForm = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order_amount: '0',
  max_discount_amount: '',
  usage_limit: '',
  is_active: true,
  valid_from: '',
  valid_until: '',
}

export default function AdminPromoCodesPage() {
  const [promos, setPromos] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [form, setForm] = useState<PromoForm>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchPromos() }, [])

  const fetchPromos = async () => {
    try {
      const res = await fetch(`${API}/api/admin/promo-codes`)
      if (res.ok) setPromos(await res.json())
    } catch (e) {
      console.error('Failed to fetch promo codes', e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setForm(emptyForm)
    setEditId(null)
    setError('')
    setMode('create')
  }

  const handleEdit = (promo: PromoCode) => {
    setForm({
      code: promo.code,
      description: promo.description || '',
      discount_type: promo.discount_type,
      discount_value: String(promo.discount_value),
      min_order_amount: String(promo.min_order_amount || 0),
      max_discount_amount: promo.max_discount_amount ? String(promo.max_discount_amount) : '',
      usage_limit: promo.usage_limit ? String(promo.usage_limit) : '',
      is_active: promo.is_active,
      valid_from: promo.valid_from ? promo.valid_from.slice(0, 16) : '',
      valid_until: promo.valid_until ? promo.valid_until.slice(0, 16) : '',
    })
    setEditId(promo.id)
    setError('')
    setMode('edit')
  }

  const handleSave = async () => {
    if (!form.code.trim()) { setError('Code is required'); return }
    if (!form.discount_value || Number(form.discount_value) <= 0) { setError('Discount value must be > 0'); return }
    if (form.discount_type === 'percentage' && Number(form.discount_value) > 100) {
      setError('Percentage discount cannot exceed 100'); return
    }

    setSaving(true)
    setError('')

    const body: any = {
      code: form.code.trim().toUpperCase(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order_amount: Number(form.min_order_amount) || 0,
      max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      is_active: form.is_active,
      valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
    }

    try {
      const url = editId ? `${API}/api/admin/promo-codes/${editId}` : `${API}/api/admin/promo-codes`
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to save')
      }
      await fetchPromos()
      setMode('list')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promo code?')) return
    try {
      await fetch(`${API}/api/admin/promo-codes/${id}`, { method: 'DELETE' })
      await fetchPromos()
    } catch (e) {
      alert('Failed to delete')
    }
  }

  const handleToggle = async (id: string) => {
    try {
      await fetch(`${API}/api/admin/promo-codes/${id}/toggle`, { method: 'PATCH' })
      await fetchPromos()
    } catch (e) {
      alert('Failed to toggle')
    }
  }

  const filtered = promos.filter(p =>
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-9 h-9 rounded-lg bg-dark-100 animate-pulse" />
            <div className="h-8 w-48 bg-dark-100 rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6 animate-pulse h-20" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ───── Form View ─────
  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setMode('list')} className="p-2 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </button>
            <h1 className="text-2xl font-bold text-white">
              {mode === 'create' ? 'Create Promo Code' : 'Edit Promo Code'}
            </h1>
          </div>

          <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-6">
            {/* Code */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Code *</label>
              <input
                type="text"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SAVE20"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:border-primary-500 focus:outline-none font-mono text-lg tracking-wider"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:border-primary-500 focus:outline-none"
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Discount Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm(f => ({ ...f, discount_type: 'percentage' }))}
                    className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      form.discount_type === 'percentage'
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-[#333] text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <Percent className="w-4 h-4" /> Percentage
                  </button>
                  <button
                    onClick={() => setForm(f => ({ ...f, discount_type: 'flat' }))}
                    className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      form.discount_type === 'flat'
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-[#333] text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" /> Flat Amount
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Discount Value {form.discount_type === 'percentage' ? '(%)' : '(Rs)'} *
                </label>
                <input
                  type="number"
                  value={form.discount_value}
                  onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                  placeholder={form.discount_type === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  min="0"
                  max={form.discount_type === 'percentage' ? '100' : undefined}
                />
              </div>
            </div>

            {/* Min Order & Max Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Min Order Amount (Rs)</label>
                <input
                  type="number"
                  value={form.min_order_amount}
                  onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Max Discount Cap (Rs) {form.discount_type === 'flat' && <span className="text-gray-600">N/A for flat</span>}
                </label>
                <input
                  type="number"
                  value={form.max_discount_amount}
                  onChange={e => setForm(f => ({ ...f, max_discount_amount: e.target.value }))}
                  placeholder="No limit"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  min="0"
                  disabled={form.discount_type === 'flat'}
                />
              </div>
            </div>

            {/* Usage Limit */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Usage Limit (leave blank for unlimited)</label>
              <input
                type="number"
                value={form.usage_limit}
                onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))}
                placeholder="Unlimited"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:border-primary-500 focus:outline-none"
                min="0"
              />
            </div>

            {/* Valid From / Until */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Valid From</label>
                <input
                  type="datetime-local"
                  value={form.valid_from}
                  onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Valid Until</label>
                <input
                  type="datetime-local"
                  value={form.valid_until}
                  onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  form.is_active ? 'bg-emerald-500' : 'bg-gray-600'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  form.is_active ? 'left-6' : 'left-0.5'
                }`} />
              </button>
              <span className={`text-sm ${form.is_active ? 'text-emerald-400' : 'text-gray-500'}`}>
                {form.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Error */}
            {error && <p className="text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-[#222]">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : (mode === 'create' ? 'Create Promo Code' : 'Update Promo Code')}
              </button>
              <button
                onClick={() => setMode('list')}
                className="flex items-center gap-2 px-6 py-3 border border-[#333] text-gray-400 rounded-lg hover:text-white hover:border-gray-500 transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ───── List View ─────
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-lg bg-dark-100 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Promo Codes</h1>
              <p className="text-gray-500 text-sm">{promos.length} promo code{promos.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/promo-codes/analytics"
              className="flex items-center gap-2 px-4 py-2 border border-[#333] text-gray-400 rounded-lg hover:text-white hover:border-gray-500 transition-colors"
            >
              <BarChart2 className="w-4 h-4" /> Analytics
            </Link>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Promo Code
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search promo codes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#111] border border-[#222] rounded-xl text-white focus:border-primary-500 focus:outline-none"
          />
        </div>

        {/* Promo Codes List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-[#111] border border-[#222] rounded-xl">
            <Tag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No promo codes found</p>
            <button onClick={handleCreate} className="text-primary-500 hover:text-primary-400 mt-2 text-sm">
              Create your first promo code
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(promo => {
              const isExpired = promo.valid_until && new Date(promo.valid_until) < new Date()
              const isLimitReached = promo.usage_limit !== null && promo.usage_count >= promo.usage_limit

              return (
                <div key={promo.id} className="bg-[#111] border border-[#222] rounded-xl p-5 hover:border-[#333] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Status indicator */}
                      <div className={`w-2 h-2 rounded-full ${
                        promo.is_active && !isExpired && !isLimitReached ? 'bg-emerald-400' : 'bg-red-400'
                      }`} />
                      
                      {/* Code & Description */}
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-white font-mono text-lg font-bold tracking-wider">{promo.code}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            promo.discount_type === 'percentage'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {promo.discount_type === 'percentage'
                              ? `${promo.discount_value}% OFF`
                              : `Rs ${promo.discount_value} OFF`}
                          </span>
                          {!promo.is_active && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">Inactive</span>
                          )}
                          {isExpired && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Expired</span>
                          )}
                          {isLimitReached && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">Limit Reached</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          {promo.description && <span>{promo.description}</span>}
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {promo.usage_count}{promo.usage_limit ? `/${promo.usage_limit}` : ''} used
                          </span>
                          {promo.min_order_amount > 0 && (
                            <span>Min: Rs {promo.min_order_amount}</span>
                          )}
                          {promo.valid_until && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Until {new Date(promo.valid_until).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(promo.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          promo.is_active
                            ? 'text-emerald-400 hover:bg-emerald-500/10'
                            : 'text-gray-500 hover:bg-gray-500/10'
                        }`}
                        title={promo.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {promo.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleEdit(promo)}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-200 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
