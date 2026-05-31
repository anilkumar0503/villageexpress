'use client'

import { useEffect, useState } from 'react'
import { Loader2, Tag, Plus, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

type BlogTag = {
  id: string
  name: string
  slug: string
  isActive: boolean
  _count: {
    blogs: number
  }
}

export default function BlogTagsPage() {
  const { accessToken } = useAuth()
  const [tags, setTags] = useState<BlogTag[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState<BlogTag | null>(null)
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    isActive: true,
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/api/blog-tags?admin=true', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setTags(d.data) })
      .finally(() => setLoading(false))
  }, [accessToken])

  function openCreateDialog() {
    setIsCreating(true)
    setFormData({
      name: '',
      slug: '',
      isActive: true,
    })
  }

  function openEditDialog(tag: BlogTag) {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      slug: tag.slug,
      isActive: tag.isActive,
    })
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  async function saveTag() {
    setSaving(true)
    try {
      const url = isCreating ? '/api/blog-tags' : `/api/blog-tags/${editingTag?.id}`
      const method = isCreating ? 'POST' : 'PUT'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success(isCreating ? 'Tag created successfully' : 'Tag updated successfully')
        setIsCreating(false)
        setEditingTag(null)
        // Refresh list
        const listRes = await fetch('/api/blog-tags?admin=true', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const listData = await listRes.json()
        if (listData.success) {
          setTags(listData.data)
        }
      } else {
        toast.error(data.error || 'Failed to save tag')
      }
    } catch (err) {
      toast.error('Failed to save tag')
    } finally {
      setSaving(false)
    }
  }

  async function deleteTag(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/blog-tags/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('Tag deleted successfully')
        setSelectedTag(null)
        // Refresh list
        const listRes = await fetch('/api/blog-tags?admin=true', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const listData = await listRes.json()
        if (listData.success) {
          setTags(listData.data)
        }
      } else {
        toast.error(data.error || 'Failed to delete tag')
      }
    } catch (err) {
      toast.error('Failed to delete tag')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog Tags</h1>
          <p className="text-sm text-muted-foreground mt-1">{tags.length} total tag{tags.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </div>

      <Card>
        {loading ? (
          <CardContent className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        ) : tags.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Tag className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No tags found</p>
          </CardContent>
        ) : (
          <div className="divide-y">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{tag.name}</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{tag.slug}</code>
                    {tag.isActive ? (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{tag._count.blogs} blog{tag._count.blogs !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(tag)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTag(tag)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* View/Delete Dialog */}
      <Dialog open={!!selectedTag} onOpenChange={(open) => !open && setSelectedTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
          </DialogHeader>
          {selectedTag && (
            <div className="space-y-4">
              <p>Are you sure you want to delete <strong>{selectedTag.name}</strong>?</p>
              {selectedTag._count.blogs > 0 && (
                <p className="text-sm text-destructive">This tag is used by {selectedTag._count.blogs} blog{selectedTag._count.blogs !== 1 ? 's' : ''}.</p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedTag(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => deleteTag(selectedTag.id)} disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || !!editingTag} onOpenChange={(open) => { if (!open) { setIsCreating(false); setEditingTag(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Add Tag' : 'Edit Tag'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
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
                placeholder="tag-slug"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreating(false); setEditingTag(null); }}>
              Cancel
            </Button>
            <Button onClick={saveTag} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isCreating ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
