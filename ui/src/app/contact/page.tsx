'use client'

import { useState, useEffect } from 'react'
import {
  Mail, Phone, MessageCircle, Facebook, Instagram, Youtube,
  MapPin, ExternalLink
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface SiteSettings {
  contact_email?: string
  contact_phone?: string
  contact_address?: string
  contact_whatsapp?: string
  social_facebook?: string
  social_instagram?: string
  social_youtube?: string
  about_description?: string
}

function ContactCard({
  icon, label, value, href, color,
}: {
  icon: React.ReactNode; label: string; value: string; href: string; color: string
}) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="group flex items-center gap-4 bg-[#121212] border border-gray-800 hover:border-gray-600 rounded-xl p-5 transition-all duration-300 hover:shadow-lg"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">{label}</p>
        <p className="text-white font-medium truncate group-hover:text-primary-400 transition-colors">{value}</p>
      </div>
      <ExternalLink className="h-4 w-4 text-gray-600 group-hover:text-primary-400 shrink-0 ml-auto transition-colors" />
    </a>
  )
}

function SocialButton({
  href, icon, label, hoverColor,
}: {
  href: string; icon: React.ReactNode; label: string; hoverColor: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex flex-col items-center gap-2 p-5 bg-[#121212] border border-gray-800 rounded-xl transition-all duration-300 hover:scale-105 group ${hoverColor}`}
    >
      <div className="text-gray-400 group-hover:text-inherit transition-colors">{icon}</div>
      <span className="text-gray-500 text-sm group-hover:text-inherit transition-colors">{label}</span>
    </a>
  )
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 bg-[#121212] rounded-xl" />
      ))}
    </div>
  )
}

export default function ContactPage() {
  const [settings, setSettings] = useState<SiteSettings>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/settings`)
      .then(r => r.json())
      .then(data => { if (data && data.settings) setSettings(data.settings) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const {
    contact_email, contact_phone, contact_address, contact_whatsapp,
    social_facebook, social_instagram, social_youtube, about_description,
  } = settings

  const contactItems = [
    contact_email && {
      icon: <Mail className="h-5 w-5 text-primary-400" />,
      label: 'Email', value: contact_email,
      href: `mailto:${contact_email}`, color: 'bg-primary-500/10',
    },
    contact_phone && {
      icon: <Phone className="h-5 w-5 text-blue-400" />,
      label: 'Phone', value: contact_phone,
      href: `tel:${contact_phone.replace(/\s+/g, '')}`, color: 'bg-blue-500/10',
    },
    contact_whatsapp && {
      icon: <MessageCircle className="h-5 w-5 text-emerald-400" />,
      label: 'WhatsApp', value: contact_whatsapp,
      href: `https://wa.me/${contact_whatsapp.replace(/[^0-9]/g, '')}`, color: 'bg-emerald-500/10',
    },
    contact_address && {
      icon: <MapPin className="h-5 w-5 text-orange-400" />,
      label: 'Address', value: contact_address,
      href: `https://maps.google.com/?q=${encodeURIComponent(contact_address)}`, color: 'bg-orange-500/10',
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; href: string; color: string }[]

  const socialItems = [
    social_facebook && { href: social_facebook, icon: <Facebook className="h-6 w-6" />, label: 'Facebook', hoverColor: 'hover:border-blue-600/50 hover:text-blue-400' },
    social_instagram && { href: social_instagram, icon: <Instagram className="h-6 w-6" />, label: 'Instagram', hoverColor: 'hover:border-pink-600/50 hover:text-pink-400' },
    social_youtube && { href: social_youtube, icon: <Youtube className="h-6 w-6" />, label: 'YouTube', hoverColor: 'hover:border-red-600/50 hover:text-red-400' },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string; hoverColor: string }[]

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-500/5 blur-[100px] rounded-full" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 neon-text">Get in Touch</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            We&apos;d love to hear from you. Reach out through any channel below.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-20 space-y-12">
        {/* About description */}
        {loading && <div className="h-32 bg-[#121212] rounded-2xl animate-pulse" />}
        {!loading && about_description && (
          <section className="bg-gradient-to-br from-primary-500/5 to-transparent border border-primary-500/20 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4">About Diet Leaves</h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{about_description}</p>
          </section>
        )}

        {/* Contact channels */}
        <section>
          <h2 className="text-xl font-bold text-white mb-5">Contact Channels</h2>
          {loading ? (
            <Skeleton />
          ) : contactItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactItems.map(item => <ContactCard key={item.label} {...item} />)}
            </div>
          ) : (
            <p className="text-gray-500">No contact information available yet.</p>
          )}
        </section>

        {/* Social links */}
        {!loading && socialItems.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-5">Follow Us</h2>
            <div className="grid grid-cols-3 gap-4">
              {socialItems.map(item => <SocialButton key={item.label} {...item} />)}
            </div>
          </section>
        )}

        {/* FAQ CTA */}
        <section className="bg-[#121212] border border-gray-800 rounded-2xl p-8 text-center">
          <h3 className="text-white font-semibold text-lg mb-2">Looking for answers?</h3>
          <p className="text-gray-400 text-sm mb-5">
            Browse our frequently asked questions for quick help.
          </p>
          <a
            href="/faqs"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            View FAQs
          </a>
        </section>
      </div>
    </div>
  )
}

