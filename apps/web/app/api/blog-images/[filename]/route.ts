import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/permissions'
import { deleteFile } from '@/lib/storage'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { error } = await requireAuth(req)
  if (error) return error

  try {
    const { filename } = await params

    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ success: false, error: 'Invalid filename' }, { status: 400 })
    }

    await deleteFile(`blog/${filename}`, 'public')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[BLOG-IMAGES/DELETE]', err)
    return NextResponse.json({ success: false, error: 'Failed to delete image' }, { status: 500 })
  }
}
