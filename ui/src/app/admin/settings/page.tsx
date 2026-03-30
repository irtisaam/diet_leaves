'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Save, Settings, Upload, X } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Setting {
  setting_key: string
  setting_value: string
  setting_type: string
  description: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`)
      if (res.ok) {
        const data = await res.json()
        setSettings(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (key: string, value: string) => {
    setSettings(settings.map(s => s.setting_key === key ? { ...s, setting_value: value } : s))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'branding')
      const res = await fetch(`${API_URL}/api/admin/upload/image`, { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) {
        updateSetting('site_logo', data.url)
      }
    } catch (error) {
      alert('Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      for (const setting of settings) {
        await fetch(`${API_URL}/api/admin/settings/${setting.setting_key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setting_value: setting.setting_value })
        })
      }
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const settingGroups = {
    'General': ['site_name', 'announcement_bar_text', 'announcement_bar_enabled'],
    'Branding': ['site_logo', 'primary_color', 'secondary_color'],
    'Contact': ['contact_email', 'contact_phone', 'contact_address'],
    'Shipping': ['free_shipping_threshold', 'shipping_cost', 'currency', 'currency_symbol']
  }

  const settingDescriptions: Record<string, { label: string; placeholder: string; help: string }> = {
    site_name: { label: 'Site Name', placeholder: 'e.g. Diet Leaves', help: 'The name displayed in the browser tab and header' },
    announcement_bar_text: { label: 'Announcement Bar Text', placeholder: 'e.g. FREE SHIPPING ON ORDERS ABOVE RS 2000', help: 'Message shown in the top announcement bar on all pages' },
    announcement_bar_enabled: { label: 'Announcement Bar Enabled', placeholder: '', help: 'Toggle the announcement bar visibility on the storefront' },
    site_logo: { label: 'Site Logo', placeholder: '', help: 'Logo image displayed in the header. Uploaded to Supabase Storage (branding folder).' },
    primary_color: { label: 'Primary Color', placeholder: '#4ADE80', help: 'Main brand color used for buttons, links, and accents' },
    secondary_color: { label: 'Secondary Color', placeholder: '#1F2937', help: 'Secondary color used for backgrounds and borders' },
    contact_email: { label: 'Contact Email', placeholder: 'support@dietleaves.com', help: 'Displayed in the footer and contact page' },
    contact_phone: { label: 'Contact Phone', placeholder: '+92 300 1234567', help: 'Customer support phone number' },
    contact_address: { label: 'Contact Address', placeholder: 'Lahore, Pakistan', help: 'Physical store or office address' },
    free_shipping_threshold: { label: 'Free Shipping Threshold', placeholder: '2000', help: 'Order amount (in PKR) above which shipping is free' },
    shipping_cost: { label: 'Default Shipping Cost', placeholder: '200', help: 'Standard shipping fee applied when below the free threshold' },
    currency: { label: 'Currency Code', placeholder: 'PKR', help: 'ISO currency code used in the system' },
    currency_symbol: { label: 'Currency Symbol', placeholder: 'Rs.', help: 'Symbol shown before prices on the storefront' },
  }

  const renderField = (key: string, setting: Setting) => {
    const meta = settingDescriptions[key]

    if (setting.setting_type === 'boolean') {
      return (
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={setting.setting_value === 'true'}
              onChange={(e) => updateSetting(key, e.target.checked ? 'true' : 'false')}
              className="sr-only"
            />
            <div className={`w-12 h-6 rounded-full transition-colors ${setting.setting_value === 'true' ? 'bg-primary-500' : 'bg-gray-700'}`}></div>
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${setting.setting_value === 'true' ? 'translate-x-6' : ''}`}></div>
          </div>
          <span className="text-gray-400">{setting.setting_value === 'true' ? 'Enabled' : 'Disabled'}</span>
        </label>
      )
    }

    // Logo upload widget
    if (key === 'site_logo') {
      return (
        <div className="space-y-3">
          {setting.setting_value && setting.setting_value.startsWith('http') ? (
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 bg-dark-200 rounded-lg overflow-hidden border border-gray-700 flex items-center justify-center">
                <Image src={setting.setting_value} alt="Logo" fill className="object-contain p-2" />
              </div>
              <button
                type="button"
                onClick={() => updateSetting('site_logo', '')}
                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => logoInputRef.current?.click()}
              className="border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-primary-500 transition-colors"
            >
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="text-gray-400 text-sm">{uploadingLogo ? 'Uploading...' : 'Click to upload logo image'}</p>
              <p className="text-gray-600 text-xs">PNG, JPG, WebP up to 5MB</p>
            </div>
          )}
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </div>
      )
    }

    // Color picker
    if (key === 'primary_color' || key === 'secondary_color') {
      return (
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="color"
              value={setting.setting_value || (key === 'primary_color' ? '#10B981' : '#1F2937')}
              onChange={(e) => updateSetting(key, e.target.value)}
              className="w-14 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0"
            />
          </div>
          <input
            type="text"
            value={setting.setting_value || ''}
            onChange={(e) => updateSetting(key, e.target.value)}
            placeholder={meta?.placeholder || ''}
            className="flex-1 px-4 py-3 bg-dark-200 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors font-mono"
          />
          <div
            className="w-10 h-10 rounded-lg border border-gray-700 flex-shrink-0"
            style={{ backgroundColor: setting.setting_value || '#666' }}
          />
        </div>
      )
    }

    return (
      <input
        type={setting.setting_type === 'number' ? 'number' : 'text'}
        value={setting.setting_value || ''}
        onChange={(e) => updateSetting(key, e.target.value)}
        placeholder={meta?.placeholder || ''}
        className="w-full px-4 py-3 bg-dark-200 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white neon-text">Settings</h1>
              <p className="text-gray-400">Configure your store</p>
            </div>
          </div>
          <button 
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 neon-border"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        ) : settings.length === 0 ? (
          <div className="text-center py-20 bg-dark-100 rounded-xl border border-gray-800">
            <Settings className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No settings found</p>
            <p className="text-gray-500 mt-2">Run the database schema to create default settings</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(settingGroups).map(([groupName, keys]) => (
              <div key={groupName} className="bg-dark-100 rounded-xl border border-gray-800 overflow-hidden">
                <div className="px-6 py-4 bg-dark-200 border-b border-gray-800">
                  <h2 className="text-lg font-semibold text-white">{groupName}</h2>
                </div>
                <div className="p-6 space-y-6">
                  {keys.map(key => {
                    const setting = settings.find(s => s.setting_key === key)
                    if (!setting) return null
                    const meta = settingDescriptions[key]
                    return (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          {meta?.label || setting.description || setting.setting_key}
                        </label>
                        {meta?.help && (
                          <p className="text-xs text-gray-500 mb-2">{meta.help}</p>
                        )}
                        {renderField(key, setting)}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
