'use client'

import { useEffect, useState } from 'react'
import { Loader2, FileText, CheckCircle2, XCircle, Eye, Edit, Trash2, Plus, Calendar, User, Image as ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { RichTextEditor } from '@/components/rich-text-editor'
import { BlogImageLibrary } from '@/components/blog-image-library'

type Blog = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverImage: string | null
  author: string | null
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  // SEO fields
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
  ogImage: string | null
  canonicalUrl: string | null
  // Relations
  categories: { id: string; category: { id: string; name: string; slug: string } }[]
  tags: { id: string; tag: { id: string; name: string; slug: string } }[]
}

type Category = {
  id: string
  name: string
  slug: string
}

type Tag = {
  id: string
  name: string
  slug: string
}

export default function BlogsPage() {
  const { accessToken } = useAuth()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    author: '',
    isPublished: false,
    // SEO fields
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    ogImage: '',
    canonicalUrl: '',
    // Categories and tags
    categoryIds: [] as string[],
    tagIds: [] as string[],
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [imageLibraryOpen, setImageLibraryOpen] = useState(false)
  const [imageLibraryMode, setImageLibraryMode] = useState<'insert' | 'cover'>('insert')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page), admin: 'true' })
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PUBLISHED') params.set('isPublished', 'true')
      if (statusFilter === 'DRAFT') params.set('isPublished', 'false')
    }

    fetch(`/api/blogs?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r: Response) => r.json())
      .then((d) => { if (d.success) { setBlogs(d.data.items); setTotal(d.data.total) } })
      .finally(() => setLoading(false))
  }, [statusFilter, page, accessToken])

  useEffect(() => {
    // Fetch categories and tags
    Promise.all([
      fetch('/api/blog-categories?admin=true', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(r => r.json()),
      fetch('/api/blog-tags?admin=true', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(r => r.json()),
    ]).then(([catsData, tagsData]) => {
      if (catsData.success) setCategories(catsData.data)
      if (tagsData.success) setTags(tagsData.data)
    })
  }, [accessToken])

  function openCreateDialog() {
    setIsCreating(true)
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImage: '',
      author: '',
      isPublished: false,
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      ogImage: '',
      canonicalUrl: '',
      categoryIds: [],
      tagIds: [],
    })
  }

  function openEditDialog(blog: Blog) {
    setEditingBlog(blog)
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || '',
      content: blog.content,
      coverImage: blog.coverImage || '',
      author: blog.author || '',
      isPublished: blog.isPublished,
      metaTitle: blog.metaTitle || '',
      metaDescription: blog.metaDescription || '',
      metaKeywords: blog.metaKeywords || '',
      ogImage: blog.ogImage || '',
      canonicalUrl: blog.canonicalUrl || '',
      categoryIds: blog.categories.map(c => c.category.id),
      tagIds: blog.tags.map(t => t.tag.id),
    })
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  async function saveBlog() {
    setSaving(true)
    try {
      const url = isCreating ? '/api/blogs' : `/api/blogs/${editingBlog?.id}`
      const method = isCreating ? 'POST' : 'PUT'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success(isCreating ? 'Blog created successfully' : 'Blog updated successfully')
        setIsCreating(false)
        setEditingBlog(null)
        // Refresh list
        const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page), admin: 'true' })
        const listRes = await fetch(`/api/blogs?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const listData = await listRes.json()
        if (listData.success) {
          setBlogs(listData.data.items)
          setTotal(listData.data.total)
        }
      } else {
        toast.error(data.error || 'Failed to save blog')
      }
    } catch (err) {
      toast.error('Failed to save blog')
    } finally {
      setSaving(false)
    }
  }

  async function deleteBlog(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/blogs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Blog deleted successfully')
        setSelectedBlog(null)
        // Refresh list
        const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page), admin: 'true' })
        const listRes = await fetch(`/api/blogs?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const listData = await listRes.json()
        if (listData.success) {
          setBlogs(listData.data.items)
          setTotal(listData.data.total)
        }
      } else {
        toast.error(data.error || 'Failed to delete blog')
      }
    } catch (err) {
      toast.error('Failed to delete blog')
    } finally {
      setDeleting(false)
    }
  }

  function handleInsertImage(url: string) {
    // Insert image into rich text editor at cursor position
    setFormData({ ...formData, content: formData.content + `<img src="${url}" alt="" />` })
    setImageLibraryOpen(false)
  }

  function handleSelectImage(url: string) {
    if (imageLibraryMode === 'cover') {
      setFormData({ ...formData, coverImage: url })
    } else {
      setFormData({ ...formData, content: formData.content + `<img src="${url}" alt="" />` })
    }
    setImageLibraryOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blogs</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total blog{total !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Blog
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        {loading ? (
          <CardContent className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        ) : blogs.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No blogs found</p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogs.map((blog) => (
                <TableRow key={blog.id}>
                  <TableCell>
                    <p className="font-medium">{blog.title}</p>
                    {blog.excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{blog.excerpt}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{blog.slug}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{blog.author || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {blog.isPublished ? (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        Draft
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('en-IN') : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedBlog(blog)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(blog)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedBlog(blog)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} blogs
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))}
              disabled={page === Math.ceil(total / pageSize)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!selectedBlog} onOpenChange={(open) => !open && setSelectedBlog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Blog Details</DialogTitle>
          </DialogHeader>
          {selectedBlog && (
            <div className="space-y-4">
              {selectedBlog.coverImage && (
                <div className="rounded-lg overflow-hidden">
                  <img src={selectedBlog.coverImage} alt={selectedBlog.title} className="w-full object-cover" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{selectedBlog.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Slug</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{selectedBlog.slug}</code>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Author</p>
                  <p className="text-sm">{selectedBlog.author || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {selectedBlog.isPublished ? (
                    <Badge className="bg-green-600">Published</Badge>
                  ) : (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                </div>
              </div>
              {selectedBlog.excerpt && (
                <div>
                  <p className="text-sm text-muted-foreground">Excerpt</p>
                  <p className="text-sm mt-1">{selectedBlog.excerpt}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Content</p>
                <div className="text-sm mt-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedBlog.content }} />
              </div>
              <div className="border-t pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm">{new Date(selectedBlog.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="text-sm">{selectedBlog.publishedAt ? new Date(selectedBlog.publishedAt).toLocaleString('en-IN') : '—'}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="destructive" onClick={() => deleteBlog(selectedBlog.id)} disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || !!editingBlog} onOpenChange={(open) => { if (!open) { setIsCreating(false); setEditingBlog(null); } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Add Blog' : 'Edit Blog'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value })
                  if (isCreating && !formData.slug) {
                    setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="blog-post-slug"
              />
            </div>
            <div>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Input
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Short summary of the blog post"
              />
            </div>
            <div>
              <Label htmlFor="coverImage">Cover Image</Label>
              <div className="flex gap-2">
                <Input
                  id="coverImage"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setImageLibraryMode('cover'); setImageLibraryOpen(true) }}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Library
                </Button>
              </div>
              {formData.coverImage && (
                <div className="mt-2">
                  <img src={formData.coverImage} alt="Cover preview" className="h-32 w-auto rounded border" />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="content">Content *</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setImageLibraryMode('insert'); setImageLibraryOpen(true) }}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Insert Image
                </Button>
              </div>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                onInsertImage={() => { setImageLibraryMode('insert'); setImageLibraryOpen(true) }}
              />
            </div>
            
            {/* SEO Section */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">SEO Settings</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    placeholder="SEO title (optional, defaults to blog title)"
                  />
                </div>
                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="SEO description for search engines"
                  />
                </div>
                <div>
                  <Label htmlFor="metaKeywords">Meta Keywords</Label>
                  <Input
                    id="metaKeywords"
                    value={formData.metaKeywords}
                    onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                    placeholder="Comma-separated keywords"
                  />
                </div>
                <div>
                  <Label htmlFor="ogImage">OG Image URL</Label>
                  <Input
                    id="ogImage"
                    value={formData.ogImage}
                    onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                    placeholder="https://example.com/og-image.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="canonicalUrl">Canonical URL</Label>
                  <Input
                    id="canonicalUrl"
                    value={formData.canonicalUrl}
                    onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                    placeholder="https://example.com/blog/post"
                  />
                </div>
              </div>
            </div>

            {/* Categories and Tags */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Categories & Tags</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="categories">Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.categoryIds.includes(cat.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, categoryIds: [...formData.categoryIds, cat.id] })
                            } else {
                              setFormData({ ...formData, categoryIds: formData.categoryIds.filter(id => id !== cat.id) })
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                  {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories available. Create some first.</p>}
                </div>
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.tagIds.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, tagIds: [...formData.tagIds, tag.id] })
                            } else {
                              setFormData({ ...formData, tagIds: formData.tagIds.filter(id => id !== tag.id) })
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                  {tags.length === 0 && <p className="text-sm text-muted-foreground">No tags available. Create some first.</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isPublished">Publish immediately</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreating(false); setEditingBlog(null); }}>
              Cancel
            </Button>
            <Button onClick={saveBlog} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isCreating ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Library Dialog */}
      <BlogImageLibrary
        open={imageLibraryOpen}
        onOpenChange={setImageLibraryOpen}
        onSelectImage={handleSelectImage}
        mode={imageLibraryMode}
      />
    </div>
  )
}
