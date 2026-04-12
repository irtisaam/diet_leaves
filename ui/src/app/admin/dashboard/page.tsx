'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Package, ShoppingCart, DollarSign, TrendingUp, Eye,
  BarChart2, TrendingDown, Users, Star, Calendar, Warehouse,
  ArrowUpRight, ArrowDownRight, Clock, Award, AlertTriangle, Ticket
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ProductAnalytic {
  id: string; name: string; slug?: string; image?: string
  price: number; cost: number; margin: number
  units_sold: number; revenue: number; profit: number
}

interface MonthlyData { month: string; label: string; revenue: number; orders: number }
interface WeeklyData { week: string; label: string; revenue: number; orders: number }

interface DashboardStats {
  total_orders: number; total_revenue: number; avg_order_value: number
  total_products: number; total_users: number; new_users_month: number
  pending_reviews: number
  today_orders: number; today_revenue: number
  this_month_orders: number; this_month_revenue: number
  orders_by_status: Record<string, number>
  monthly_data: MonthlyData[]; weekly_data: WeeklyData[]
  analytics_available: boolean
  product_analytics: ProductAnalytic[]
  top_products: ProductAnalytic[]; least_products: ProductAnalytic[]
  top_by_revenue: ProductAnalytic[]
  total_cost: number; total_profit: number
  inventory_summary: { total_items: number; low_stock: number; expired: number; stock_value: number }
  promo_summary: { total_codes: number; active_codes: number; promo_orders: number; total_discount: number }
}

