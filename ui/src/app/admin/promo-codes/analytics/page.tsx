'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, BarChart2, TrendingUp, DollarSign, ShoppingCart,
  Tag, Users, Clock, Package, Hash, Percent, ChevronDown, ChevronUp,
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ProductSold {
  name: string
  quantity: number
  revenue: number
}

interface UsageDetail {
  order_number: string | null
  customer_name: string | null
  customer_email: string | null
  discount_applied: number
  order_total: number
  order_status: string | null
  used_at: string | null
}

interface PromoStat {
  id: string
  code: string
  description: string | null
  discount_type: string
  discount_value: number
  is_active: boolean
  usage_count: number
  usage_limit: number | null
  total_orders: number
  total_discount_given: number
  total_revenue: number
  products_sold: ProductSold[]
  recent_usage: UsageDetail[]
}

interface AnalyticsSummary {
  total_promo_codes: number
  active_promo_codes: number
  total_promo_orders: number
  total_discount_given: number
  total_promo_revenue: number
}

interface AnalyticsData {
  summary: AnalyticsSummary
  promo_stats: PromoStat[]
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-400',
  processing: 'text-blue-400',
  shipping: 'text-purple-400',
  shipped: 'text-indigo-400',
  delivered: 'text-emerald-400',
  completed: 'text-green-400',
  cancelled: 'text-red-400',
}

export default function PromoAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedPromo, setExpandedPromo] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API}/api/admin/promo-analytics`)
      if (res.ok) setData(await res.json())
    } catch (e) {
      console.error('Failed to fetch promo analytics', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-9 h-9 rounded-lg bg-dark-100 animate-pulse" />
            <div className="h-8 w-64 bg-dark-100 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5 h-24 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-gray-500">Failed to load analytics.</p>
      </div>
    )
  }

  const { summary, promo_stats } = data

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/promo-codes" className="p-2 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Promo Code Analytics</h1>
            <p className="text-gray-500 text-sm">Sales & usage breakdown by promo code</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Promos', value: summary.total_promo_codes, icon: Tag, color: 'text-primary-400', bg: 'bg-primary-500/10' },
            { label: 'Active Promos', value: summary.active_promo_codes, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Promo Orders', value: summary.total_promo_orders, icon: ShoppingCart, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Total Discount', value: `PKR ${summary.total_discount_given.toLocaleString()}`, icon: Percent, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Promo Revenue', value: `PKR ${summary.total_promo_revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          ].map(s => (
            <div key={s.label} className="bg-[#111] border border-[#222] rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">{s.label}</span>
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Per-Promo Breakdown */}
        {promo_stats.length === 0 ? (
          <div className="text-center py-16 bg-[#111] border border-[#222] rounded-xl">
            <BarChart2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No promo code usage data yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {promo_stats.map(promo => {
              const isExpanded = expandedPromo === promo.id
              return (
                <div key={promo.id} className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
                  {/* Promo Header Row */}
                  <button
                    onClick={() => setExpandedPromo(isExpanded ? null : promo.id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-[#141414] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${promo.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <div className="text-left">
                        <div className="flex items-center gap-3">
                          <span className="text-white font-mono font-bold text-lg tracking-wider">{promo.code}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            promo.discount_type === 'percentage'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `Rs ${promo.discount_value}`}
                          </span>
                        </div>
                        {promo.description && (
                          <p className="text-gray-500 text-xs mt-0.5">{promo.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-white font-semibold">{promo.total_orders} orders</p>
                        <p className="text-gray-500 text-xs">{promo.usage_count} uses</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-semibold">PKR {promo.total_revenue.toLocaleString()}</p>
                        <p className="text-gray-500 text-xs">revenue</p>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-400 font-semibold">PKR {promo.total_discount_given.toLocaleString()}</p>
                        <p className="text-gray-500 text-xs">discounted</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-[#222] p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Products Sold */}
                        <div>
                          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                            <Package className="w-4 h-4 text-primary-500" /> Products Sold via This Code
                          </h3>
                          {promo.products_sold.length === 0 ? (
                            <p className="text-gray-600 text-sm">No product data</p>
                          ) : (
                            <div className="space-y-2">
                              {promo.products_sold.map((p, i) => (
                                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#0a0a0a]">
                                  <div>
                                    <p className="text-white text-sm">{p.name}</p>
                                    <p className="text-gray-500 text-xs">{p.quantity} units sold</p>
                                  </div>
                                  <p className="text-emerald-400 text-sm font-semibold">PKR {p.revenue.toLocaleString()}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Recent Usage */}
                        <div>
                          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-400" /> Recent Usage
                          </h3>
                          {promo.recent_usage.length === 0 ? (
                            <p className="text-gray-600 text-sm">No usage data</p>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {promo.recent_usage.map((u, i) => (
                                <div key={i} className="py-2 px-3 rounded-lg bg-[#0a0a0a]">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-white text-sm">
                                        {u.order_number || 'N/A'}
                                        {u.customer_name && <span className="text-gray-500 ml-2">· {u.customer_name}</span>}
                                      </p>
                                      <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-gray-500 text-xs">
                                          {u.used_at ? new Date(u.used_at).toLocaleString() : ''}
                                        </span>
                                        {u.order_status && (
                                          <span className={`text-xs capitalize ${STATUS_COLORS[u.order_status] || 'text-gray-400'}`}>
                                            {u.order_status}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-amber-400 text-sm">-PKR {u.discount_applied.toLocaleString()}</p>
                                      <p className="text-gray-500 text-xs">of PKR {u.order_total.toLocaleString()}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
