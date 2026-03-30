'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Package, Truck, MapPin, Copy, ArrowRight } from 'lucide-react'
import { ordersAPI, productsAPI } from '@/lib/api'

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  product?: {
    name: string
    images?: { image_url: string }[]
  }
}

interface Order {
  id: string
  order_number: string
  status: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: string
  shipping_city: string
  shipping_country: string
  shipping_postal_code: string
  subtotal: number
  shipping_cost: number
  total: number
  items: OrderItem[]
  created_at: string
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) {
        setLoading(false)
        return
      }

      try {
        const data = await ordersAPI.getByNumber(orderNumber)
        setOrder(data as Order)

        // Fetch featured products for recommendations
        const featured = await productsAPI.getFeatured(4)
        setFeaturedProducts((featured as any[]) || [])
      } catch (error) {
        console.error('Failed to fetch order:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderNumber])

  const copyOrderNumber = () => {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-dark py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Order not found</h1>
          <p className="text-gray-400 mb-8">We couldn't find the order you're looking for.</p>
          <Link href="/shop" className="btn-primary inline-block">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Thank You for Your Order!</h1>
          <p className="text-gray-400">Your order has been placed successfully</p>
        </div>

        {/* Order Number Card */}
        <div className="bg-dark-100 rounded-xl p-6 mb-8 border border-dark-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Order Number</p>
              <p className="text-2xl font-bold text-primary">{order.order_number}</p>
            </div>
            <button
              onClick={copyOrderNumber}
              className="flex items-center gap-2 px-4 py-2 bg-dark-200 rounded-lg text-white hover:bg-dark-300 transition-colors"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            A confirmation email has been sent to <span className="text-white">{order.customer_email}</span>
          </p>
        </div>

        {/* Order Status Timeline */}
        <div className="bg-dark-100 rounded-xl p-6 mb-8 border border-dark-200">
          <h2 className="text-lg font-semibold text-white mb-6">Order Status</h2>
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                ['pending', 'processing', 'shipped', 'delivered'].includes(order.status) 
                  ? 'bg-primary text-black' 
                  : 'bg-dark-200 text-gray-500'
              }`}>
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="text-xs text-gray-400 mt-2">Confirmed</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${
              ['processing', 'shipped', 'delivered'].includes(order.status) 
                ? 'bg-primary' 
                : 'bg-dark-200'
            }`} />
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                ['processing', 'shipped', 'delivered'].includes(order.status) 
                  ? 'bg-primary text-black' 
                  : 'bg-dark-200 text-gray-500'
              }`}>
                <Package className="h-5 w-5" />
              </div>
              <span className="text-xs text-gray-400 mt-2">Processing</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${
              ['shipped', 'delivered'].includes(order.status) 
                ? 'bg-primary' 
                : 'bg-dark-200'
            }`} />
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                ['shipped', 'delivered'].includes(order.status) 
                  ? 'bg-primary text-black' 
                  : 'bg-dark-200 text-gray-500'
              }`}>
                <Truck className="h-5 w-5" />
              </div>
              <span className="text-xs text-gray-400 mt-2">Shipped</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${
              order.status === 'delivered' 
                ? 'bg-primary' 
                : 'bg-dark-200'
            }`} />
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                order.status === 'delivered' 
                  ? 'bg-primary text-black' 
                  : 'bg-dark-200 text-gray-500'
              }`}>
                <MapPin className="h-5 w-5" />
              </div>
              <span className="text-xs text-gray-400 mt-2">Delivered</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Order Items */}
          <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
            <h2 className="text-lg font-semibold text-white mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 h-16 bg-dark-200 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product?.images?.[0] ? (
                      <Image
                        src={item.product.images[0].image_url}
                        alt={item.product.name || 'Product'}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{item.product?.name || 'Product'}</h3>
                    <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-white font-medium">
                    Rs.{(Number(item.unit_price) * item.quantity).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-dark-200 mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>Rs.{Number(order.subtotal).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span>{Number(order.shipping_cost) === 0 ? 'FREE' : `Rs.${Number(order.shipping_cost).toFixed(0)}`}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-lg pt-2">
                <span>Total</span>
                <span className="text-primary">Rs.{Number(order.total).toFixed(0)} PKR</span>
              </div>
            </div>
          </div>

          {/* Shipping Details */}
          <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
            <h2 className="text-lg font-semibold text-white mb-4">Shipping Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Customer</p>
                <p className="text-white">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="text-white">{order.customer_email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Phone</p>
                <p className="text-white">{order.customer_phone}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Shipping Address</p>
                <p className="text-white">
                  {order.shipping_address}<br />
                  {order.shipping_city}, {order.shipping_postal_code}<br />
                  {order.shipping_country}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Payment Method</p>
                <p className="text-white">Cash on Delivery (COD)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Track Order Link */}
        <div className="text-center mb-12">
          <Link 
            href={`/track-order?order=${order.order_number}`}
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            Track your order
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Continue Shopping */}
        <div className="bg-dark-100 rounded-xl p-8 border border-dark-200 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Continue Shopping</h2>
          <p className="text-gray-400 mb-6">Check out more of our amazing products</p>
          
          {featuredProducts.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {featuredProducts.map((product) => (
                <Link 
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="bg-dark-200 rounded-lg p-4 hover:bg-dark-300 transition-colors"
                >
                  <div className="aspect-square bg-dark-300 rounded-lg overflow-hidden mb-2">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0].image_url}
                        alt={product.name}
                        width={150}
                        height={150}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <p className="text-white text-sm font-medium truncate">{product.name}</p>
                  <p className="text-primary text-sm">Rs.{Number(product.price).toFixed(0)}</p>
                </Link>
              ))}
            </div>
          )}
          
          <Link href="/shop" className="btn-primary inline-block">
            Browse All Products
          </Link>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
