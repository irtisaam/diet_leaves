'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, User, ShoppingCart, Menu, X, LogOut } from 'lucide-react'
import { useCart } from '@/lib/context/CartContext'
import { useAuth } from '@/lib/context/AuthContext'
import { settingsAPI } from '@/lib/api'
import { NavigationItem } from '@/types'

export default function Header() {
  const { cart, openCart } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [navigation, setNavigation] = useState<NavigationItem[]>([])
  const [announcementText, setAnnouncementText] = useState('FREE SHIPPING ON ORDERS ABOVE RS 2000')
  const [showAnnouncement, setShowAnnouncement] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [navData, settingsData] = await Promise.all([
          settingsAPI.getNavigation(),
          settingsAPI.get()
        ])
        setNavigation(navData as NavigationItem[])
        
        const settings = (settingsData as any).settings
        if (settings?.announcement_bar_text) {
          setAnnouncementText(settings.announcement_bar_text)
        }
        // Show bar only when explicitly enabled
        setShowAnnouncement(settings?.announcement_bar_enabled === 'true')
      } catch (error) {
        setNavigation([
          { id: '1', label: 'Home', url: '/', display_order: 1, is_active: true, parent_id: null },
          { id: '2', label: 'Products', url: '/products', display_order: 2, is_active: true, parent_id: null },
          { id: '3', label: 'Shop', url: '/shop', display_order: 3, is_active: true, parent_id: null },
          { id: '4', label: "FAQ's", url: '/faqs', display_order: 4, is_active: true, parent_id: null },
          { id: '5', label: 'Contact Us', url: '/contact', display_order: 5, is_active: true, parent_id: null },
        ])
      }
    }
    fetchData()
  }, [])

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement Bar - Green primary color */}
      {showAnnouncement && (
        <div className="announcement-bar">
          {announcementText}
        </div>
      )}

      {/* Main Header - Dark with subtle transparency */}
      <nav className="bg-dark/95 backdrop-blur-md border-b border-dark-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo with neon accent */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold tracking-tight text-white">
                Diet<span className="text-primary">Leaves</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.filter(item => item.is_active).map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  className="nav-link text-sm uppercase tracking-wider"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right Icons */}
            <div className="flex items-center space-x-5">
              <button className="text-gray-300 hover:text-primary transition-colors">
                <Search className="h-5 w-5" />
              </button>
              
              <Link href="/account" className="text-gray-300 hover:text-primary transition-colors" title={isAuthenticated ? (user?.full_name || 'Account') : 'Sign In'}>
                <User className="h-5 w-5" />
              </Link>
              
              <button 
                onClick={openCart}
                className="text-gray-300 hover:text-primary transition-colors relative"
              >
                <ShoppingCart className="h-5 w-5" />
                {cart && cart.item_count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.item_count}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-gray-300 hover:text-white"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-dark-100 border-t border-dark-200">
            <div className="px-4 py-4 space-y-1">
              {navigation.filter(item => item.is_active).map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  className="block py-3 text-gray-300 hover:text-primary transition-colors text-sm uppercase tracking-wider"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
