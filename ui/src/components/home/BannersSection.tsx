'use client'

import Image from 'next/image'
import Link from 'next/link'

interface Banner {
  id: string
  title: string
  description?: string
  image_url?: string
  link_url?: string
  link_text?: string
  position: string
  is_active: boolean
  display_order: number
}

interface BannersSectionProps {
  banners?: Banner[]
}

export default function BannersSection({ banners = [] }: BannersSectionProps) {
  const activeBanners = banners.filter(b => b.is_active)
  if (activeBanners.length === 0) return null

  // Single banner - full width hero style
  if (activeBanners.length === 1) {
    const banner = activeBanners[0]
    return (
      <section className="py-12 bg-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl overflow-hidden border border-primary/20 min-h-[200px]">
            {banner.image_url && (
              <Image
                src={banner.image_url}
                alt={banner.title}
                fill
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-dark/90 via-dark/60 to-dark/20" />
            <div className="relative z-10 p-8 md:p-12">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 neon-text-subtle">
                {banner.title}
              </h2>
              {banner.description && (
                <p className="text-gray-300 text-base md:text-lg mb-6 max-w-xl">
                  {banner.description}
                </p>
              )}
              {banner.link_url && (
                <Link
                  href={banner.link_url}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors neon-border"
                >
                  {banner.link_text || 'Shop Now'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Multiple banners - grid layout
  return (
    <section className="py-12 bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid gap-6 ${activeBanners.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {activeBanners.map((banner) => (
            <div
              key={banner.id}
              className="relative rounded-2xl overflow-hidden border border-primary/20 min-h-[180px] hover:border-primary/50 transition-all duration-300 group"
            >
              {banner.image_url && (
                <Image
                  src={banner.image_url}
                  alt={banner.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-dark/95 via-dark/60 to-dark/10" />
              <div className="relative z-10 p-6 flex flex-col justify-end h-full">
                <h3 className="text-xl font-bold text-white mb-2">{banner.title}</h3>
                {banner.description && (
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">{banner.description}</p>
                )}
                {banner.link_url && (
                  <Link
                    href={banner.link_url}
                    className="inline-flex items-center gap-2 text-primary font-medium hover:underline text-sm"
                  >
                    {banner.link_text || 'Learn More'} →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
