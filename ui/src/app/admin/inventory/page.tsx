'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Plus, Search, Edit2, Trash2, X, Eye,
  AlertTriangle, Package, Layers, RefreshCw, ChevronDown,
  CheckCircle, Clock, Archive, BarChart2, Warehouse, XCircle, Box
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ============================================================
// TYPES
// ============================================================
interface Category { id: string; name: string; description?: string }

interface Batch {
  id: string
  inventory_item_id: string
  quantity: number
  expiry_date?: string
  purchase_date?: string
  purchased_by?: string
  notes?: string
  is_active: boolean
  created_at?: string
}

interface InventoryItem {
  id: string
  name: string
  sku?: string
  category_id?: string
  category_name?: string
  unit: string
  unit_cost: number
  quantity_available: number
  quantity_in_use: number
  quantity_consumed: number
  min_stock_level: number
  expiry_date?: string
  description?: string
  supplier?: string
  notes?: string
  is_active: boolean
  created_at?: string
  batches?: Batch[]
}

interface RelatedProduct {
  mapping_id: string
  product_id: string
  product_name: string
  product_slug: string
  product_price: number
  product_image?: string
  quantity_per_unit: number
}

type Tab = 'all' | 'low_stock' | 'expiring' | 'expired' | 'categories'

const UNITS = ['pcs', 'kg', 'g', 'mg', 'liters', 'ml', 'dozen', 'box', 'pack', 'bottle', 'sachet', 'other']

