import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { requireAuth } from '@/lib/auth/permissions'

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const ext = file.type.split('/')[1]
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'blog')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    const publicUrl = `/uploads/blog/${filename}`

    return NextResponse.json({ success: true, data: { url: publicUrl, filename } })
  } catch (err) {
    console.error('[BLOG-IMAGES]', err)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'blog')
    
    if (!existsSync(uploadDir)) {
      return NextResponse.json({ success: true, data: [] })
    }

    const fs = await import('fs/promises')
    const files = await fs.readdir(uploadDir)
    
    const images = files
      .filter((f: string) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
      .map((f: string) => ({
        url: `/uploads/blog/${f}`,
        filename: f,
        createdAt: f.split('-')[0] || '0'
      }))
      .sort((a, b) => parseInt(b.createdAt) - parseInt(a.createdAt))

    return NextResponse.json({ success: true, data: images })
  } catch (err) {
    console.error('[BLOG-IMAGES]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch images' }, { status: 500 })
  }
}
