'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Cart, CartItem } from '@/types'
import { cartAPI } from '@/lib/api'

interface CartContextType {
  cart: Cart | null
  isOpen: boolean
  isLoading: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  addToCart: (productId: string, quantity?: number, variantId?: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const refreshCart = useCallback(async () => {
    try {
      const data = await cartAPI.get()
      setCart(data as Cart)
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    }
  }, [])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)
  const toggleCart = () => setIsOpen(prev => !prev)

  const addToCart = async (productId: string, quantity = 1, variantId?: string) => {
    setIsLoading(true)
    try {
      await cartAPI.add(productId, quantity, variantId)
      await refreshCart()
      openCart()
    } catch (error) {
      console.error('Failed to add to cart:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    setIsLoading(true)
    try {
      if (quantity <= 0) {
        await cartAPI.remove(itemId)
      } else {
        await cartAPI.update(itemId, quantity)
      }
      await refreshCart()
    } catch (error) {
      console.error('Failed to update quantity:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const removeItem = async (itemId: string) => {
    setIsLoading(true)
    try {
      await cartAPI.remove(itemId)
      await refreshCart()
    } catch (error) {
      console.error('Failed to remove item:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const clearCart = async () => {
    setIsLoading(true)
    try {
      await cartAPI.clear()
      await refreshCart()
    } catch (error) {
      console.error('Failed to clear cart:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        isLoading,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
