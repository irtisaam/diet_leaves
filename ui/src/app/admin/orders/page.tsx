'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, Package, Truck, CheckCircle, XCircle } from 'lucide-react'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  total: number
  status: string
  payment_status: string
  created_at: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  processing: 'bg-purple-500/20 text-purple-400',
  shipped: 'bg-cyan-500/20 text-cyan-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async () => {
    try {
      const url = filter === 'all' 
        ? 'http://localhost:8000/api/admin/orders'
        : `http://localhost:8000/api/admin/orders?status=${filter}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filters = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white neon-text">Orders</h1>
            <p className="text-gray-400">Manage customer orders</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                filter === f.value 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-dark-100 text-gray-400 hover:bg-dark-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-dark-100 rounded-xl border border-gray-800">
            <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-dark-100 rounded-xl border border-gray-800 p-6 hover:border-primary-500/30 transition-colors">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-white font-semibold">{order.order_number}</p>
                    <p className="text-gray-400 text-sm">{order.customer_name} • {order.customer_email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${statusColors[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
                      {order.status}
                    </span>
                    <span className="text-white font-semibold">Rs. {order.total}</span>
                    <Link 
                      href={`/admin/orders/${order.id}`}
                      className="p-2 rounded-lg bg-dark-200 hover:bg-dark-300 transition-colors"
                    >
                      <Eye className="h-4 w-4 text-gray-400" />
                    </Link>
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
