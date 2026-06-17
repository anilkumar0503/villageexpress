import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/permissions'
import { uploadFile, type AllowedMimeType } from '@/lib/storage'

const ALLOWED_TYPES: AllowedMimeType[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

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

    if (!ALLOWED_TYPES.includes(file.type as AllowedMimeType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images and PDF are allowed.' },
        { status: 400 },
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 10MB.' },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Support attachments go to the private bucket (sensitive content)
    const { publicUrl } = await uploadFile('support', file.type as AllowedMimeType, buffer, 'private')

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
