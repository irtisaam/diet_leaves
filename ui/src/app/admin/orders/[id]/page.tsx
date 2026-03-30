'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, Package, Truck, CheckCircle, MapPin, 
  Mail, Phone, User, Calendar, CreditCard, AlertCircle 
} from 'lucide-react'

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  variant_name?: string
  quantity: number
  unit_price: number
  total_price: number
  product?: {
    name: string
    slug: string
    price: number
    images?: { image_url: string; is_primary: boolean }[]
  }
}

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  payment_method: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: string
  shipping_city: string
  shipping_country: string
  shipping_postal_code: string
  billing_address?: string
  billing_city?: string
  customer_notes?: string
  admin_notes?: string
  subtotal: number
  shipping_cost: number
  discount_amount: number
  total: number
  items: OrderItem[]
  created_at: string
  updated_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  processing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  shipped: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const statusFlow = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}`)
      if (!res.ok) throw new Error('Order not found')
      const data = await res.json()
      setOrder(data)
      setAdminNotes(data.admin_notes || '')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return
    setUpdating(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!res.ok) throw new Error('Failed to update order')
      
      const updated = await res.json()
      setOrder(updated)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const updateAdminNotes = async () => {
    if (!order) return
    setUpdating(true)

    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes })
      })

      if (!res.ok) throw new Error('Failed to update notes')
      
      const updated = await res.json()
      setOrder(updated)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const getProductImage = (item: OrderItem) => {
    const primaryImg = item.product?.images?.find(img => img.is_primary)
    return primaryImg?.image_url || item.product?.images?.[0]?.image_url
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-dark py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">{error || 'Order not found'}</h1>
          <Link href="/admin/orders" className="btn-primary inline-block">
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  const currentStatusIndex = statusFlow.indexOf(order.status)

  return (
    <div className="min-h-screen bg-dark py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/orders" className="p-2 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Order {order.order_number}</h1>
              <p className="text-gray-400">
                Placed on {new Date(order.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-lg border ${statusColors[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>

        {/* Status Update Section */}
        <div className="bg-dark-100 rounded-xl p-6 mb-8 border border-dark-200">
          <h2 className="text-lg font-semibold text-white mb-4">Update Order Status</h2>
          
          {/* Status Timeline */}
          <div className="flex items-center justify-between mb-6">
            {statusFlow.map((status, index) => (
              <div key={status} className="flex items-center flex-1">
                <button
                  onClick={() => updateOrderStatus(status)}
                  disabled={updating || order.status === 'cancelled'}
                  className={`flex flex-col items-center transition-all ${
                    index <= currentStatusIndex ? 'opacity-100' : 'opacity-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index <= currentStatusIndex 
                      ? 'bg-primary text-black' 
                      : 'bg-dark-200 text-gray-500 hover:bg-dark-300'
                  }`}>
                    {status === 'pending' && <Package className="h-5 w-5" />}
                    {status === 'confirmed' && <CheckCircle className="h-5 w-5" />}
                    {status === 'processing' && <Package className="h-5 w-5" />}
                    {status === 'shipped' && <Truck className="h-5 w-5" />}
                    {status === 'delivered' && <MapPin className="h-5 w-5" />}
                  </div>
                  <span className="text-xs text-gray-400 mt-2 capitalize">{status}</span>
                </button>
                {index < statusFlow.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    index < currentStatusIndex ? 'bg-primary' : 'bg-dark-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Quick Status Buttons */}
          <div className="flex flex-wrap gap-2">
            {statusFlow.map((status) => (
              <button
                key={status}
                onClick={() => updateOrderStatus(status)}
                disabled={updating || order.status === status}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  order.status === status 
                    ? statusColors[status] + ' cursor-default'
                    : 'bg-dark-200 text-gray-400 hover:bg-dark-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
            <button
              onClick={() => updateOrderStatus('cancelled')}
              disabled={updating || order.status === 'cancelled' || order.status === 'delivered'}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              Cancel Order
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
              <h2 className="text-lg font-semibold text-white mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-dark-200 rounded-lg">
                    <div className="w-20 h-20 bg-dark-300 rounded-lg overflow-hidden flex-shrink-0">
                      {getProductImage(item) ? (
                        <Image
                          src={getProductImage(item)!}
                          alt={item.product?.name || 'Product'}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">
                        {item.product?.name || item.product_name || 'Product'}
                      </h3>
                      {item.variant_name && (
                        <p className="text-sm text-gray-400">{item.variant_name}</p>
                      )}
                      <Link 
                        href={`/admin/products/view/${item.product_id}`}
                        className="text-primary text-sm hover:underline"
                      >
                        View Product
                      </Link>
                      <div className="flex justify-between mt-2">
                        <span className="text-gray-400">
                          Rs.{Number(item.unit_price).toFixed(0)} × {item.quantity}
                        </span>
                        <span className="text-white font-medium">
                          Rs.{(Number(item.unit_price) * item.quantity).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="border-t border-dark-200 mt-6 pt-6 space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>Rs.{Number(order.subtotal).toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span>{Number(order.shipping_cost) === 0 ? 'FREE' : `Rs.${Number(order.shipping_cost).toFixed(0)}`}</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-Rs.{Number(order.discount_amount).toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold text-xl pt-4 border-t border-dark-200">
                  <span>Total</span>
                  <span className="text-primary">Rs.{Number(order.total).toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
              <h2 className="text-lg font-semibold text-white mb-4">Admin Notes</h2>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                placeholder="Add internal notes about this order..."
                className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
              />
              <button
                onClick={updateAdminNotes}
                disabled={updating}
                className="mt-4 btn-primary disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>

          {/* Customer & Shipping Info */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
              <h2 className="text-lg font-semibold text-white mb-4">Customer</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <span className="text-white">{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <a href={`mailto:${order.customer_email}`} className="text-primary hover:underline">
                    {order.customer_email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <a href={`tel:${order.customer_phone}`} className="text-primary hover:underline">
                    {order.customer_phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
              <h2 className="text-lg font-semibold text-white mb-4">Shipping Address</h2>
              <div className="text-gray-400">
                <p className="text-white font-medium">{order.customer_name}</p>
                <p>{order.shipping_address}</p>
                <p>{order.shipping_city}, {order.shipping_postal_code}</p>
                <p>{order.shipping_country}</p>
              </div>
            </div>

            {/* Billing Address */}
            {order.billing_address && (
              <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
                <h2 className="text-lg font-semibold text-white mb-4">Billing Address</h2>
                <div className="text-gray-400">
                  <p>{order.billing_address}</p>
                  <p>{order.billing_city}</p>
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
              <h2 className="text-lg font-semibold text-white mb-4">Payment</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-gray-500" />
                  <span className="text-white capitalize">{order.payment_method || 'COD'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    order.payment_status === 'paid' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {order.payment_status || 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Notes */}
            {order.customer_notes && (
              <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
                <h2 className="text-lg font-semibold text-white mb-4">Customer Notes</h2>
                <p className="text-gray-400">{order.customer_notes}</p>
              </div>
            )}

            {/* Order Timeline */}
            <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
              <h2 className="text-lg font-semibold text-white mb-4">Timeline</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    Created: {new Date(order.created_at).toLocaleString()}
                  </span>
                </div>
                {order.updated_at !== order.created_at && (
                  <div className="flex items-center gap-3 text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      Updated: {new Date(order.updated_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
