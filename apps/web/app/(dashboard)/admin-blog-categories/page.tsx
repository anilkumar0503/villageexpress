'use client'

import { useEffect, useState } from 'react'
import { Loader2, Folder, Plus, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

type BlogCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  _count: {
    blogs: number
  }
}

export default function BlogCategoriesPage() {
  const { accessToken } = useAuth()
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | null>(null)
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/api/blog-categories?admin=true', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r: Response) => r.json())
      .then((d) => { if (d.success) setCategories(d.data) })
      .finally(() => setLoading(false))
  }, [accessToken])

  function openCreateDialog() {
    setIsCreating(true)
    setFormData({
      name: '',
      slug: '',
      description: '',
      isActive: true,
    })
  }

  function openEditDialog(category: BlogCategory) {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      isActive: category.isActive,
    })
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  async function saveCategory() {
    setSaving(true)
    try {
      const url = isCreating ? '/api/blog-categories' : `/api/blog-categories/${editingCategory?.id}`
      const method = isCreating ? 'POST' : 'PUT'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success(isCreating ? 'Category created successfully' : 'Category updated successfully')
        setIsCreating(false)
        setEditingCategory(null)
        // Refresh list
        const listRes = await fetch('/api/blog-categories?admin=true', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const listData = await listRes.json()
        if (listData.success) {
          setCategories(listData.data)
        }
      } else {
        toast.error(data.error || 'Failed to save category')
      }
    } catch (err) {
      toast.error('Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCategory(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/blog-categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('Category deleted successfully')
        setSelectedCategory(null)
        // Refresh list
        const listRes = await fetch('/api/blog-categories?admin=true', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const listData = await listRes.json()
        if (listData.success) {
          setCategories(listData.data)
        }
      } else {
        toast.error(data.error || 'Failed to delete category')
      }
    } catch (err) {
      toast.error('Failed to delete category')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">{categories.length} total categor{categories.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card>
        {loading ? (
          <CardContent className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        ) : categories.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Folder className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No categories found</p>
          </CardContent>
        ) : (
          <div className="divide-y">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{category.name}</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{category.slug}</code>
                    {category.isActive ? (
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
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{category._count.blogs} blog{category._count.blogs !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(category)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* View/Delete Dialog */}
      <Dialog open={!!selectedCategory} onOpenChange={(open) => !open && setSelectedCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <div className="space-y-4">
              <p>Are you sure you want to delete <strong>{selectedCategory.name}</strong>?</p>
              {selectedCategory._count.blogs > 0 && (
                <p className="text-sm text-destructive">This category is used by {selectedCategory._count.blogs} blog{selectedCategory._count.blogs !== 1 ? 's' : ''}.</p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => deleteCategory(selectedCategory.id)} disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || !!editingCategory} onOpenChange={(open) => { if (!open) { setIsCreating(false); setEditingCategory(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Add Category' : 'Edit Category'}</DialogTitle>
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
                placeholder="category-slug"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Category description"
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
            <Button variant="outline" onClick={() => { setIsCreating(false); setEditingCategory(null); }}>
              Cancel
            </Button>
            <Button onClick={saveCategory} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isCreating ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
