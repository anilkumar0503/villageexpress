'use client'

import { useRef, useState } from 'react'
import { Upload, X, FileText, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

type FileUploadProps = {
  folder: string
  accept?: string
  label?: string
  onUploadComplete: (url: string) => void
  className?: string
  currentUrl?: string
}

export function FileUpload({ folder, accept = 'image/jpeg,image/png,image/webp', label, onUploadComplete, className, currentUrl }: FileUploadProps) {
  const { accessToken } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [error, setError] = useState('')
  const [done, setDone] = useState(!!currentUrl)

  async function handleFile(file: File) {
    setError('')
    setUploading(true)

    try {
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ folder, mimeType: file.type }),
      })
      const presignData = await presignRes.json()
      if (!presignData.success) throw new Error(presignData.error)

      const { uploadUrl, publicUrl } = presignData.data

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (file.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(file))
      }
      setDone(true)
      onUploadComplete(publicUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const isImage = accept.includes('image')

  return (
    <div className={cn('space-y-2', className)}>
      {label && <p className="text-sm font-medium">{label}</p>}

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
          done ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-border hover:border-primary/50 hover:bg-muted/30',
          uploading && 'pointer-events-none opacity-70',
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </>
        ) : done && preview && isImage ? (
          <>
            <img src={preview} alt="Uploaded" className="h-24 w-24 rounded-lg object-cover" />
            <div className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Uploaded
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={(e) => { e.stopPropagation(); setPreview(null); setDone(false); onUploadComplete('') }}
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : done ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              <span className="text-sm font-medium">File uploaded</span>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={(e) => { e.stopPropagation(); setDone(false); onUploadComplete('') }}>
              Replace file
            </Button>
          </div>
        ) : (
          <>
            {isImage
              ? <ImageIcon className="h-8 w-8 text-muted-foreground" />
              : <FileText className="h-8 w-8 text-muted-foreground" />
            }
            <div>
              <p className="text-sm font-medium">Click or drag to upload</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {accept.includes('pdf') ? 'JPG, PNG or PDF' : 'JPG, PNG or WebP'} · Max 5 MB
              </p>
            </div>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
