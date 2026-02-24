'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Settings } from 'lucide-react'

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

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/settings')
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

  const saveSettings = async () => {
    setSaving(true)
    try {
      for (const setting of settings) {
        await fetch(`http://localhost:8000/api/admin/settings/${setting.setting_key}`, {
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
                    
                    return (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {setting.description || setting.setting_key}
                        </label>
                        {setting.setting_type === 'boolean' ? (
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
                        ) : (
                          <input
                            type={setting.setting_type === 'number' ? 'number' : 'text'}
                            value={setting.setting_value || ''}
                            onChange={(e) => updateSetting(key, e.target.value)}
                            className="w-full px-4 py-3 bg-dark-200 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                          />
                        )}
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