// ============================================================
// HELPERS
// ============================================================
function fmtDate(d?: string) {
  if (!d) return 'â€”'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function expiryStatus(d?: string): 'expired' | 'expiring' | 'ok' | 'none' {
  if (!d) return 'none'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const exp = new Date(d)
  if (exp < today) return 'expired'
  const diff = (exp.getTime() - today.getTime()) / 86400000
  if (diff <= 30) return 'expiring'
  return 'ok'
}

// ============================================================
// MODAL COMPONENTS
// ============================================================
function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-[#111] border border-[#222] rounded-2xl w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 border-b border-[#222]">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#222] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full bg-dark-200 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50 placeholder-gray-600"
const selectCls = "w-full bg-dark-200 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"

// ============================================================
// ITEM FORM
// ============================================================
interface ItemFormData {
  name: string; sku: string; category_id: string; unit: string
  unit_cost: string; quantity_available: string; min_stock_level: string
  expiry_date: string; description: string; supplier: string; notes: string
  purchase_date: string; purchased_by: string
}

const emptyItemForm: ItemFormData = {
  name: '', sku: '', category_id: '', unit: 'pcs', unit_cost: '0',
  quantity_available: '0', min_stock_level: '0', expiry_date: '',
  description: '', supplier: '', notes: '', purchase_date: '', purchased_by: ''
}

function ItemModal({
  initial, categories, onSave, onClose, loading
}: {
  initial?: InventoryItem | null
  categories: Category[]
  onSave: (data: ItemFormData) => void
  onClose: () => void
  loading: boolean
}) {
  const [form, setForm] = useState<ItemFormData>(
    initial ? {
      name: initial.name,
      sku: initial.sku || '',
      category_id: initial.category_id || '',
      unit: initial.unit,
      unit_cost: String(initial.unit_cost ?? 0),
      quantity_available: String(initial.quantity_available ?? 0),
      min_stock_level: String(initial.min_stock_level ?? 0),
      expiry_date: initial.expiry_date?.slice(0, 10) || '',
      description: initial.description || '',
      supplier: initial.supplier || '',
      notes: initial.notes || '',
      purchase_date: (initial as any).purchase_date?.slice(0, 10) || '',
      purchased_by: (initial as any).purchased_by || '',
    } : emptyItemForm
  )

  const set = (k: keyof ItemFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <Modal title={initial ? 'Edit Inventory Item' : 'Add Inventory Item'} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 md:col-span-1">
            <Field label="Name" required>
              <input className={inputCls} value={form.name} onChange={set('name')} placeholder="e.g. Stevia Leaves Batch A" />
            </Field>
          </div>
          <Field label="SKU">
            <input className={inputCls} value={form.sku} onChange={set('sku')} placeholder="e.g. STL-001" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select className={selectCls} value={form.category_id} onChange={set('category_id')}>
              <option value="">â€” No Category â€”</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Unit" required>
            <select className={selectCls} value={form.unit} onChange={set('unit')}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Unit Cost (PKR)">
            <input className={inputCls} type="number" min="0" step="0.01" value={form.unit_cost} onChange={set('unit_cost')} />
          </Field>
          <Field label="Available Qty">
            <input className={inputCls} type="number" min="0" step="0.001" value={form.quantity_available} onChange={set('quantity_available')} />
          </Field>
          <Field label="Min Stock Alert">
            <input className={inputCls} type="number" min="0" step="0.001" value={form.min_stock_level} onChange={set('min_stock_level')} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Expiry Date">
            <input className={inputCls} type="date" value={form.expiry_date} onChange={set('expiry_date')} />
          </Field>
          <Field label="Supplier">
            <input className={inputCls} value={form.supplier} onChange={set('supplier')} placeholder="Supplier name" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Purchase Date">
            <input className={inputCls} type="date" value={form.purchase_date} onChange={set('purchase_date')} />
          </Field>
          <Field label="Purchased By">
            <input className={inputCls} value={form.purchased_by} onChange={set('purchased_by')} placeholder="Supplier / person name" />
          </Field>
        </div>

        <Field label="Description">
          <textarea className={inputCls} rows={2} value={form.description} onChange={set('description')} placeholder="Optional description" />
        </Field>

        <Field label="Notes">
          <textarea className={inputCls} rows={2} value={form.notes} onChange={set('notes')} placeholder="Internal notes" />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2 text-sm text-gray-400 hover:text-white border border-[#333] rounded-lg hover:border-[#444] transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={loading || !form.name.trim()}
            className="px-5 py-2 text-sm bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Savingâ€¦' : initial ? 'Update Item' : 'Create Item'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================================
// ADD STOCK / RESTOCK MODAL (creates a new batch)
// ============================================================
function RestockModal({
  item, onSave, onClose, loading
}: {
  item: InventoryItem
  onSave: (qty: number, expiryDate: string, purchaseDate: string, purchasedBy: string, notes: string) => void
  onClose: () => void
  loading: boolean
}) {
  const [qty, setQty] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10))
  const [purchasedBy, setPurchasedBy] = useState('')
  const [notes, setNotes] = useState('')
  return (
    <Modal title={`Add Stock: ${item.name}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-[#0a0a0a] rounded-xl p-4 border border-[#222] text-sm">
          <p className="text-gray-500 text-xs mb-1">Current Total Stock</p>
          <p className="text-emerald-400 font-bold text-xl">{item.quantity_available} {item.unit}</p>
          {item.batches && item.batches.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#222]">
              <p className="text-gray-500 text-xs mb-2">Existing Batches</p>
              {item.batches.map((b: Batch) => (
                <div key={b.id} className="flex justify-between items-center text-xs py-1">
                  <span className="text-gray-400">{b.quantity} {item.unit}</span>
                  <span className={`px-2 py-0.5 rounded-full ${
                    expiryStatus(b.expiry_date) === 'expired' ? 'bg-red-500/20 text-red-400' :
                    expiryStatus(b.expiry_date) === 'expiring' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-[#1a1a1a] text-gray-400'
                  }`}>
                    {b.expiry_date ? `Exp: ${fmtDate(b.expiry_date)}` : 'No expiry'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <Field label="Quantity to Add" required>
          <input className={inputCls} type="number" min="0.001" step="0.001" value={qty} onChange={e => setQty(e.target.value)} placeholder={`Amount in ${item.unit}`} />
        </Field>
        <Field label="Expiry Date (for this new batch)">
          <input className={inputCls} type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Purchase Date">
            <input className={inputCls} type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
          </Field>
          <Field label="Purchased By">
            <input className={inputCls} value={purchasedBy} onChange={e => setPurchasedBy(e.target.value)} placeholder="Supplier / person" />
          </Field>
        </div>
        <Field label="Notes">
          <input className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. New shipment from supplier X" />
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2 text-sm text-gray-400 border border-[#333] rounded-lg">Cancel</button>
          <button
            onClick={() => onSave(parseFloat(qty) || 0, expiryDate, purchaseDate, purchasedBy, notes)}
            disabled={loading || !qty || parseFloat(qty) <= 0}
            className="px-5 py-2 text-sm bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 disabled:opacity-50"
          >
            {loading ? 'Addingâ€¦' : `Add ${qty || '0'} ${item.unit}`}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================================
// VIEW MODAL (with batch list + related products)
// ============================================================
function ViewModal({ item, onClose, onRemoveBatch, removingBatch }: {
  item: InventoryItem; onClose: () => void;
  onRemoveBatch: (batchId: string) => void; removingBatch: boolean
}) {
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const r = await fetch(`${API}/api/admin/inventory/item-products/${item.id}`)
        if (r.ok) {
          const data = await r.json()
          setRelatedProducts(data.products || [])
        }
      } catch {
        // Silently fail
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchRelated()
  }, [item.id])

  const exStatus = expiryStatus(item.expiry_date)
  const isLow = item.min_stock_level > 0 && item.quantity_available <= item.min_stock_level
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'SKU', value: item.sku || 'â€”' },
    { label: 'Category', value: item.category_name || 'â€”' },
    { label: 'Unit', value: item.unit },
    { label: 'Unit Cost', value: item.unit_cost ? `PKR ${item.unit_cost}` : 'â€”' },
    { label: 'Total Available', value: <span className={`font-bold ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>{item.quantity_available} {item.unit}</span> },
    { label: 'Min Stock', value: item.min_stock_level || 'â€”' },
    { label: 'Supplier', value: item.supplier || 'â€”' },
    { label: 'Added On', value: item.created_at ? fmtDate(item.created_at) : 'â€”' },
  ]

  const batches = item.batches || []
  const today = new Date().toISOString().slice(0, 10)

  return (
    <Modal title={item.name} onClose={onClose} wide>
      <div className="space-y-6">
        {item.description && (
          <p className="text-gray-400 text-sm pb-4 border-b border-[#222]">{item.description}</p>
        )}

        {/* Basic info */}
        <dl className="grid grid-cols-2 gap-x-8 gap-y-1 divide-y divide-[#1a1a1a]">
          {rows.map(r => (
            <div key={r.label} className="flex items-center justify-between py-2.5 col-span-2 sm:col-span-1">
              <dt className="text-gray-500 text-sm">{r.label}</dt>
              <dd className="text-white text-sm font-medium">{r.value}</dd>
            </div>
          ))}
        </dl>

        {/* Batch Breakdown */}
        <div className="pt-4 border-t border-[#222]">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Box className="w-4 h-4 text-primary-500" />
            Stock Batches ({batches.length})
          </h3>
          {batches.length === 0 ? (
            <p className="text-gray-600 text-sm">No batch data available. Run migration 007 to enable batch tracking.</p>
          ) : (
            <div className="space-y-2">
              {batches.map((b: Batch) => {
                const bs = expiryStatus(b.expiry_date)
                const isExpired = bs === 'expired'
                return (
                  <div key={b.id} className={`flex items-center justify-between p-3 rounded-xl border ${
                    isExpired ? 'border-red-500/30 bg-red-950/20' :
                    bs === 'expiring' ? 'border-orange-500/30 bg-orange-950/10' :
                    'border-[#222] bg-[#0a0a0a]'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-white font-bold text-sm">{b.quantity} {item.unit}</p>
                        <p className="text-gray-500 text-xs">{b.purchase_date ? `Purchased: ${fmtDate(b.purchase_date)}` : `Added: ${fmtDate(b.created_at)}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        isExpired ? 'bg-red-500/20 text-red-400' :
                        bs === 'expiring' ? 'bg-orange-500/20 text-orange-400' :
                        b.expiry_date ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#1a1a1a] text-gray-500'
                      }`}>
                        {b.expiry_date ? (isExpired ? 'EXPIRED ' : 'Exp: ') + fmtDate(b.expiry_date) : 'No expiry'}
                      </span>
                      {isExpired && (
                        <button
                          onClick={() => onRemoveBatch(b.id)}
                          disabled={removingBatch}
                          className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded-lg font-medium disabled:opacity-50"
                        >
                          {removingBatch ? 'â€¦' : 'Remove'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Related Products */}
        <div className="pt-4 border-t border-[#222]">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-400" />
            Products Using This Item ({relatedProducts.length})
          </h3>
          {loadingProducts ? (
            <p className="text-gray-600 text-sm animate-pulse">Loadingâ€¦</p>
          ) : relatedProducts.length === 0 ? (
            <p className="text-gray-600 text-sm">No products linked to this inventory item.</p>
          ) : (
            <div className="space-y-2">
              {relatedProducts.map(p => (
                <div key={p.mapping_id} className="flex items-center gap-3 p-3 rounded-xl border border-[#222] bg-[#0a0a0a]">
                  {p.product_image && (
                    <Image src={p.product_image} alt="" width={40} height={40} className="w-10 h-10 rounded-lg object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{p.product_name}</p>
                    <p className="text-gray-500 text-xs">Uses {p.quantity_per_unit} {item.unit} per unit Â· PKR {p.product_price}</p>
                  </div>
                  <Link href={`/admin/products/${p.product_id}`} className="text-xs text-primary-500 hover:text-primary-400">
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {item.notes && (
          <div className="pt-4 border-t border-[#222]">
            <p className="text-gray-500 text-xs mb-1">Notes</p>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{item.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ============================================================
// CATEGORY MODAL
// ============================================================
function CategoryModal({ initial, onSave, onClose, loading }: {
  initial?: Category | null; onSave: (name: string, desc: string) => void; onClose: () => void; loading: boolean
}) {
  const [name, setName] = useState(initial?.name || '')
  const [desc, setDesc] = useState(initial?.description || '')
  return (
    <Modal title={initial ? 'Edit Category' : 'Add Category'} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Category Name" required>
          <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Raw Materials" />
        </Field>
        <Field label="Description">
          <textarea className={inputCls} rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional description" />
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2 text-sm text-gray-400 border border-[#333] rounded-lg">Cancel</button>
          <button
            onClick={() => onSave(name, desc)}
            disabled={loading || !name.trim()}
            className="px-5 py-2 text-sm bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? 'Savingâ€¦' : initial ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================================
// CONFIRM DELETE MODAL
// ============================================================
function ConfirmModal({ message, onConfirm, onClose, loading }: {
  message: string; onConfirm: () => void; onClose: () => void; loading: boolean
}) {
  return (
    <Modal title="Confirm Delete" onClose={onClose}>
      <p className="text-gray-300 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-5 py-2 text-sm text-gray-400 border border-[#333] rounded-lg">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="px-5 py-2 text-sm bg-red-500 text-white font-semibold rounded-lg disabled:opacity-50">
          {loading ? 'Deletingâ€¦' : 'Delete'}
        </button>
      </div>
    </Modal>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>('all')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')

  // Modals
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null)
  const [viewItem, setViewItem] = useState<InventoryItem | null>(null)
  const [showCatModal, setShowCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [deleteCat, setDeleteCat] = useState<Category | null>(null)
  const [removingBatch, setRemovingBatch] = useState(false)

  // ---- Data fetching ----
  const fetchCategories = useCallback(async () => {
    const r = await fetch(`${API}/api/admin/inventory/categories`, { cache: 'no-store' })
    if (r.ok) {
      const data = await r.json()
      setCategories(Array.isArray(data) ? data : [])
    }
  }, [])

  const fetchItems = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      let url = `${API}/api/admin/inventory?`
      if (filterCat) url += `category_id=${filterCat}&`
      if (tab === 'low_stock') url += 'only_low_stock=true&'
      if (tab === 'expiring') url += 'only_expiring=true&'
      if (tab === 'expired') url += 'only_expired=true&'
      url += 'include_inactive=false'
      const r = await fetch(url, { cache: 'no-store' })
      if (!r.ok) throw new Error(await r.text())
      const data = await r.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [tab, filterCat])

  useEffect(() => { fetchCategories() }, [fetchCategories])
  useEffect(() => { if (tab !== 'categories') fetchItems() }, [fetchItems, tab])

  // ---- Filtered display ----
  const filtered = useMemo(() => items.filter(i => {
    if (!search) return true
    const s = search.toLowerCase()
    return i.name.toLowerCase().includes(s) || (i.sku || '').toLowerCase().includes(s) || (i.supplier || '').toLowerCase().includes(s)
  }), [items, search])

  // ---- CRUD handlers ----
  const saveItem = async (form: ItemFormData) => {
    setActionLoading(true)
    try {
      const body: Record<string, any> = {
        name: form.name.trim(),
        unit: form.unit,
        unit_cost: parseFloat(form.unit_cost) || 0,
        quantity_available: parseFloat(form.quantity_available) || 0,
        min_stock_level: parseFloat(form.min_stock_level) || 0,
      }
      if (form.sku.trim()) body.sku = form.sku.trim()
      if (form.category_id) body.category_id = form.category_id
      if (form.expiry_date) body.expiry_date = form.expiry_date
      if (form.description.trim()) body.description = form.description.trim()
      if (form.supplier.trim()) body.supplier = form.supplier.trim()
      if (form.notes.trim()) body.notes = form.notes.trim()
      if (form.purchase_date) body.purchase_date = form.purchase_date
      if (form.purchased_by.trim()) body.purchased_by = form.purchased_by.trim()

      const url = editingItem ? `${API}/api/admin/inventory/${editingItem.id}` : `${API}/api/admin/inventory`
      const method = editingItem ? 'PUT' : 'POST'
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!r.ok) throw new Error(await r.text())
      setShowItemModal(false); setEditingItem(null)
      fetchItems()
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setActionLoading(false) }
  }

  const softDeleteItem = async (item: InventoryItem) => {
    setActionLoading(true)
    try {
      const r = await fetch(`${API}/api/admin/inventory/${item.id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error(await r.text())
      setDeleteItem(null); fetchItems()
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setActionLoading(false) }
  }

  const addStock = async (qty: number, expiryDate: string, purchaseDate: string, purchasedBy: string, notes: string) => {
    if (!restockItem) return
    setActionLoading(true)
    try {
      const body: Record<string, any> = { quantity: qty }
      if (expiryDate) body.expiry_date = expiryDate
      if (purchaseDate) body.purchase_date = purchaseDate
      if (purchasedBy) body.purchased_by = purchasedBy
      if (notes) body.notes = notes
      const r = await fetch(`${API}/api/admin/inventory/${restockItem.id}/batches`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!r.ok) throw new Error(await r.text())
      setRestockItem(null); fetchItems()
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setActionLoading(false) }
  }

  const removeBatch = async (batchId: string) => {
    setRemovingBatch(true)
    try {
      const r = await fetch(`${API}/api/admin/inventory/batches/${batchId}`, { method: 'DELETE' })
      if (!r.ok) throw new Error(await r.text())
      // Refresh the view item data
      if (viewItem) {
        const fresh = await fetch(`${API}/api/admin/inventory/${viewItem.id}`)
        if (fresh.ok) {
          const data = await fresh.json()
          setViewItem(data)
        }
      }
      fetchItems()
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setRemovingBatch(false) }
  }

  const saveCat = async (name: string, desc: string) => {
    setActionLoading(true)
    try {
      const url = editingCat ? `${API}/api/admin/inventory/categories/${editingCat.id}` : `${API}/api/admin/inventory/categories`
      const method = editingCat ? 'PUT' : 'POST'
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description: desc || undefined }) })
      if (!r.ok) throw new Error(await r.text())
      setShowCatModal(false); setEditingCat(null); fetchCategories()
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setActionLoading(false) }
  }

  const deleteCatFn = async (cat: Category) => {
    setActionLoading(true)
    try {
      const r = await fetch(`${API}/api/admin/inventory/categories/${cat.id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error(await r.text())
      setDeleteCat(null); fetchCategories()
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setActionLoading(false) }
  }

  // ---- Stats bar ----
  const { totalValue, lowStock, expiredCount, expiringCount } = useMemo(() => {
    const totalValue = items.reduce((s, i) => s + (i.quantity_available * i.unit_cost), 0)
    const lowStock = items.filter(i => i.quantity_available <= i.min_stock_level && i.min_stock_level > 0)
    const expiredCount = items.filter(i => {
      if (i.batches && i.batches.length > 0) {
        return i.batches.some((b: Batch) => expiryStatus(b.expiry_date) === 'expired')
      }
      return expiryStatus(i.expiry_date) === 'expired'
    }).length
    const expiringCount = items.filter(i => {
      if (i.batches && i.batches.length > 0) {
        return i.batches.some((b: Batch) => expiryStatus(b.expiry_date) === 'expiring')
      }
      return expiryStatus(i.expiry_date) === 'expiring'
    }).length
    return { totalValue, lowStock, expiredCount, expiringCount }
  }, [items])

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin" className="text-gray-500 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Warehouse className="w-7 h-7 text-[#39ff14]" />
          <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
        </div>
        <p className="text-gray-500 mb-8 ml-16">Track stock batches, expiry dates, and product linkages</p>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Items', value: items.length, icon: Package, color: 'text-primary-500' },
            { label: 'Low Stock', value: lowStock.length, icon: AlertTriangle, color: lowStock.length ? 'text-amber-400' : 'text-gray-500' },
            { label: 'Expiring Soon', value: expiringCount, icon: Clock, color: expiringCount ? 'text-orange-400' : 'text-gray-500' },
            { label: 'Expired', value: expiredCount, icon: XCircle, color: expiredCount ? 'text-red-400' : 'text-gray-500' },
            { label: 'Stock Value', value: `PKR ${totalValue.toLocaleString()}`, icon: BarChart2, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#111] border border-[#222] rounded-xl p-4 flex items-center gap-4">
              <s.icon className={`w-8 h-8 ${s.color} flex-shrink-0`} />
              <div>
                <p className="text-gray-500 text-xs">{s.label}</p>
                <p className="text-white font-bold text-xl">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111] border border-[#222] rounded-xl p-1 mb-6 w-fit overflow-x-auto">
          {([
            { id: 'all', label: 'All Items', icon: Layers },
            { id: 'low_stock', label: `Low Stock${lowStock.length ? ` (${lowStock.length})` : ''}`, icon: AlertTriangle },
            { id: 'expiring', label: `Expiring${expiringCount ? ` (${expiringCount})` : ''}`, icon: Clock },
            { id: 'expired', label: `Expired${expiredCount ? ` (${expiredCount})` : ''}`, icon: XCircle },
            { id: 'categories', label: 'Categories', icon: Archive },
          ] as { id: Tab; label: string; icon: any }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary-600 transition-colors whitespace-nowrap ${tab === t.id ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ---- CATEGORIES TAB ---- */}
        {tab === 'categories' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => { setEditingCat(null); setShowCatModal(true) }}
                className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
              {categories.length === 0 ? (
                <div className="text-center text-gray-500 py-16">No categories yet. Add one above.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-[#222]">
                    <tr>
                      {['Name', 'Description', ''].map(h => (
                        <th key={h} className="text-left text-gray-500 font-medium px-6 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {categories.map(c => (
                      <tr key={c.id} className="hover:bg-[#141414] transition-colors">
                        <td className="px-6 py-4 text-white font-medium">{c.name}</td>
                        <td className="px-6 py-4 text-gray-400">{c.description || 'â€”'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => { setEditingCat(c); setShowCatModal(true) }} className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-[#222] rounded-lg">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteCat(c)} className="text-gray-400 hover:text-red-400 transition-colors p-1.5 hover:bg-[#222] rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ---- ITEMS TABS ---- */}
        {tab !== 'categories' && (
          <div>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, SKU, supplierâ€¦"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-dark-100 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500/40"
                />
              </div>
              <select
                value={filterCat}
                onChange={e => setFilterCat(e.target.value)}
                className="bg-dark-100 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500/40"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={fetchItems} className="text-gray-400 hover:text-white border border-[#222] rounded-xl px-3 py-2.5 hover:border-[#333] transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setEditingItem(null); setShowItemModal(true) }}
                className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 mb-4 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Table */}
            <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
              {loading ? (
                <div className="text-center text-gray-500 py-16 animate-pulse">Loading inventoryâ€¦</div>
              ) : filtered.length === 0 ? (
                <div className="text-center text-gray-500 py-16">
                  {tab === 'low_stock' ? 'No low-stock items.' : tab === 'expiring' ? 'No items expiring soon.' : tab === 'expired' ? 'No expired items.' : 'No items found.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-[#222]">
                      <tr>
                        {['Name / SKU', 'Category', 'Unit', 'Total Stock', 'Batches', 'Cost', 'Status', ''].map(h => (
                          <th key={h} className="text-left text-gray-500 font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                      {filtered.map(item => {
                        const isLow = item.min_stock_level > 0 && item.quantity_available <= item.min_stock_level
                        const batches = item.batches || []
                        const hasExpired = batches.some((b: Batch) => expiryStatus(b.expiry_date) === 'expired')
                        const hasExpiring = batches.some((b: Batch) => expiryStatus(b.expiry_date) === 'expiring')
                        return (
                          <tr key={item.id} className="hover:bg-[#141414] transition-colors group">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                                <div>
                                  <p className={`font-medium ${isLow ? 'text-amber-300' : 'text-white'}`}>{item.name}</p>
                                  {item.sku && <p className="text-gray-500 text-xs">{item.sku}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-400">{item.category_name || 'â€”'}</td>
                            <td className="px-4 py-3 text-gray-400">{item.unit}</td>
                            <td className="px-4 py-3">
                              <span className={`font-semibold ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {item.quantity_available} {item.unit}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {batches.length > 0 ? (
                                <div className="space-y-0.5">
                                  {batches.slice(0, 3).map((b: Batch) => {
                                    const bs = expiryStatus(b.expiry_date)
                                    return (
                                      <div key={b.id} className="flex items-center gap-1.5 text-xs">
                                        <span className={`font-medium ${
                                          bs === 'expired' ? 'text-red-400' :
                                          bs === 'expiring' ? 'text-orange-400' : 'text-gray-300'
                                        }`}>{b.quantity}{item.unit}</span>
                                        <span className="text-gray-600">Â·</span>
                                        <span className={`${
                                          bs === 'expired' ? 'text-red-500' :
                                          bs === 'expiring' ? 'text-orange-500' : 'text-gray-500'
                                        }`}>{b.expiry_date ? fmtDate(b.expiry_date) : 'No exp'}</span>
                                      </div>
                                    )
                                  })}
                                  {batches.length > 3 && <p className="text-gray-600 text-xs">+{batches.length - 3} more</p>}
                                </div>
                              ) : (
                                <span className="text-gray-600 text-xs">No batches</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-400">{item.unit_cost ? `PKR ${item.unit_cost}` : 'â€”'}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {hasExpired && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Expired</span>}
                                {hasExpiring && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">Expiring</span>}
                                {isLow && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Low</span>}
                                {!hasExpired && !hasExpiring && !isLow && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">OK</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setViewItem(item)}
                                  title="View details"
                                  className="text-gray-400 hover:text-blue-400 transition-colors p-1.5 hover:bg-dark-200 rounded-lg"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setRestockItem(item)}
                                  title="Add stock"
                                  className="text-gray-400 hover:text-emerald-400 transition-colors p-1.5 hover:bg-dark-200 rounded-lg"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => { setEditingItem(item); setShowItemModal(true) }}
                                  className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-[#222] rounded-lg"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteItem(item)}
                                  className="text-gray-400 hover:text-red-400 transition-colors p-1.5 hover:bg-[#222] rounded-lg"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <p className="text-gray-600 text-xs mt-3">
              {filtered.length} item{filtered.length !== 1 ? 's' : ''} shown.
              {tab === 'expired' && ' Remove expired batches via the View (eye) button to deduct from stock.'}
            </p>
          </div>
        )}
      </div>

      {/* ---- MODALS ---- */}
      {viewItem && (
        <ViewModal
          item={viewItem}
          onClose={() => setViewItem(null)}
          onRemoveBatch={removeBatch}
          removingBatch={removingBatch}
        />
      )}

      {showItemModal && (
        <ItemModal
          initial={editingItem}
          categories={categories}
          onSave={saveItem}
          onClose={() => { setShowItemModal(false); setEditingItem(null) }}
          loading={actionLoading}
        />
      )}

      {restockItem && (
        <RestockModal
          item={restockItem}
          onSave={addStock}
          onClose={() => setRestockItem(null)}
          loading={actionLoading}
        />
      )}

      {deleteItem && (
        <ConfirmModal
          message={`Are you sure you want to deactivate "${deleteItem.name}"? This hides it from the list but preserves historical data.`}
          onConfirm={() => softDeleteItem(deleteItem)}
          onClose={() => setDeleteItem(null)}
          loading={actionLoading}
        />
      )}

      {showCatModal && (
        <CategoryModal
          initial={editingCat}
          onSave={saveCat}
          onClose={() => { setShowCatModal(false); setEditingCat(null) }}
          loading={actionLoading}
        />
      )}

      {deleteCat && (
        <ConfirmModal
          message={`Delete category "${deleteCat.name}"? Items in this category will be uncategorised.`}
          onConfirm={() => deleteCatFn(deleteCat)}
          onClose={() => setDeleteCat(null)}
          loading={actionLoading}
        />
      )}
    </div>
  )
}
