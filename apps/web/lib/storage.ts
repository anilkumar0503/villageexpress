import crypto from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export type UploadBucket = 'public' | 'private'

const BUCKET_MAP: Record<UploadBucket, string> = {
  public: process.env.LINODE_BUCKET_PUBLIC ?? 'village-express-public',
  private: process.env.LINODE_BUCKET_PRIVATE ?? 'village-express-private',
}

const storageConfigured = !!(
  process.env.LINODE_STORAGE_ENDPOINT &&
  process.env.LINODE_ACCESS_KEY &&
  process.env.LINODE_SECRET_KEY
)

export type AllowedMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'application/pdf'

const MAX_SIZE_BYTES: Record<AllowedMimeType, number> = {
  'image/jpeg': 5 * 1024 * 1024,
  'image/png': 5 * 1024 * 1024,
  'image/webp': 5 * 1024 * 1024,
  'application/pdf': 10 * 1024 * 1024,
}

const EXTENSIONS: Record<AllowedMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

export function isStorageConfigured() {
  return true // Always return true, use local fallback if Linode not configured
}

/**
 * Generate a presigned PUT URL so the browser can upload directly to S3/Linode.
 * Falls back to local storage if Linode is not configured.
 * Returns { uploadUrl, fileKey, publicUrl }
 */
export async function getPresignedUploadUrl(
  folder: string,
  mimeType: AllowedMimeType,
  bucket: UploadBucket = 'public',
): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }> {
  const ext = EXTENSIONS[mimeType]
  const fileKey = `${folder}/${crypto.randomUUID()}.${ext}`

  try {
    // Always use local storage for now since Linode is not configured
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
    console.log('[STORAGE] Upload dir:', uploadDir)
    console.log('[STORAGE] Exists:', existsSync(uploadDir))

    if (!existsSync(uploadDir)) {
      console.log('[STORAGE] Creating directory...')
      await mkdir(uploadDir, { recursive: true })
      console.log('[STORAGE] Directory created')
    }

    const uploadUrl = `/api/upload/local?folder=${folder}&fileKey=${fileKey}`
    const publicUrl = `/uploads/${fileKey}`

    return { uploadUrl, fileKey, publicUrl }
  } catch (err) {
    console.error('[STORAGE] Error:', err)
    throw err
  }
}

export async function deleteFile(fileKey: string, bucket: UploadBucket = 'public') {
  // Delete from local storage
  const filePath = path.join(process.cwd(), 'public', 'uploads', fileKey)
  if (existsSync(filePath)) {
    await writeFile(filePath, '') // Just clear the file for now
  }
}
