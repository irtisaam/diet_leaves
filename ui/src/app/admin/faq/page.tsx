'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Pencil, Trash2, GripVertical,
  ChevronUp, ChevronDown, Eye, EyeOff, Loader2, Check, X
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface FAQ {
  id: string
  question: string
  answer: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface FAQFormData {
  question: string
  answer: string
  display_order: number
  is_active: boolean
}

const emptyForm: FAQFormData = {
  question: '',
  answer: '',
  display_order: 0,
  is_active: true,
}

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FAQFormData>(emptyForm)
  const [formError, setFormError] = useState('')

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchFAQs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/admin/faqs`)
      if (!res.ok) throw new Error('Failed to fetch FAQs')
      const data: FAQ[] = await res.json()
      setFaqs(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFAQs() }, [fetchFAQs])

  function openAdd() {
    setEditingId(null)
    setForm({ ...emptyForm, display_order: faqs.length })
    setFormError('')
    setShowModal(true)
  }

  function openEdit(faq: FAQ) {
    setEditingId(faq.id)
    setForm({
      question: faq.question,
      answer: faq.answer,
      display_order: faq.display_order,
      is_active: faq.is_active,
    })
    setFormError('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.question.trim() || !form.answer.trim()) {
      setFormError('Question and answer are required.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const url = editingId
        ? `${API}/api/admin/faqs/${editingId}`
        : `${API}/api/admin/faqs`
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to save')
      }
      setShowModal(false)
      await fetchFAQs()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to save FAQ')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`${API}/api/admin/faqs/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setConfirmDelete(null)
      await fetchFAQs()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(null)
    }
  }

  async function toggleActive(faq: FAQ) {
    try {
      await fetch(`${API}/api/admin/faqs/${faq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !faq.is_active }),
      })
      setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, is_active: !f.is_active } : f))
    } catch (e) {
      console.error(e)
    }
  }

  async function move(faq: FAQ, direction: 'up' | 'down') {
    const sorted = [...faqs].sort((a, b) => a.display_order - b.display_order)
    const idx = sorted.findIndex(f => f.id === faq.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const updated = sorted.map((f, i) => {
      if (i === idx) return { ...f, display_order: sorted[swapIdx].display_order }
      if (i === swapIdx) return { ...f, display_order: sorted[idx].display_order }
      return f
    })
    setFaqs(updated)

    try {
      await fetch(`${API}/api/admin/faqs/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated.map(f => ({ id: f.id, display_order: f.display_order }))),
      })
    } catch (e) {
      console.error(e)
      fetchFAQs() // revert on error
    }
  }

  const sorted = [...faqs].sort((a, b) => a.display_order - b.display_order)

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white neon-text">FAQ Management</h1>
              <p className="text-gray-400 text-sm mt-1">Manage frequently asked questions</p>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
            Add FAQ
          </button>
        </div>

        {/* FAQ List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 bg-[#121212] rounded-xl border border-gray-800">
            <p className="text-gray-400 mb-4">No FAQs yet. Add your first one!</p>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add FAQ
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((faq, idx) => (
              <div
                key={faq.id}
                className="bg-[#121212] border border-gray-800 rounded-xl p-4 flex items-start gap-4 group"
              >
                {/* Order controls */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <GripVertical className="h-4 w-4 text-gray-600" />
                  <button
                    onClick={() => move(faq, 'up')}
                    disabled={idx === 0}
                    className="text-gray-500 hover:text-white disabled:opacity-20 transition-colors"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => move(faq, 'down')}
                    disabled={idx === sorted.length - 1}
                    className="text-gray-500 hover:text-white disabled:opacity-20 transition-colors"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`font-medium ${faq.is_active ? 'text-white' : 'text-gray-500'}`}>
                        {faq.question}
                      </p>
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">{faq.answer}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${faq.is_active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
                        {faq.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(faq)}
                    className="p-2 text-gray-500 hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-800"
                    title={faq.is_active ? 'Hide' : 'Show'}
                  >
                    {faq.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(faq)}
                    className="p-2 text-gray-500 hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-800"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(faq.id)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Edit FAQ' : 'Add FAQ'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Question *</label>
                <input
                  type="text"
                  value={form.question}
                  onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
                  placeholder="e.g. Is your stevia 100% natural?"
                  className="w-full bg-[#0e0e0e] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Answer *</label>
                <textarea
                  value={form.answer}
                  onChange={e => setForm(p => ({ ...p, answer: e.target.value }))}
                  rows={5}
                  placeholder="Detailed answer..."
                  className="w-full bg-[#0e0e0e] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={e => setForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-[#0e0e0e] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div className="flex items-center gap-3 mt-5">
                  <label className="text-sm font-medium text-gray-300">Active</label>
                  <button
                    onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-primary-500' : 'bg-gray-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {formError && (
                <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">{formError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-800">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors font-medium"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">Delete FAQ?</h2>
            <p className="text-gray-400 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting === confirmDelete}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {deleting === confirmDelete ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
