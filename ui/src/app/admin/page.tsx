'use client'

import Link from 'next/link'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings,
  Image,
  Menu,
  Star,
  FileText
} from 'lucide-react'

export default function AdminPage() {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard', description: 'Overview & Statistics' },
    { icon: Package, label: 'Products', href: '/admin/products', description: 'Manage Products' },
    { icon: ShoppingCart, label: 'Orders', href: '/admin/orders', description: 'Order Management' },
    { icon: Users, label: 'Customers', href: '/admin/customers', description: 'Customer Management' },
    { icon: Image, label: 'Hero Sections', href: '/admin/hero', description: 'Homepage Hero' },
    { icon: FileText, label: 'Banners', href: '/admin/banners', description: 'Promotional Banners' },
    { icon: Menu, label: 'Navigation', href: '/admin/navigation', description: 'Menu Items' },
    { icon: Star, label: 'Reviews', href: '/admin/reviews', description: 'Product Reviews' },
    { icon: Settings, label: 'Settings', href: '/admin/settings', description: 'Site Settings' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-2 neon-text">Admin Panel</h1>
        <p className="text-gray-400 mb-12">Manage your Diet Leaves store</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className="group relative bg-[#121212] p-6 rounded-xl border border-gray-800 hover:border-primary-500/50 transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                  <item.icon className="h-6 w-6 text-primary-500 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] transition-all" />
                </div>
                <h3 className="text-white font-semibold text-lg group-hover:text-primary-400 transition-colors">{item.label}</h3>
                <p className="text-gray-500 text-sm mt-1">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 p-6 bg-[#121212] rounded-xl border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4 neon-text-subtle">Admin Panel Status</h2>
          <p className="text-gray-400">
            The admin panel is configured and ready. Each section above links to a management page
            where you can perform CRUD operations. The backend API is fully functional with all
            admin routes available at <code className="text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded">/api/admin/*</code>.
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-500">API Endpoints available:</p>
            <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
              <li>GET/POST/PUT/DELETE /api/admin/products</li>
              <li>GET/PUT /api/admin/orders</li>
              <li>GET/POST/PUT/DELETE /api/admin/hero</li>
              <li>GET/POST/PUT/DELETE /api/admin/banners</li>
              <li>GET/POST/PUT/DELETE /api/admin/navigation</li>
              <li>GET/POST/PUT/DELETE /api/admin/footer</li>
              <li>GET/PUT /api/admin/settings</li>
              <li>GET /api/admin/dashboard</li>
              <li>GET/PUT /api/admin/inventory</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
