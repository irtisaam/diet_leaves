'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, ShoppingCart, Users, DollarSign, TrendingUp, Eye } from 'lucide-react'

interface DashboardStats {
  total_products: number
  total_orders: number
  total_revenue: number
  pending_orders: number
  low_stock_products: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/dashboard')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Total Products', value: stats?.total_products || 0, icon: Package, color: 'from-emerald-500 to-green-600' },
    { label: 'Total Orders', value: stats?.total_orders || 0, icon: ShoppingCart, color: 'from-blue-500 to-cyan-600' },
    { label: 'Revenue', value: `Rs. ${stats?.total_revenue || 0}`, icon: DollarSign, color: 'from-purple-500 to-pink-600' },
    { label: 'Pending Orders', value: stats?.pending_orders || 0, icon: TrendingUp, color: 'from-orange-500 to-red-600' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white neon-text">Dashboard</h1>
            <p className="text-gray-400">Overview & Statistics</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat, index) => (
                <div key={index} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r opacity-20 rounded-xl blur-xl group-hover:opacity-30 transition-opacity" 
                       style={{ background: `linear-gradient(to right, var(--tw-gradient-stops))` }}></div>
                  <div className="relative bg-dark-100 rounded-xl p-6 border border-gray-800 hover:border-primary-500/50 transition-all">
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${stat.color} mb-4`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link href="/admin/products" className="flex items-center gap-3 p-3 rounded-lg bg-dark-200 hover:bg-dark-300 transition-colors">
                    <Package className="h-5 w-5 text-primary-500" />
                    <span className="text-white">Manage Products</span>
                  </Link>
                  <Link href="/admin/orders" className="flex items-center gap-3 p-3 rounded-lg bg-dark-200 hover:bg-dark-300 transition-colors">
                    <ShoppingCart className="h-5 w-5 text-primary-500" />
                    <span className="text-white">View Orders</span>
                  </Link>
                  <Link href="/" className="flex items-center gap-3 p-3 rounded-lg bg-dark-200 hover:bg-dark-300 transition-colors">
                    <Eye className="h-5 w-5 text-primary-500" />
                    <span className="text-white">View Store</span>
                  </Link>
                </div>
              </div>

              <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-semibold text-white mb-4">Low Stock Alert</h2>
                <div className="text-center py-8">
                  <p className="text-gray-400">
                    {stats?.low_stock_products || 0} products need restocking
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
