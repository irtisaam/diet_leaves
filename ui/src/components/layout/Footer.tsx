'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Facebook, Instagram, Youtube } from 'lucide-react'
import { settingsAPI } from '@/lib/api'
import { FooterItem } from '@/types'

const iconMap: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
}

export default function Footer() {
  const [footerItems, setFooterItems] = useState<FooterItem[]>([])
  const [year] = useState(new Date().getFullYear())

  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const data = await settingsAPI.getFooter()
        setFooterItems(data as FooterItem[])
      } catch (error) {
        // Use defaults
        setFooterItems([
          { id: '1', label: 'Facebook', item_type: 'social_link', url: '#', icon: 'facebook', section: 'social', display_order: 1, is_active: true },
          { id: '2', label: 'Instagram', item_type: 'social_link', url: '#', icon: 'instagram', section: 'social', display_order: 2, is_active: true },
          { id: '3', label: 'YouTube', item_type: 'social_link', url: '#', icon: 'youtube', section: 'social', display_order: 3, is_active: true },
        ])
      }
    }
    fetchFooter()
  }, [])

  const socialLinks = footerItems.filter(item => item.item_type === 'social_link')
  const legalLinks = footerItems.filter(item => item.section === 'legal')

  return (
    <footer className="bg-dark border-t border-dark-200">
      {/* Social Links */}
      <div className="py-8">
        <div className="flex justify-center space-x-6">
          {socialLinks.map((item) => {
            const Icon = item.icon ? iconMap[item.icon] : null
            return (
              <a
                key={item.id}
                href={item.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-primary-400 transition-colors"
                aria-label={item.label}
              >
                {Icon && <Icon className="h-6 w-6" />}
              </a>
            )
          })}
        </div>
      </div>

      {/* Legal Links & Copyright */}
      <div className="border-t border-dark-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {legalLinks.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mb-4 text-sm text-gray-400">
              {legalLinks.map((item) => (
                <Link
                  key={item.id}
                  href={item.url || '#'}
                  className="hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
          
          <p className="text-center text-gray-500 text-sm">
            © {year}, Diet Leaves
          </p>
        </div>
      </div>
    </footer>
  )
}
