'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Facebook, Instagram, Youtube } from 'lucide-react'
import { settingsAPI } from '@/lib/api'
import { FooterItem } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const iconMap: Record<string, React.ElementType> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
}

interface SocialSettings {
  social_facebook?: string
  social_instagram?: string
  social_youtube?: string
}

export default function Footer() {
  const [footerItems, setFooterItems] = useState<FooterItem[]>([])
  const [socialSettings, setSocialSettings] = useState<SocialSettings>({})
  const [year] = useState(new Date().getFullYear())

  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const data = await settingsAPI.getFooter()
        setFooterItems(data as FooterItem[])
      } catch (error) {
        setFooterItems([])
      }
    }

    const fetchSocialSettings = async () => {
      try {
        const res = await fetch(`${API}/api/settings`)
        const data = await res.json()
        if (data && data.settings) {
          setSocialSettings({
            social_facebook: data.settings.social_facebook || '',
            social_instagram: data.settings.social_instagram || '',
            social_youtube: data.settings.social_youtube || '',
          })
        }
      } catch { /* ignore */ }
    }

    fetchFooter()
    fetchSocialSettings()
  }, [])

  const legalLinks = footerItems.filter(item => item.section === 'legal')

  // Build dynamic social links from settings, fall back to footer_items social_link entries
  const dynamicSocial: { key: string; label: string; url: string; icon: React.ElementType }[] = []
  if (socialSettings.social_facebook) {
    dynamicSocial.push({ key: 'facebook', label: 'Facebook', url: socialSettings.social_facebook, icon: Facebook })
  }
  if (socialSettings.social_instagram) {
    dynamicSocial.push({ key: 'instagram', label: 'Instagram', url: socialSettings.social_instagram, icon: Instagram })
  }
  if (socialSettings.social_youtube) {
    dynamicSocial.push({ key: 'youtube', label: 'YouTube', url: socialSettings.social_youtube, icon: Youtube })
  }

  // Fall back to footer_items if no settings-based socials configured
  const socialLinks = dynamicSocial.length > 0
    ? dynamicSocial
    : footerItems
        .filter(item => item.item_type === 'social_link')
        .map(item => ({
          key: item.icon || item.id,
          label: item.label,
          url: item.url || '#',
          icon: item.icon ? (iconMap[item.icon] || Facebook) : Facebook,
        }))

  return (
    <footer className="bg-dark border-t border-dark-200">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="text-2xl font-bold text-white">
              Diet<span className="text-primary">Leaves</span>
            </Link>
            <p className="text-gray-400 mt-4 max-w-md">
              Premium stevia-based sweeteners for a healthier lifestyle. Zero calories, pure sweetness.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/shop" className="text-gray-400 hover:text-primary transition-colors">Shop</Link></li>
              <li><Link href="/products" className="text-gray-400 hover:text-primary transition-colors">Products</Link></li>
              <li><Link href="/faqs" className="text-gray-400 hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          {/* Social */}
          <div>
            <h4 className="text-white font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              {socialLinks.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.key}
                    href={item.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-dark-100 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-dark-200 transition-all"
                    aria-label={item.label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-dark-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {legalLinks.length > 0 && (
              <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
                {legalLinks.map((item) => (
                  <Link
                    key={item.id}
                    href={item.url || '#'}
                    className="hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
            
            <p className="text-gray-500 text-sm">
              © {year} Diet Leaves. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
