'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { settingsAPI } from '@/lib/api'
import { HeroSection as HeroSectionType } from '@/types'

interface HeroSectionProps {
  initialData?: HeroSectionType[]
}

export default function HeroSection({ initialData }: HeroSectionProps) {
  const [heroSlides, setHeroSlides] = useState<HeroSectionType[]>(initialData || [])
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    // Only fetch if no initial data provided
    if (initialData) return
    
    const fetchHero = async () => {
      try {
        const data = await settingsAPI.getHero()
        setHeroSlides(data as HeroSectionType[])
      } catch (error) {
        setHeroSlides([])
      }
    }
    fetchHero()
  }, [initialData])

  useEffect(() => {
    if (heroSlides.length <= 1) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [heroSlides.length])

  // Default hero with neon accent
  if (heroSlides.length === 0) {
    return (
      <section className="relative min-h-[85vh] bg-dark flex items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-100 to-dark" />
          <div className="absolute top-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="relative text-center px-4 z-10 max-w-4xl">
          <p className="text-primary text-sm uppercase tracking-widest mb-4">Natural Sweetness</p>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 neon-text">
            DIET<span className="text-primary">LEAVES</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Pure stevia sweetness. Zero calories. Zero guilt. The healthiest way to satisfy your sweet cravings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="btn-primary">
              Shop Now
            </Link>
            <Link href="/products" className="btn-outline">
              View Products
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const currentHero = heroSlides[currentSlide]

  return (
    <section className="relative min-h-[85vh] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {currentHero.media_type === 'video' ? (
          <video
            src={currentHero.media_url}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <Image
            src={currentHero.media_url}
            alt={currentHero.title || 'Hero'}
            fill
            priority
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-dark/80 via-dark/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full min-h-[85vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            {currentHero.title && (
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 neon-text">
                {currentHero.title}
              </h1>
            )}
            {currentHero.subtitle && (
              <p className="text-xl text-gray-300 mb-8">
                {currentHero.subtitle}
              </p>
            )}
            {currentHero.link_url && currentHero.link_text && (
              <Link href={currentHero.link_url} className="btn-primary">
                {currentHero.link_text}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      {heroSlides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide ? 'bg-primary w-8' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