function MiniBar({ data, maxVal, color }: { data: { label: string; value: number }[]; maxVal: number; color: string }) {
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`w-full rounded-t ${color} transition-all`}
            style={{ height: `${maxVal > 0 ? Math.max((d.value / maxVal) * 100, 4) : 4}%` }}
            title={`${d.label}: PKR ${d.value.toLocaleString()}`}
          />
          <span className="text-[9px] text-gray-600 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  processing: 'bg-blue-500/20 text-blue-400',
  shipping: 'bg-purple-500/20 text-purple-400',
  shipped: 'bg-indigo-500/20 text-indigo-400',
  delivered: 'bg-emerald-500/20 text-emerald-400',
  completed: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
  refunded: 'bg-gray-500/20 text-gray-400',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/dashboard`)
      if (res.ok) setStats(await res.json())
    } catch (e) {
      console.error('Failed to fetch stats:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-9 h-9 rounded-lg bg-dark-100 animate-pulse" />
            <div>
              <div className="h-8 w-40 bg-dark-100 rounded animate-pulse mb-1" />
              <div className="h-4 w-64 bg-dark-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5">
                <div className="h-4 w-20 bg-dark-200 rounded animate-pulse mb-3" />
                <div className="h-8 w-28 bg-dark-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-36 bg-dark-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-6 h-52 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-gray-500">Failed to load dashboard data.</p>
      </div>
    )
  }

  const profitMargin = stats.total_revenue > 0
    ? ((stats.total_profit / stats.total_revenue) * 100).toFixed(1)
    : '0'

  const monthlyMax = Math.max(...stats.monthly_data.map(m => m.revenue), 1)
  const weeklyMax = Math.max(...stats.weekly_data.map(w => w.revenue), 1)

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-500 text-sm">Business analytics & performance overview</p>
          </div>
        </div>

        {/* ── Row 1: Key Metrics ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Revenue', value: `PKR ${stats.total_revenue.toLocaleString()}`, sub: `${stats.total_orders} orders`, icon: DollarSign, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
            { label: 'Net Profit', value: `PKR ${stats.total_profit.toLocaleString()}`, sub: `${profitMargin}% margin`, icon: TrendingUp, color: stats.total_profit >= 0 ? 'text-emerald-400' : 'text-red-400', bgColor: stats.total_profit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10' },
            { label: 'Avg Order Value', value: `PKR ${stats.avg_order_value.toLocaleString()}`, sub: `${stats.total_users} customers`, icon: ShoppingCart, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
            { label: 'Total Cost', value: `PKR ${stats.total_cost.toLocaleString()}`, sub: `${stats.total_products} products`, icon: TrendingDown, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
          ].map(s => (
            <div key={s.label} className="bg-[#111] border border-[#222] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">{s.label}</span>
                <div className={`p-2 rounded-lg ${s.bgColor}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-gray-500 text-xs mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Row 2: Today & This Month + Order Status ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Today */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-primary-500" />
              <h3 className="text-white font-semibold text-sm">Today</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs">Orders</p>
                <p className="text-2xl font-bold text-white">{stats.today_orders}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Revenue</p>
                <p className="text-2xl font-bold text-emerald-400">PKR {stats.today_revenue.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#222]">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-500 text-xs">This Month</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white font-semibold">{stats.this_month_orders} orders</p>
                </div>
                <div>
                  <p className="text-emerald-400 font-semibold">PKR {stats.this_month_revenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-4 h-4 text-blue-400" />
              <h3 className="text-white font-semibold text-sm">Orders by Status</h3>
            </div>
            <div className="space-y-2">
              {Object.entries(stats.orders_by_status).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[status] || 'bg-gray-500/20 text-gray-400'}`}>
                    {status}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-[#1a1a1a] rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-primary-500"
                        style={{ width: `${stats.total_orders > 0 ? (count / stats.total_orders) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-white text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory + Quick Stats */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Warehouse className="w-4 h-4 text-amber-400" />
              <h3 className="text-white font-semibold text-sm">Inventory & Users</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-gray-400 text-sm">Inventory Items</span>
                <span className="text-white font-semibold">{stats.inventory_summary.total_items}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-gray-400 text-sm">Stock Value</span>
                <span className="text-emerald-400 font-semibold">PKR {stats.inventory_summary.stock_value.toLocaleString()}</span>
              </div>
              {stats.inventory_summary.low_stock > 0 && (
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-amber-400 text-sm flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Low Stock</span>
                  <span className="text-amber-400 font-semibold">{stats.inventory_summary.low_stock}</span>
                </div>
              )}
              {stats.inventory_summary.expired > 0 && (
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-red-400 text-sm">Expired Items</span>
                  <span className="text-red-400 font-semibold">{stats.inventory_summary.expired}</span>
                </div>
              )}
              <div className="pt-3 border-t border-[#222]">
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-400 text-sm flex items-center gap-1"><Users className="w-3 h-3" /> Total Users</span>
                  <span className="text-white font-semibold">{stats.total_users}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-400 text-sm">New This Month</span>
                  <span className="text-blue-400 font-semibold">+{stats.new_users_month}</span>
                </div>
                {stats.pending_reviews > 0 && (
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-gray-400 text-sm flex items-center gap-1"><Star className="w-3 h-3" /> Pending Reviews</span>
                    <span className="text-amber-400 font-semibold">{stats.pending_reviews}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 3: Monthly & Weekly Revenue Charts ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Monthly Revenue */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-white font-semibold text-sm">Monthly Revenue</h3>
              </div>
              <span className="text-gray-600 text-xs">Last 12 months</span>
            </div>
            <MiniBar
              data={stats.monthly_data.map(m => ({ label: m.label.split(' ')[0], value: m.revenue }))}
              maxVal={monthlyMax}
              color="bg-emerald-500"
            />
            <div className="mt-3 pt-3 border-t border-[#1a1a1a] grid grid-cols-3 gap-2">
              {stats.monthly_data.slice(-3).map(m => (
                <div key={m.month} className="text-center">
                  <p className="text-gray-500 text-[10px]">{m.label}</p>
                  <p className="text-white text-xs font-semibold">PKR {m.revenue.toLocaleString()}</p>
                  <p className="text-gray-600 text-[10px]">{m.orders} orders</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Revenue */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <h3 className="text-white font-semibold text-sm">Weekly Revenue</h3>
              </div>
              <span className="text-gray-600 text-xs">Last 8 weeks</span>
            </div>
            <MiniBar
              data={stats.weekly_data.map(w => ({ label: w.label, value: w.revenue }))}
              maxVal={weeklyMax}
              color="bg-blue-500"
            />
            <div className="mt-3 pt-3 border-t border-[#1a1a1a] grid grid-cols-3 gap-2">
              {stats.weekly_data.slice(-3).map(w => (
                <div key={w.week} className="text-center">
                  <p className="text-gray-500 text-[10px]">{w.label}</p>
                  <p className="text-white text-xs font-semibold">PKR {w.revenue.toLocaleString()}</p>
                  <p className="text-gray-600 text-[10px]">{w.orders} orders</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 4: Top & Least Products ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Top Products */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-emerald-400" />
              <h3 className="text-white font-semibold text-sm">Top Products (by Units Sold)</h3>
            </div>
            {stats.top_products.length === 0 ? (
              <p className="text-gray-600 text-sm">No sales data yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.top_products.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      i === 1 ? 'bg-gray-400/20 text-gray-300' :
                      i === 2 ? 'bg-amber-700/20 text-amber-600' :
                      'bg-[#1a1a1a] text-gray-500'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.name}</p>
                      <p className="text-gray-500 text-xs">{p.units_sold} sold · PKR {p.revenue.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${p.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        PKR {p.profit.toLocaleString()}
                      </p>
                      <p className="text-gray-600 text-[10px]">profit</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Least Performing */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <ArrowDownRight className="w-4 h-4 text-red-400" />
              <h3 className="text-white font-semibold text-sm">Least Performing Products</h3>
            </div>
            {stats.least_products.length === 0 ? (
              <p className="text-gray-600 text-sm">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.least_products.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-red-500/10 text-red-400">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.name}</p>
                      <p className="text-gray-500 text-xs">{p.units_sold} sold · PKR {p.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">{p.units_sold} units</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Row 5: Full Product Analytics Table ── */}
        {stats.analytics_available && stats.product_analytics.length > 0 && (
          <div className="bg-[#111] border border-[#222] rounded-xl mb-6 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#222] flex items-center gap-3">
              <BarChart2 className="h-5 w-5 text-primary-500" />
              <h2 className="text-white font-semibold">Product Cost & Profit Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[#222]">
                  <tr>
                    {['Product', 'Price', 'Cost', 'Margin', 'Sold', 'Revenue', 'Profit'].map(h => (
                      <th key={h} className="text-left text-gray-500 font-medium px-5 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {stats.product_analytics.map(p => (
                    <tr key={p.id} className="hover:bg-[#141414] transition-colors">
                      <td className="px-5 py-3 text-white font-medium max-w-[200px] truncate">{p.name}</td>
                      <td className="px-5 py-3 text-gray-300">PKR {p.price.toLocaleString()}</td>
                      <td className="px-5 py-3 text-gray-400">{p.cost > 0 ? `PKR ${p.cost.toFixed(2)}` : <span className="text-gray-600">—</span>}</td>
                      <td className="px-5 py-3">
                        {p.cost > 0 ? (
                          <span className={p.margin >= 0 ? 'text-emerald-400' : 'text-red-400'}>PKR {p.margin.toFixed(2)}</span>
                        ) : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-3 text-gray-300">{p.units_sold}</td>
                      <td className="px-5 py-3 text-gray-300">PKR {p.revenue.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        {p.profit !== 0 ? (
                          <span className={`font-semibold ${p.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            PKR {p.profit.toFixed(2)}
                          </span>
                        ) : <span className="text-gray-600">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-[#333] bg-[#0a0a0a]">
                  <tr>
                    <td className="px-5 py-3 text-white font-semibold" colSpan={4}>Totals</td>
                    <td className="px-5 py-3 text-white font-semibold">{stats.product_analytics.reduce((s, p) => s + p.units_sold, 0)}</td>
                    <td className="px-5 py-3 text-white font-semibold">PKR {stats.total_revenue.toLocaleString()}</td>
                    <td className="px-5 py-3 font-bold text-emerald-400">PKR {stats.total_profit.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {stats.product_analytics.some(p => p.cost === 0) && (
              <p className="text-gray-600 text-xs px-5 pb-3 pt-1">
                Products showing — have no inventory items linked. Link them in the product editor.
              </p>
            )}
          </div>
        )}

        {/* ── Promo Code Summary ── */}
        {stats.promo_summary && stats.promo_summary.total_codes > 0 && (
          <div className="bg-[#111] border border-[#222] rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-purple-400" />
                <h3 className="text-white font-semibold text-sm">Promo Code Sales</h3>
              </div>
              <Link href="/admin/promo-codes/analytics" className="text-primary-500 text-xs hover:text-primary-400 flex items-center gap-1">
                View Details <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-500 text-xs">Total Codes</p>
                <p className="text-xl font-bold text-white">{stats.promo_summary.total_codes}</p>
                <p className="text-gray-600 text-xs">{stats.promo_summary.active_codes} active</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Promo Orders</p>
                <p className="text-xl font-bold text-blue-400">{stats.promo_summary.promo_orders}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Discounts Given</p>
                <p className="text-xl font-bold text-amber-400">PKR {stats.promo_summary.total_discount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Avg Discount/Order</p>
                <p className="text-xl font-bold text-purple-400">
                  PKR {stats.promo_summary.promo_orders > 0
                    ? Math.round(stats.promo_summary.total_discount / stats.promo_summary.promo_orders).toLocaleString()
                    : '0'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: '/admin/products', label: 'Products', icon: Package, color: 'text-emerald-400' },
              { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, color: 'text-blue-400' },
              { href: '/admin/inventory', label: 'Inventory', icon: Warehouse, color: 'text-amber-400' },
              { href: '/admin/promo-codes', label: 'Promo Codes', icon: Ticket, color: 'text-purple-400' },
              { href: '/', label: 'View Store', icon: Eye, color: 'text-purple-400' },
            ].map(a => (
              <Link key={a.href} href={a.href} className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] hover:border-primary-500/30 transition-colors group">
                <a.icon className={`w-5 h-5 ${a.color}`} />
                <span className="text-gray-300 text-sm group-hover:text-white transition-colors">{a.label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-600 ml-auto group-hover:text-primary-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
