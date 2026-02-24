'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, User, ShoppingCart, Menu, X } from 'lucide-react'
import { useCart } from '@/lib/context/CartContext'
import { settingsAPI } from '@/lib/api'
import { NavigationItem } from '@/types'

export default function Header() {
  const { cart, openCart } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [navigation, setNavigation] = useState<NavigationItem[]>([])
  const [announcementText, setAnnouncementText] = useState('FREE SHIPPING ON ORDERS ABOVE RS 2000')
  const [showAnnouncement, setShowAnnouncement] = useState(true)

  useEffect(() => {
    // Fetch navigation and settings
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
        if (settings?.announcement_bar_enabled === 'false') {
          setShowAnnouncement(false)
        }
      } catch (error) {
        // Use default navigation
        setNavigation([
          { id: '1', label: 'Home', url: '/', display_order: 1, is_active: true, parent_id: null },
          { id: '2', label: 'Products', url: '/products', display_order: 2, is_active: true, parent_id: null },
          { id: '3', label: 'Shop', url: '/shop', display_order: 3, is_active: true, parent_id: null },
          { id: '4', label: "FAQ's", url: '/faqs', display_order: 4, is_active: true, parent_id: null },
          { id: '5', label: 'Contact Us', url: '/contact', display_order: 5, is_active: true, parent_id: null },
          { id: '6', label: 'Blog', url: '/blog', display_order: 6, is_active: true, parent_id: null },
        ])
      }
    }
    fetchData()
  }, [])

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement Bar */}
      {showAnnouncement && (
        <div className="announcement-bar text-white text-center py-2.5 text-sm font-medium tracking-wide">
          {announcementText}
        </div>
      )}

      {/* Main Header */}
      <nav className="bg-[#0a0a0a]/95 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <span className="text-2xl font-bold text-white tracking-tight">
                Diet<span className="text-primary-500 neon-text-subtle group-hover:neon-text transition-all duration-300">Leaves</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  className="text-gray-300 hover:text-primary-400 transition-colors duration-200 text-sm font-medium hover-underline"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right Icons */}
            <div className="flex items-center space-x-5">
              <button className="text-gray-300 hover:text-primary-400 transition-all duration-200 hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                <Search className="h-5 w-5" />
              </button>
              
              <Link href="/account" className="text-gray-300 hover:text-primary-400 transition-all duration-200 hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                <User className="h-5 w-5" />
              </Link>
              
              <button 
                onClick={openCart}
                className="text-gray-300 hover:text-primary-400 transition-all duration-200 relative hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              >
                <ShoppingCart className="h-5 w-5" />
                {cart && cart.item_count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center pulse-glow">
                    {cart.item_count}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-gray-300 hover:text-primary-400"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#0a0a0a] border-t border-gray-800">
            <div className="px-4 py-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  className="block py-2 text-white hover:text-primary-400 transition-colors"
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
