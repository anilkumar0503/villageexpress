import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/permissions'
import { getPresignedDownloadUrl, type UploadBucket } from '@/lib/storage'

/**
 * GET /api/upload/download?fileKey=<key>&bucket=<public|private>
 *
 * Resolves a stored fileKey or URL to a viewable link:
 *   - Full https:// URL  → redirect directly (public Linode or external)
 *   - /uploads/...       → redirect directly (local fallback)
 *   - bare fileKey       → generate presigned GET URL (Linode private) or redirect to /uploads/<key>
 *
 * Requires authentication (used by admin / dashboard pages only).
 */
export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const fileKey = searchParams.get('fileKey')
  const bucket = (searchParams.get('bucket') ?? 'private') as UploadBucket

  if (!fileKey) {
    return NextResponse.json({ success: false, error: 'fileKey is required' }, { status: 400 })
  }

  // Already a full URL (public Linode CDN or external) → redirect directly
  if (fileKey.startsWith('https://') || fileKey.startsWith('http://')) {
    return NextResponse.redirect(fileKey)
  }

  // Local upload path → redirect directly
  if (fileKey.startsWith('/')) {
    return NextResponse.redirect(new URL(fileKey, req.url))
  }

  // Bare fileKey (stored from private Linode bucket) → generate presigned GET URL
  const presignedUrl = await getPresignedDownloadUrl(fileKey, bucket)
  if (presignedUrl) {
    return NextResponse.redirect(presignedUrl)
  }

  // Linode not configured — assume local path as fallback
  return NextResponse.redirect(new URL(`/uploads/${fileKey}`, req.url))
}
