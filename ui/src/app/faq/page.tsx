'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, HelpCircle, Loader2 } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface FAQ {
  id: string
  question: string
  answer: string
  display_order: number
  is_active: boolean
}

function FAQItem({ faq, index }: { faq: FAQ; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`bg-[#121212] border rounded-xl overflow-hidden transition-all duration-300 ${open ? 'border-primary-500/50 shadow-[0_0_20px_rgba(16,185,129,0.08)]' : 'border-gray-800 hover:border-gray-700'}`}
    >
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4 group"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 w-7 h-7 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-400 text-xs font-bold">
            {index + 1}
          </span>
          <span className={`font-medium text-base leading-snug transition-colors ${open ? 'text-primary-400' : 'text-white group-hover:text-primary-300'}`}>
            {faq.question}
          </span>
        </div>
        <ChevronDown
          className={`shrink-0 h-5 w-5 text-primary-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-6 pb-6">
          <div className="ml-10 pl-3 border-l-2 border-primary-500/30">
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{faq.answer}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FAQSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-[#121212] border border-gray-800 rounded-xl h-[72px] animate-pulse" />
      ))}
    </div>
  )
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [openAll, setOpenAll] = useState<boolean | null>(null)

  useEffect(() => {
    fetch(`${API}/api/settings/faqs`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFaqs(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-500/5 blur-[100px] rounded-full" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/10 mb-6">
            <HelpCircle className="h-8 w-8 text-primary-500" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 neon-text">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Everything you need to know about our products and ordering process.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        {loading ? (
          <FAQSkeleton />
        ) : faqs.length === 0 ? (
          <div className="text-center py-16 bg-[#121212] rounded-xl border border-gray-800">
            <HelpCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No FAQs yet.</p>
            <p className="text-gray-500 text-sm mt-2">Check back soon!</p>
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-gray-500 text-sm">{faqs.length} question{faqs.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <FAQItem key={faq.id} faq={faq} index={i} />
              ))}
            </div>
          </>
        )}

        {/* Still have questions CTA */}
        {!loading && faqs.length > 0 && (
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
