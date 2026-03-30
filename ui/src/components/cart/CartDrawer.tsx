'use client'

import { X, Minus, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/lib/context/CartContext'

export default function CartDrawer() {
  const { cart, isOpen, closeCart, updateQuantity, removeItem, isLoading } = useCart()

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-dark z-50 shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-dark-200">
            <h2 className="text-xl font-semibold text-white">Your cart</h2>
            <button 
              onClick={closeCart}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {!cart || cart.items.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <p>Your cart is empty</p>
                <Link 
                  href="/shop"
                  onClick={closeCart}
                  className="mt-4 inline-block text-primary-400 hover:text-primary-300"
                >
                  Continue shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-2 text-sm text-gray-400 pb-2 border-b border-dark-200">
                  <span>PRODUCT</span>
                  <span className="text-right">TOTAL</span>
                </div>

                {/* Items */}
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4 py-4 border-b border-dark-200">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-dark-100 rounded overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0] ? (
                        <Image
                          src={item.product.images[0].image_url}
                          alt={item.product.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-dark-200 flex items-center justify-center text-gray-500">
                          No image
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 className="text-white font-medium">
                        {item.product?.name || 'Product'}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Rs.{Number(item.product?.price || 0).toFixed(0)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-dark-200">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={isLoading}
                            className="px-2 py-1 hover:bg-dark-200 transition-colors disabled:opacity-50"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-3 py-1 border-x border-dark-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={isLoading}
                            className="px-2 py-1 hover:bg-dark-200 transition-colors disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={isLoading}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-white font-medium">
                      Rs.{(Number(item.product?.price || 0) * item.quantity).toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart && cart.items.length > 0 && (
            <div className="border-t border-dark-200 p-4 space-y-4">
              {/* Estimated Total */}
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">Estimated total</span>
                <span className="text-white font-bold">Rs.{Number(cart.subtotal || 0).toFixed(0)} PKR</span>
              </div>
              
              <p className="text-gray-400 text-sm">
                Taxes, Discounts and <Link href="/shipping" className="underline">shipping</Link> calculated at checkout.
              </p>

              {/* Buttons */}
              <div className="space-y-2">
                <button 
                  onClick={closeCart}
                  className="w-full btn-secondary"
                >
                  Continue shopping
                </button>
                <Link 
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full btn-primary block text-center"
                >
                  Check out
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
