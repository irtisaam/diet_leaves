'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, ArrowRight, Pin, User, BookOpen } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface BlogPost {
  id: string
  title: string
  slug: string
  short_description: string | null
  content: string
  hero_image_url: string | null
  author: string | null
  is_pinned: boolean
  display_order: number
  created_at: string
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API}/api/blog`)
        if (res.ok) {
          setPosts(await res.json())
        }
      } catch (e) {
        console.error('Failed to fetch blog posts:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const pinnedPosts = posts.filter(p => p.is_pinned)
  const regularPosts = posts.filter(p => !p.is_pinned)

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero Header */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-transparent to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
            <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">Our Blog</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Latest Articles
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Insights about health, nutrition, and organic living from Diet Leaves
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-dark-100/50 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-dark-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-dark-100 rounded w-1/3" />
                  <div className="h-6 bg-dark-100 rounded w-3/4" />
                  <div className="h-4 bg-dark-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <div className="text-center py-24">
            <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl text-white font-semibold mb-2">No articles yet</h2>
            <p className="text-gray-500">Check back soon for our latest insights on health and nutrition.</p>
          </div>
        )}

        {/* Pinned / Featured Post — Large Card */}
        {pinnedPosts.length > 0 && (
          <div className="mb-12 space-y-6">
            {pinnedPosts.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                <article className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-[#111] border border-dark-200/40 rounded-2xl overflow-hidden hover:border-emerald-500/20 transition-all duration-300">
                  <div className="relative h-60 lg:h-full min-h-[280px] overflow-hidden">
                    {post.hero_image_url ? (
                      <Image src={post.hero_image_url} alt={post.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-950/40 to-dark-100 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-emerald-500/30" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-amber-500/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                      <Pin className="h-3 w-3" /> Featured
                    </div>
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(post.created_at)}</span>
                      {post.author && <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.author}</span>}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">{post.title}</h2>
                    {post.short_description && (
                      <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3">{post.short_description}</p>
                    )}
                    <span className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium group-hover:gap-3 transition-all">
                      Read Article <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* Regular Posts Grid */}
        {regularPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                <article className="bg-[#111] border border-dark-200/40 rounded-2xl overflow-hidden hover:border-emerald-500/20 transition-all duration-300 h-full flex flex-col">
                  <div className="relative h-48 overflow-hidden">
                    {post.hero_image_url ? (
                      <Image src={post.hero_image_url} alt={post.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-950/30 to-dark-100 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-emerald-500/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-40" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(post.created_at)}</span>
                      {post.author && <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.author}</span>}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">{post.title}</h3>
                    {post.short_description && (
                      <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">{post.short_description}</p>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-medium mt-auto group-hover:gap-2.5 transition-all">
                      Read More <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
