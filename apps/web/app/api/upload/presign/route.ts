import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/permissions'
import { getPresignedUploadUrl, type AllowedMimeType, type UploadBucket } from '@/lib/storage'

const ALLOWED_FOLDERS: Record<string, { bucket: UploadBucket; mimeTypes: AllowedMimeType[]; public: boolean }> = {
  'shop-photos':        { bucket: 'public',  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'], public: true },
  'profile-photos':     { bucket: 'public',  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'], public: false },
  'aadhaar':            { bucket: 'private', mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'], public: true },
  'driving-license':    { bucket: 'private', mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'], public: true },
  'vehicle-rc':         { bucket: 'private', mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'], public: false },
  'kyc-documents':      { bucket: 'private', mimeTypes: ['image/jpeg', 'image/png', 'image/webp'], public: false },
  'validation-images':  { bucket: 'public',  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'], public: false },
  'delivery-proof':     { bucket: 'public',  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'], public: false },
  'qr-code':            { bucket: 'public',  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'], public: false },
}

const schema = z.object({
  folder: z.string(),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
  }

  const { folder, mimeType } = parsed.data
  const folderConfig = ALLOWED_FOLDERS[folder]

  if (!folderConfig) {
    return NextResponse.json({ success: false, error: `Invalid folder. Allowed: ${Object.keys(ALLOWED_FOLDERS).join(', ')}` }, { status: 400 })
  }

  if (!folderConfig.mimeTypes.includes(mimeType as AllowedMimeType)) {
    return NextResponse.json({ success: false, error: `MIME type not allowed for this folder` }, { status: 400 })
  }

  // Require auth only for non-public folders (registration pages can upload without auth)
  if (!folderConfig.public) {
    const { error } = await requireAuth(req)
    if (error) return error
  }

  try {
    // getPresignedUploadUrl uses Linode when configured, local filesystem otherwise
    const result = await getPresignedUploadUrl(folder, mimeType as AllowedMimeType, folderConfig.bucket)
    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error('[UPLOAD/PRESIGN] Error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Failed to generate upload URL'
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
