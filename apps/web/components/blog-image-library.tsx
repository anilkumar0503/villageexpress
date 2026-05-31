'use client'

import { useEffect, useState } from 'react'
import { Loader2, Upload, Trash2, Image as ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

type BlogImage = {
  url: string
  filename: string
  createdAt: string
}

interface BlogImageLibraryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectImage: (url: string) => void
  mode?: 'insert' | 'cover'
}

export function BlogImageLibrary({ open, onOpenChange, onSelectImage, mode = 'insert' }: BlogImageLibraryProps) {
  const { accessToken } = useAuth()
  const [images, setImages] = useState<BlogImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function fetchImages() {
    setLoading(true)
    try {
      const res = await fetch('/api/blog-images', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      if (data.success) {
        setImages(data.data)
      }
    } catch (err) {
      toast.error('Failed to load images')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchImages()
    }
  }, [open, accessToken])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/blog-images', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Image uploaded successfully')
        fetchImages()
      } else {
        toast.error(data.error || 'Failed to upload image')
      }
    } catch (err) {
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(url: string) {
    setDeleting(url)
    try {
      const filename = url.split('/').pop()
      const res = await fetch(`/api/blog-images/${filename}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Image deleted successfully')
        fetchImages()
      } else {
        toast.error(data.error || 'Failed to delete image')
      }
    } catch (err) {
      toast.error('Failed to delete image')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Image Library</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Section */}
          <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-lg">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <Button type="button" disabled={uploading} asChild>
                <span>
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload Image
                </span>
              </Button>
            </label>
            <p className="text-sm text-muted-foreground">
              JPEG, PNG, WebP, GIF (max 5MB)
            </p>
          </div>

          {/* Images Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No images uploaded yet</p>
              <p className="text-sm text-muted-foreground">Upload images to use in your blog posts</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image.filename} className="relative group">
                  <div
                    className="aspect-square rounded-lg overflow-hidden border cursor-pointer hover:ring-2 hover:ring-primary"
                    onClick={() => onSelectImage(image.url)}
                  >
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(image.url)
                    }}
                    disabled={deleting === image.url}
                  >
                    {deleting === image.url ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
