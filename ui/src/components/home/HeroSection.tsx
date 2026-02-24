'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { settingsAPI } from '@/lib/api'
import { HeroSection as HeroSectionType } from '@/types'

export default function HeroSection() {
  const [heroSlides, setHeroSlides] = useState<HeroSectionType[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const data = await settingsAPI.getHero()
        setHeroSlides(data as HeroSectionType[])
      } catch (error) {
        // Use default hero
        setHeroSlides([])
      }
    }
    fetchHero()
  }, [])

  useEffect(() => {
    if (heroSlides.length <= 1) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [heroSlides.length])

  // Default hero if no slides
  if (heroSlides.length === 0) {
    return (
      <section className="relative h-[90vh] bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f1f1a] to-[#0a0a0a]"></div>
        
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        
        <div className="relative text-center px-4 z-10">
          <p className="text-primary-400 text-lg mb-4 tracking-[0.3em] uppercase">Natural Sweetness</p>
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-2 tracking-tight">
            DIET<span className="text-primary-500 neon-text">LEAVES</span>
          </h1>
          <h2 className="text-2xl md:text-3xl text-gray-400 mb-8 font-light">
            Zero Calories. Zero Sugar. <span className="text-primary-400">100% Natural.</span>
          </h2>
          <p className="text-gray-500 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Experience the pure taste of premium stevia-based sweeteners. 
            Perfect for a healthier lifestyle without compromising on taste.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="btn-primary inline-flex items-center justify-center gap-2 rounded-lg neon-border">
              Shop Now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link href="/products" className="btn-secondary inline-flex items-center justify-center gap-2 rounded-lg">
              View Products
            </Link>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-gray-600">
          <span className="text-xs tracking-widest mb-2">SCROLL</span>
          <div className="w-px h-12 bg-gradient-to-b from-primary-500 to-transparent"></div>
        </div>
      </section>
    )
  }

  const currentHero = heroSlides[currentSlide]

  return (
    <section className="relative h-[80vh] overflow-hidden">
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
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center justify-center text-center px-4">
        <div>
          {currentHero.title && (
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
              {currentHero.title}
            </h1>
          )}
          {currentHero.subtitle && (
            <h2 className="text-2xl md:text-4xl text-primary-400 mb-8">
              {currentHero.subtitle}
            </h2>
          )}
          {currentHero.link_url && currentHero.link_text && (
            <Link href={currentHero.link_url} className="btn-primary">
              {currentHero.link_text}
            </Link>
          )}
        </div>
      </div>

      {/* Slide Indicators */}
      {heroSlides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
