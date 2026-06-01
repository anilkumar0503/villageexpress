import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { requireAuth } from '@/lib/auth/permissions'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { error } = await requireAuth(req)
  if (error) return error

  try {
    const { filename } = await params
    
    // Validate filename to prevent path traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ success: false, error: 'Invalid filename' }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', 'blog', filename)

    if (!existsSync(filePath)) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 })
    }

    await unlink(filePath)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[BLOG-IMAGES/DELETE]', err)
    return NextResponse.json({ success: false, error: 'Failed to delete image' }, { status: 500 })
  }
}
