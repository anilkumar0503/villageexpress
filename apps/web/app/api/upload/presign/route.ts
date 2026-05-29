import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/permissions'
import { getPresignedUploadUrl, isStorageConfigured, type AllowedMimeType, type UploadBucket } from '@/lib/storage'

const ALLOWED_FOLDERS: Record<string, { bucket: UploadBucket; mimeTypes: AllowedMimeType[] }> = {
  'shop-photos': { bucket: 'public', mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
  'profile-photos': { bucket: 'public', mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
  'aadhaar': { bucket: 'private', mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'] },
  'driving-license': { bucket: 'private', mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'] },
  'vehicle-rc': { bucket: 'private', mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'] },
}

const schema = z.object({
  folder: z.string(),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
})

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

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

  if (!isStorageConfigured()) {
    return NextResponse.json({ success: false, error: 'Object storage not configured on this server' }, { status: 503 })
  }

  try {
    const result = await getPresignedUploadUrl(folder, mimeType as AllowedMimeType, folderConfig.bucket)
    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error('[UPLOAD/PRESIGN]', err)
    return NextResponse.json({ success: false, error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
