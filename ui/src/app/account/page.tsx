'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Truck, CheckCircle, Clock, ShoppingBag, User as UserIcon, Mail, Phone, MapPin, LogOut, Settings } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import { authAPI } from '@/lib/api'
import { Order } from '@/types'

export default function AccountPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, logout, refreshProfile } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders')
  const [editMode, setEditMode] = useState(false)
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/account/login')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
      })
    }
  }, [user])

  const fetchOrders = async () => {
    try {
      const data = await authAPI.myOrders() as { orders: Order[]; total: number }
      setOrders(data.orders)
    } catch {
      // silent
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await authAPI.updateProfile(profileForm)
      await refreshProfile()
      setEditMode(false)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    )
  }

  if (!user) return null

  // Order analytics
  const totalOrders = orders.length
  const delivered = orders.filter(o => o.status === 'delivered').length
  const inTransit = orders.filter(o => ['shipping', 'shipped'].includes(o.status)).length
  const pending = orders.filter(o => o.status === 'pending').length
  const totalSpent = orders.reduce((s, o) => s + Number(o.total), 0)

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-400 bg-yellow-400/10',
    processing: 'text-blue-400 bg-blue-400/10',
    shipping: 'text-purple-400 bg-purple-400/10',
    shipped: 'text-purple-400 bg-purple-400/10',
    delivered: 'text-green-400 bg-green-400/10',
    cancelled: 'text-red-400 bg-red-400/10',
  }

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Account</h1>
            <p className="text-gray-400 mt-1">
              Welcome, {user.full_name || user.email || user.phone}
            </p>
          </div>
          <button onClick={handleLogout} className="mt-4 sm:mt-0 flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-dark-100 border border-dark-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <ShoppingBag className="h-4 w-4" /> Total Orders
            </div>
            <p className="text-2xl font-bold text-white">{totalOrders}</p>
          </div>
          <div className="bg-dark-100 border border-dark-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
              <CheckCircle className="h-4 w-4" /> Delivered
            </div>
            <p className="text-2xl font-bold text-white">{delivered}</p>
          </div>
          <div className="bg-dark-100 border border-dark-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-purple-400 text-sm mb-1">
              <Truck className="h-4 w-4" /> In Transit
            </div>
            <p className="text-2xl font-bold text-white">{inTransit}</p>
          </div>
          <div className="bg-dark-100 border border-dark-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-primary text-sm mb-1">
              <Package className="h-4 w-4" /> Total Spent
            </div>
            <p className="text-2xl font-bold text-white">Rs {totalSpent.toLocaleString()}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-dark-200">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'orders' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'profile' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'
            }`}
          >
            Profile
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {ordersLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No orders yet</h3>
                <p className="text-gray-400 mb-6">Start shopping to see your orders here.</p>
                <Link href="/shop" className="inline-block px-6 py-3 bg-primary text-black rounded-lg font-medium hover:bg-primary/90">
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-dark-100 border border-dark-200 rounded-xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                      <div>
                        <span className="text-white font-medium">#{order.order_number}</span>
                        <span className="text-gray-500 text-sm ml-3">
                          {new Date(order.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 sm:mt-0">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[order.status] || 'text-gray-400 bg-gray-400/10'}`}>
                          {order.status}
                        </span>
                        <span className="text-white font-semibold">Rs {Number(order.total).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      {order.items.slice(0, 3).map((it, i) => (
                        <span key={i}> · {it.product_name} x{it.quantity}</span>
                      ))}
                      {order.items.length > 3 && <span> · +{order.items.length - 3} more</span>}
                    </div>
                    {order.tracking_number && (
                      <p className="text-sm text-primary mt-2">Tracking: {order.tracking_number}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-dark-100 border border-dark-200 rounded-xl p-6 max-w-lg">
            {!editMode ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-white">{user.full_name || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-white">{user.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-white">{user.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-white">{user.address ? `${user.address}, ${user.city || ''}` : '—'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditMode(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-dark border border-dark-200 rounded-lg text-gray-300 hover:text-white transition-colors"
                >
                  <Settings className="h-4 w-4" /> Edit Profile
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-dark border border-dark-200 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-dark border border-dark-200 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Address</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-dark border border-dark-200 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">City</label>
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-dark border border-dark-200 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-5 py-2.5 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-5 py-2.5 bg-dark border border-dark-200 rounded-lg text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
