'use client'

import { useState, useEffect, memo } from 'react'
import Image from 'next/image'
import { ChevronDown, HelpCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface FAQ {
  id: string
  question: string
  answer: string
  image_url?: string | null
  display_order: number
}

// Memoised accordion item – only re-renders when its own open state changes
const FAQItem = memo(function FAQItem({ faq, index }: { faq: FAQ; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`bg-[#121212] border rounded-xl overflow-hidden transition-colors duration-200 ${
        open ? 'border-primary-500/50 shadow-[0_0_20px_rgba(16,185,129,0.07)]' : 'border-gray-800 hover:border-gray-700'
      }`}
    >
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4 group"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 w-7 h-7 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-400 text-xs font-bold select-none">
            {index + 1}
          </span>
          <span
            className={`font-medium text-base leading-snug transition-colors ${
              open ? 'text-primary-400' : 'text-white group-hover:text-primary-300'
            }`}
          >
            {faq.question}
          </span>
        </div>
        <ChevronDown
          className={`shrink-0 h-5 w-5 text-primary-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expand / collapse using grid trick — no JS height calculation needed */}
      <div className={`grid transition-[grid-template-rows] duration-200 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-6 pb-6 ml-10 pl-3 border-l-2 border-primary-500/30">
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{faq.answer}</p>
            {faq.image_url && (
              <div className="mt-4 relative w-full max-w-md aspect-video rounded-lg overflow-hidden">
                <Image
                  src={faq.image_url}
                  alt={faq.question}
                  fill
                  loading="lazy"
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 448px"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

function FAQSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-[72px] bg-[#121212] border border-gray-800 rounded-xl animate-pulse"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  )
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`${API}/api/settings/faqs`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => { if (!cancelled && Array.isArray(data)) setFaqs(data) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[280px] bg-primary-500/5 blur-[100px] rounded-full" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/10 mb-6">
            <HelpCircle className="h-8 w-8 text-primary-500" aria-hidden />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 neon-text">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Everything you need to know about our products and ordering process.
          </p>
        </div>
      </section>

      {/* FAQ content */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        {loading ? (
          <FAQSkeleton />
        ) : error || faqs.length === 0 ? (
          <div className="text-center py-16 bg-[#121212] rounded-xl border border-gray-800">
            <HelpCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {error ? 'Could not load FAQs — please try again later.' : 'No FAQs yet. Check back soon!'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-5">{faqs.length} question{faqs.length !== 1 ? 's' : ''}</p>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <FAQItem key={faq.id} faq={faq} index={i} />
              ))}
            </div>
          </>
        )}

        {/* Still have questions CTA */}
        {!loading && !error && faqs.length > 0 && (
          <div className="mt-12 p-8 bg-[#121212] border border-primary-500/20 rounded-2xl text-center">
            <h3 className="text-white font-semibold text-lg mb-2">Still have questions?</h3>
            <p className="text-gray-400 text-sm mb-5">
              Can&apos;t find the answer you&apos;re looking for? Our team is happy to help.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Contact Us
            </a>
          </div>
        )}
      </section>
    </div>
  )
}

