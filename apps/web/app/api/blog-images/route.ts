import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/permissions'
import { uploadFile, listFiles, type AllowedMimeType } from '@/lib/storage'

const ALLOWED_TYPES: AllowedMimeType[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type as AllowedMimeType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 },
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5MB.' },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { publicUrl, fileKey } = await uploadFile('blog', file.type as AllowedMimeType, buffer, 'public')
    const filename = fileKey.split('/').pop()!

    return NextResponse.json({ success: true, data: { url: publicUrl, filename } })
  } catch (err) {
    console.error('[BLOG-IMAGES/POST]', err)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  try {
    const files = await listFiles('blog', 'public')
    const images = files
      .filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.fileKey))
      .map((f) => ({
        url: f.publicUrl,
        filename: f.fileKey.split('/').pop()!,
        createdAt: f.createdAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    return NextResponse.json({ success: true, data: images })
  } catch (err) {
    console.error('[BLOG-IMAGES/GET]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch images' }, { status: 500 })
  }
}
