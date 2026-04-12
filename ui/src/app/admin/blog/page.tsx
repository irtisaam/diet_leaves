'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Plus, Edit, Trash2, Eye, Pin, PinOff,
  ChevronUp, ChevronDown, Save, X, Upload, Bold, Italic,
  Heading1, Heading2, List, AlignLeft, ImageIcon, Globe,
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface BlogPost {
  id: string
  title: string
  slug: string
  short_description: string | null
  content: string
  hero_image_url: string | null
  author: string | null
  is_published: boolean
  is_pinned: boolean
  display_order: number
  created_at: string
  updated_at: string
}

type EditorMode = 'list' | 'create' | 'edit'

const EMPTY_FORM = {
  title: '',
  slug: '',
  short_description: '',
  content: '',
  hero_image_url: '',
  author: 'Diet Leaves',
  is_published: false,
  is_pinned: false,
  display_order: 0,
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<EditorMode>('list')
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchPosts() }, [])

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API}/api/admin/blog`)
      if (res.ok) {
        setPosts(await res.json())
      }
    } catch (e) {
      console.error('Failed to fetch blog posts:', e)
    } finally {
      setLoading(false)
    }
  }

  // Rich text toolbar commands
  const execCmd = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    contentRef.current?.focus()
  }

  const insertHeading = (level: 'h2' | 'h3') => {
    document.execCommand('formatBlock', false, level)
    contentRef.current?.focus()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'blog')
      const res = await fetch(`${API}/api/admin/upload/image`, { method: 'POST', body: fd })
      if (res.ok) {
        const data = await res.json()
        setForm(f => ({ ...f, hero_image_url: data.url }))
      }
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleContentImageUpload = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'blog')
      try {
        const res = await fetch(`${API}/api/admin/upload/image`, { method: 'POST', body: fd })
        if (res.ok) {
          const data = await res.json()
          document.execCommand('insertImage', false, data.url)
        }
      } catch (err) {
        console.error(err)
      }
    }
    input.click()
  }

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, display_order: posts.length + 1 })
    setEditId(null)
    setMode('create')
    setTimeout(() => {
      if (contentRef.current) contentRef.current.innerHTML = ''
    }, 50)
  }

  const openEdit = (post: BlogPost) => {
    setForm({
      title: post.title,
      slug: post.slug,
      short_description: post.short_description || '',
      content: post.content,
      hero_image_url: post.hero_image_url || '',
      author: post.author || 'Diet Leaves',
      is_published: post.is_published,
      is_pinned: post.is_pinned,
      display_order: post.display_order,
    })
    setEditId(post.id)
    setMode('edit')
    setTimeout(() => {
      if (contentRef.current) contentRef.current.innerHTML = post.content
    }, 50)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !contentRef.current?.innerHTML.trim()) {
      alert('Title and content are required')
      return
    }
    setSaving(true)
    try {
      const body = {
        ...form,
        content: contentRef.current.innerHTML,
        hero_image_url: form.hero_image_url || null,
        short_description: form.short_description || null,
      }

      const url = editId ? `${API}/api/admin/blog/${editId}` : `${API}/api/admin/blog`
      const method = editId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        await fetchPosts()
        setMode('list')
      } else {
        const err = await res.json().catch(() => ({ detail: 'Error' }))
        alert(err.detail || 'Failed to save')
      }
    } catch (err) {
      alert('Failed to save blog post')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post permanently?')) return
    try {
      const res = await fetch(`${API}/api/admin/blog/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== id))
      } else {
        alert('Failed to delete')
      }
    } catch (e) {
      alert('Failed to delete')
    }
  }

  const togglePin = async (post: BlogPost) => {
    try {
      await fetch(`${API}/api/admin/blog/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !post.is_pinned }),
      })
      fetchPosts()
    } catch (e) { console.error(e) }
  }

  const togglePublish = async (post: BlogPost) => {
    try {
      await fetch(`${API}/api/admin/blog/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !post.is_published }),
      })
      fetchPosts()
    } catch (e) { console.error(e) }
  }

  const moveOrder = async (post: BlogPost, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? post.display_order - 1 : post.display_order + 1
    try {
      await fetch(`${API}/api/admin/blog/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: Math.max(0, newOrder) }),
      })
      fetchPosts()
    } catch (e) { console.error(e) }
  }

  // ===================== LIST VIEW =====================
  if (mode === 'list') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="p-2 rounded-lg bg-dark-100 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Blog Posts</h1>
                <p className="text-sm text-gray-500">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Post
            </button>
          </div>

          {/* Posts Table */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-dark-100 rounded-xl animate-pulse" />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-dark-100/50 rounded-2xl border border-dark-200/40">
              <p className="text-gray-500 mb-4">No blog posts yet</p>
              <button onClick={openCreate} className="text-emerald-400 hover:text-emerald-300 font-medium">
                Create your first post
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 p-4 bg-[#111] border border-dark-200/40 rounded-xl hover:border-dark-200/60 transition-colors"
                >
                  {/* Hero Thumbnail */}
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-dark-100">
                    {post.hero_image_url ? (
                      <Image src={post.hero_image_url} alt="" width={64} height={64} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium truncate">{post.title}</h3>
                      {post.is_pinned && (
                        <span className="shrink-0 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-medium">PINNED</span>
                      )}
                      <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${post.is_published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {post.is_published ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {post.short_description || 'No description'}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {new Date(post.created_at).toLocaleDateString()} · Order: {post.display_order}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => moveOrder(post, 'up')} className="p-1.5 rounded-lg hover:bg-dark-200 text-gray-500 hover:text-white transition-colors" title="Move up">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button onClick={() => moveOrder(post, 'down')} className="p-1.5 rounded-lg hover:bg-dark-200 text-gray-500 hover:text-white transition-colors" title="Move down">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button onClick={() => togglePin(post)} className={`p-1.5 rounded-lg hover:bg-dark-200 transition-colors ${post.is_pinned ? 'text-amber-400' : 'text-gray-500 hover:text-white'}`} title={post.is_pinned ? 'Unpin' : 'Pin'}>
                      {post.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </button>
                    <button onClick={() => togglePublish(post)} className={`p-1.5 rounded-lg hover:bg-dark-200 transition-colors ${post.is_published ? 'text-emerald-400' : 'text-gray-500 hover:text-white'}`} title={post.is_published ? 'Unpublish' : 'Publish'}>
                      <Globe className="h-4 w-4" />
                    </button>
                    <button onClick={() => openEdit(post)} className="p-1.5 rounded-lg hover:bg-dark-200 text-gray-500 hover:text-blue-400 transition-colors" title="Edit">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(post.id)} className="p-1.5 rounded-lg hover:bg-dark-200 text-gray-500 hover:text-red-400 transition-colors" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ===================== CREATE / EDIT VIEW =====================
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('list')} className="p-2 rounded-lg bg-dark-100 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-white">
              {mode === 'create' ? 'New Blog Post' : 'Edit Blog Post'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('list')} className="px-4 py-2 rounded-xl border border-dark-200 text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Post'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Title */}
            <input
              type="text"
              placeholder="Blog Post Title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 bg-[#111] border border-dark-200/60 rounded-xl text-white text-xl font-semibold placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />

            {/* Short Description */}
            <textarea
              placeholder="Short description (shown on blog cards)..."
              value={form.short_description}
              onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))}
              rows={2}
              className="w-full px-4 py-3 bg-[#111] border border-dark-200/60 rounded-xl text-gray-300 text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
            />

            {/* Rich Text Toolbar */}
            <div className="flex items-center gap-1 p-2 bg-[#111] border border-dark-200/60 rounded-t-xl border-b-0 flex-wrap">
              <button onClick={() => execCmd('bold')} className="p-2 rounded-lg hover:bg-dark-200 text-gray-400 hover:text-white transition-colors" title="Bold">
                <Bold className="h-4 w-4" />
              </button>
              <button onClick={() => execCmd('italic')} className="p-2 rounded-lg hover:bg-dark-200 text-gray-400 hover:text-white transition-colors" title="Italic">
                <Italic className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-dark-200 mx-1" />
              <button onClick={() => insertHeading('h2')} className="p-2 rounded-lg hover:bg-dark-200 text-gray-400 hover:text-white transition-colors" title="Heading">
                <Heading1 className="h-4 w-4" />
              </button>
              <button onClick={() => insertHeading('h3')} className="p-2 rounded-lg hover:bg-dark-200 text-gray-400 hover:text-white transition-colors" title="Subheading">
                <Heading2 className="h-4 w-4" />
              </button>
              <button onClick={() => execCmd('formatBlock', 'p')} className="p-2 rounded-lg hover:bg-dark-200 text-gray-400 hover:text-white transition-colors" title="Paragraph">
                <AlignLeft className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-dark-200 mx-1" />
              <button onClick={() => execCmd('insertUnorderedList')} className="p-2 rounded-lg hover:bg-dark-200 text-gray-400 hover:text-white transition-colors" title="Bullet List">
                <List className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-dark-200 mx-1" />
              <button onClick={handleContentImageUpload} className="p-2 rounded-lg hover:bg-dark-200 text-gray-400 hover:text-white transition-colors" title="Insert Image">
                <ImageIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Content editable area */}
            <div
              ref={contentRef}
              contentEditable
              className="w-full min-h-[400px] px-5 py-4 bg-[#111] border border-dark-200/60 rounded-b-xl text-gray-300 text-sm leading-relaxed focus:outline-none focus:border-emerald-500/50 transition-colors prose prose-invert prose-sm max-w-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_img]:rounded-xl [&_img]:my-4 [&_img]:max-w-full"
              suppressContentEditableWarning
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Hero Image */}
            <div className="bg-[#111] border border-dark-200/60 rounded-xl p-4 space-y-3">
              <label className="text-sm font-medium text-white">Hero Image</label>
              {form.hero_image_url ? (
                <div className="relative group">
                  <Image
                    src={form.hero_image_url}
                    alt="Hero"
                    width={400}
                    height={200}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setForm(f => ({ ...f, hero_image_url: '' }))}
                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-dark-200 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
                  <Upload className="h-6 w-6 text-gray-500 mb-2" />
                  <span className="text-xs text-gray-500">{uploading ? 'Uploading...' : 'Upload hero image'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>

            {/* Settings */}
            <div className="bg-[#111] border border-dark-200/60 rounded-xl p-4 space-y-4">
              <label className="text-sm font-medium text-white">Settings</label>
              
              {/* Slug */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">URL Slug (auto-generated if empty)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="my-blog-post"
                  className="w-full px-3 py-2 bg-dark-100 border border-dark-200/40 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Author */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Author</label>
                <input
                  type="text"
                  value={form.author}
                  onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                  className="w-full px-3 py-2 bg-dark-100 border border-dark-200/40 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Display Order</label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-dark-100 border border-dark-200/40 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-400">Published</span>
                  <button
                    onClick={() => setForm(f => ({ ...f, is_published: !f.is_published }))}
                    className={`w-10 h-5 rounded-full transition-colors ${form.is_published ? 'bg-emerald-500' : 'bg-dark-200'}`}
                  >
                    <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_published ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-400">Pinned</span>
                  <button
                    onClick={() => setForm(f => ({ ...f, is_pinned: !f.is_pinned }))}
                    className={`w-10 h-5 rounded-full transition-colors ${form.is_pinned ? 'bg-amber-500' : 'bg-dark-200'}`}
                  >
                    <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_pinned ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </label>
              </div>
            </div>

            {/* Preview Link */}
            {editId && (
              <Link
                href={`/blog/${form.slug}`}
                target="_blank"
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-dark-200/60 rounded-xl text-gray-400 hover:text-white hover:border-dark-200 transition-colors text-sm"
              >
                <Eye className="h-4 w-4" />
                Preview Post
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
