import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import { CartProvider } from '@/lib/context/CartContext'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Diet Leaves - Natural Stevia Sweeteners',
  description: 'Premium stevia-based sweeteners for a healthier lifestyle. Zero calories, zero sugar, pure sweetness.',
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/** Convert "#rrggbb" to space-separated "R G B" */
function hexToRgb(hex: string): { spaced: string; csv: string } | null {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) return null
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16)
  return { spaced: `${r} ${g} ${b}`, csv: `${r}, ${g}, ${b}` }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch dynamic theme colors from settings (server-side, revalidated every 30s)
  let primaryHex = '#10B981'
  let primaryRgbSpaced = '16 185 129'
  let primaryRgbCsv = '16, 185, 129'
  try {
    const res = await fetch(`${API_URL}/api/settings`, { next: { revalidate: 30 } })
    if (res.ok) {
      const data = await res.json()
      const map: Record<string, string> = data.settings || {}
      if (map.primary_color) {
        const rgb = hexToRgb(map.primary_color)
        if (rgb) {
          primaryHex = map.primary_color
          primaryRgbSpaced = rgb.spaced
          primaryRgbCsv = rgb.csv
        }
      }
    }
  } catch {
    // Backend not reachable — use default colors
  }

  const themeCSS = `:root{--theme-primary:${primaryHex};--theme-primary-rgb:${primaryRgbCsv};--color-primary:${primaryRgbSpaced};}`

  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <CartProvider>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  )
}

