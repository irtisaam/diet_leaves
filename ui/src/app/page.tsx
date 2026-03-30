'use client'

import { useState, useEffect } from 'react'
import HeroSection from '@/components/home/HeroSection'
import ProductsSection from '@/components/home/ProductsSection'
import FeaturedProduct from '@/components/home/FeaturedProduct'
import ReviewsSection from '@/components/home/ReviewsSection'
import BannersSection from '@/components/home/BannersSection'
import { settingsAPI } from '@/lib/api'

interface HomepageData {
  hero: any[]
  products: any[]
  reviews: any[]
  banners: any[]
}

export default function Home() {
  const [data, setData] = useState<HomepageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all homepage data in a single request
        const result = await settingsAPI.getHomepageData() as HomepageData
        setData(result)
      } catch (error) {
        console.error('Failed to load homepage:', error)
        setData({ hero: [], products: [], reviews: [], banners: [] })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Show loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-dark">
        {/* Hero skeleton */}
        <div className="relative min-h-[85vh] bg-dark flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-12 w-64 bg-dark-100 rounded mx-auto mb-4" />
            <div className="h-6 w-96 bg-dark-100 rounded mx-auto" />
          </div>
        </div>
        {/* Products skeleton */}
        <div className="py-20 bg-dark">
          <div className="max-w-7xl mx-auto px-4">
            <div className="h-8 w-48 bg-dark-100 rounded mx-auto mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-dark-100 aspect-square rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <HeroSection initialData={data?.hero} />
      <ProductsSection initialData={data?.products} />
      <BannersSection banners={data?.banners} />
      <ReviewsSection initialData={data?.reviews} />
      <FeaturedProduct />
    </>
  )
}
