'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, User, ArrowLeft, ChevronRight, BookOpen, Share2 } from 'lucide-react'

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
  created_at: string
  updated_at: string
}

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API}/api/blog/${slug}`)
        if (res.ok) {
          setPost(await res.json())
        }

        // Also fetch other posts for "More Articles"
        const listRes = await fetch(`${API}/api/blog?limit=4`)
        if (listRes.ok) {
          const all = await listRes.json()
          setRelatedPosts(all.filter((p: BlogPost) => p.slug !== slug).slice(0, 3))
        }
      } catch (e) {
        console.error('Failed to fetch blog post:', e)
      } finally {
        setLoading(false)
      }
    }
    if (slug) fetchPost()
  }, [slug])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: post?.title, url: window.location.href })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark py-12">
        <div className="max-w-4xl mx-auto px-4 animate-pulse">
          <div className="h-6 bg-dark-100 rounded w-1/4 mb-8" />
          <div className="h-72 bg-dark-100 rounded-2xl mb-8" />
          <div className="h-10 bg-dark-100 rounded w-3/4 mb-4" />
          <div className="h-4 bg-dark-100 rounded w-1/3 mb-8" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-4 bg-dark-100 rounded" style={{ width: `${90 - i * 5}%` }} />)}
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-dark py-12 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl text-white mb-4">Post not found</h1>
          <Link href="/blog" className="text-emerald-400 hover:underline">Back to blog</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero Image */}
      {post.hero_image_url && (
        <div className="relative w-full h-[300px] md:h-[420px] overflow-hidden">
          <Image
            src={post.hero_image_url}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-transparent" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav className={`flex items-center gap-2 text-sm text-gray-500 ${post.hero_image_url ? '-mt-16 relative z-10' : 'pt-8'} mb-6`}>
          <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/blog" className="hover:text-emerald-400 transition-colors">Blog</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-400 truncate max-w-[200px]">{post.title}</span>
        </nav>

        {/* Article Header */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
            {post.title}
          </h1>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-emerald-500/60" />
                {formatDate(post.created_at)}
              </span>
              {post.author && (
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-emerald-500/60" />
                  {post.author}
                </span>
              )}
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-400 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>

          {/* Divider */}
          <div className="mt-6 h-px bg-gradient-to-r from-emerald-500/20 via-dark-200/40 to-transparent" />
        </header>

        {/* Article Content */}
        <article
          className="prose prose-invert prose-lg max-w-none mb-16
            prose-headings:text-white prose-headings:font-bold
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-gray-400 prose-p:leading-relaxed prose-p:mb-5
            prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-ul:text-gray-400 prose-ol:text-gray-400
            prose-li:mb-1.5
            prose-img:rounded-2xl prose-img:border prose-img:border-dark-200/40
            prose-blockquote:border-l-emerald-500 prose-blockquote:text-gray-400 prose-blockquote:bg-dark-100/30 prose-blockquote:rounded-r-xl prose-blockquote:py-2 prose-blockquote:px-4"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Back to Blog */}
        <div className="pb-8 border-t border-dark-200/40 pt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all articles
          </Link>
        </div>
      </div>

      {/* More Articles */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-dark-200/40 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-white mb-8">More Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rp) => (
                <Link key={rp.id} href={`/blog/${rp.slug}`} className="group block">
                  <article className="bg-[#111] border border-dark-200/40 rounded-2xl overflow-hidden hover:border-emerald-500/20 transition-all duration-300">
                    <div className="relative h-40 overflow-hidden">
                      {rp.hero_image_url ? (
                        <Image src={rp.hero_image_url} alt={rp.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-950/30 to-dark-100 flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-emerald-500/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-500 mb-1.5">{formatDate(rp.created_at)}</p>
                      <h3 className="text-white font-semibold group-hover:text-emerald-400 transition-colors line-clamp-2">{rp.title}</h3>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
