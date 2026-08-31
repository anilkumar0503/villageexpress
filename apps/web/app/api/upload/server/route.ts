import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, type AllowedMimeType, type UploadBucket, MAX_SIZE_BYTES } from '@/lib/storage'
import { requireAuth } from '@/lib/auth/permissions'

// Folders that do NOT require authentication (e.g. onboarding / registration flows)
const PUBLIC_FOLDERS = new Set(['aadhaar', 'driving-license', 'shop-photos'])

const ALLOWED_FOLDERS: Record<string, { bucket: UploadBucket; mimeTypes: AllowedMimeType[] }> = {
  'shop-photos':       { bucket: 'public',  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
  'profile-photos':    { bucket: 'public',  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
  'aadhaar':           { bucket: 'private', mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'] },
  'driving-license':   { bucket: 'private', mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'] },
  'vehicle-rc':        { bucket: 'private', mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'] },
  'kyc-documents':     { bucket: 'private', mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
  'validation-images': { bucket: 'public',  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
  'delivery-proof':    { bucket: 'public',  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
  'qr-code':           { bucket: 'public',  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
}

/**
 * POST /api/upload/server
 *
 * Server-side upload proxy — avoids CORS issues with direct Linode PUT.
 * Accepts: multipart/form-data with `file` (File) and `folder` (string) fields.
 * Returns: { success: true, data: { publicUrl, fileKey } }
 *
 * This is the preferred upload path for browser clients. The browser posts to
 * this Next.js route, which then forwards the bytes to Linode/S3 server-to-server.
 */
export async function POST(req: NextRequest) {
  try {
    // Cast needed: Next.js 16 server routes use undici FormData (no .get/.entries in types)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formData = await req.formData() as any
    const file = formData.get('file') as File | null
    const folder = formData.get('folder') as string | null

    if (!file || !folder) {
      return NextResponse.json({ success: false, error: 'Missing file or folder' }, { status: 400 })
    }

    const folderConfig = ALLOWED_FOLDERS[folder]
    if (!folderConfig) {
      return NextResponse.json(
        { success: false, error: `Invalid folder. Allowed: ${Object.keys(ALLOWED_FOLDERS).join(', ')}` },
        { status: 400 },
      )
    }

    // Auth check — skip for public folders (onboarding, registration)
    if (!PUBLIC_FOLDERS.has(folder)) {
      const { error } = await requireAuth(req)
      if (error) return error
    }

    const mimeType = file.type as AllowedMimeType
    if (!folderConfig.mimeTypes.includes(mimeType)) {
      return NextResponse.json(
        { success: false, error: `File type "${mimeType}" is not allowed for folder "${folder}"` },
        { status: 400 },
      )
    }

    const maxSize = MAX_SIZE_BYTES[mimeType] ?? 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File too large. Max allowed: ${maxSize / 1024 / 1024} MB` },
        { status: 413 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadFile(folder, mimeType, buffer, folderConfig.bucket)

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error('[UPLOAD/SERVER]', err)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
