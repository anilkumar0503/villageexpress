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
    const messageId = formData.get('messageId') as string

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    if (!messageId) {
      return NextResponse.json({ success: false, error: 'Message ID required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Only images and PDF are allowed.' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const ext = file.type.split('/')[1]
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'support')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    const publicUrl = `/uploads/support/${filename}`

    // Create attachment record
    const { prisma } = await import('@ve/db')
    const attachment = await prisma.supportAttachment.create({
      data: {
        messageId,
        fileName: file.name,
        fileUrl: publicUrl,
        fileSize: file.size,
        mimeType: file.type,
      },
    })

    return NextResponse.json({ success: true, data: attachment })
  } catch (err) {
    console.error('[SUPPORT_ATTACHMENTS/POST]', err)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
