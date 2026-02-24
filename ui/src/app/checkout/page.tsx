'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/context/CartContext'
import { ordersAPI } from '@/lib/api'

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, refreshCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    customer_email: '',
    customer_name: '',
    customer_phone: '',
    shipping_address: '',
    shipping_city: '',
    shipping_country: 'Pakistan',
    shipping_postal_code: '',
    billing_same_as_shipping: true,
    billing_address: '',
    billing_city: '',
    customer_notes: '',
    email_offers: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cart || cart.items.length === 0) return

    setIsSubmitting(true)
    setError('')

    try {
      const orderData = {
        ...formData,
        payment_method: 'cod',
        items: cart.items.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.product?.price || 0,
        }))
      }

      const order = await ordersAPI.create(orderData)
      
      // Clear cart and redirect to success
      await refreshCart()
      router.push(`/checkout/success?order=${(order as any).order_number}`)
    } catch (err: any) {
      setError(err.message || 'Failed to place order')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <Link href="/shop" className="text-primary-600 hover:underline">
            Continue shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Logo */}
        <Link href="/" className="text-3xl font-bold text-gray-900 mb-8 block">
          Diet<span className="text-primary-600">Leaves</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Checkout Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
                  <Link href="/account/login" className="text-primary-600 text-sm">Sign in</Link>
                </div>
                
                <input
                  type="email"
                  name="customer_email"
                  placeholder="Email"
                  value={formData.customer_email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-primary-500 text-gray-900"
                />
                
                <label className="flex items-center gap-2 mt-3 text-gray-600 text-sm">
                  <input
                    type="checkbox"
                    name="email_offers"
                    checked={formData.email_offers}
                    onChange={handleChange}
                    className="rounded"
                  />
                  Email me with news and offers
                </label>
              </div>

              {/* Delivery */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery</h2>
                
                <div className="space-y-4">
                  <select
                    name="shipping_country"
                    value={formData.shipping_country}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-primary-500 text-gray-900"
                  >
                    <option value="Pakistan">Pakistan</option>
                  </select>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="customer_name"
                      placeholder="Full name"
                      value={formData.customer_name}
                      onChange={handleChange}
                      required
                      className="px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-primary-500 text-gray-900"
                    />
                    <input
                      type="tel"
                      name="customer_phone"
                      placeholder="Phone (optional)"
                      value={formData.customer_phone}
                      onChange={handleChange}
                      className="px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-primary-500 text-gray-900"
                    />
                  </div>

                  <input
                    type="text"
                    name="shipping_address"
                    placeholder="Address"
                    value={formData.shipping_address}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-primary-500 text-gray-900"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="shipping_city"
                      placeholder="City"
                      value={formData.shipping_city}
                      onChange={handleChange}
                      required
                      className="px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-primary-500 text-gray-900"
                    />
                    <input
                      type="text"
                      name="shipping_postal_code"
                      placeholder="Postal code (optional)"
                      value={formData.shipping_postal_code}
                      onChange={handleChange}
                      className="px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-primary-500 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping method</h2>
                <div className="border border-gray-200 rounded p-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">Standard Shipping</p>
                      <p className="text-sm text-gray-500">( BarqRaftar & PostEx )</p>
                    </div>
                    <span className="font-medium text-gray-900">
                      {cart.subtotal >= 2000 ? 'FREE' : `Rs ${cart.shipping.toFixed(0)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment</h2>
                <p className="text-sm text-gray-500 mb-4">All transactions are secure and encrypted.</p>
                
                <div className="border border-primary-500 rounded p-4 bg-primary-50">
                  <p className="font-medium text-gray-900">Cash on Delivery (COD)</p>
                </div>
              </div>

              {/* Billing Address */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing address</h2>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="billing_same_as_shipping"
                      checked={formData.billing_same_as_shipping}
                      onChange={() => setFormData(prev => ({ ...prev, billing_same_as_shipping: true }))}
                      className="text-primary-600"
                    />
                    <span className="text-gray-700">Same as shipping address</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="billing_same_as_shipping"
                      checked={!formData.billing_same_as_shipping}
                      onChange={() => setFormData(prev => ({ ...prev, billing_same_as_shipping: false }))}
                      className="text-primary-600"
                    />
                    <span className="text-gray-700">Use a different billing address</span>
                  </label>
                </div>

                {!formData.billing_same_as_shipping && (
                  <div className="mt-4 space-y-4">
                    <input
                      type="text"
                      name="billing_address"
                      placeholder="Billing address"
                      value={formData.billing_address}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-primary-500 text-gray-900"
                    />
                    <input
                      type="text"
                      name="billing_city"
                      placeholder="Billing city"
                      value={formData.billing_city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-primary-500 text-gray-900"
                    />
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-600 text-white py-4 rounded font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Complete order'}
              </button>

              {/* Footer Links */}
              <div className="flex flex-wrap gap-4 text-sm text-primary-600 pt-4 border-t">
                <Link href="/refund">Refund policy</Link>
                <Link href="/shipping">Shipping</Link>
                <Link href="/privacy">Privacy policy</Link>
                <Link href="/terms">Terms of service</Link>
                <Link href="/contact">Contact</Link>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-8 rounded-lg h-fit sticky top-8">
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-16 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                    {item.product?.images?.[0] ? (
                      <Image
                        src={item.product.images[0].image_url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300" />
                    )}
                    <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{item.product?.name}</p>
                  </div>
                  <div className="text-gray-900">
                    Rs {((item.product?.price || 0) * item.quantity).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>

            {/* Discount Code */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Discount code"
                className="flex-1 px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-primary-500 text-gray-900"
              />
              <button className="px-6 py-3 border border-gray-300 rounded text-gray-400 hover:text-gray-600">
                Apply
              </button>
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>Rs {cart.subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{cart.shipping === 0 ? 'FREE' : `Rs ${cart.shipping.toFixed(0)}`}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-4">
                <span>Total</span>
                <span>
                  <span className="text-sm font-normal text-gray-500 mr-2">PKR</span>
                  Rs {cart.total.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
