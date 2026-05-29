import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'

const s3 = new S3Client({
  region: process.env.LINODE_STORAGE_REGION ?? 'ap-south-1',
  endpoint: process.env.LINODE_STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.LINODE_ACCESS_KEY ?? '',
    secretAccessKey: process.env.LINODE_SECRET_KEY ?? '',
  },
  forcePathStyle: false,
})

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
  return storageConfigured
}

/**
 * Generate a presigned PUT URL so the browser can upload directly to S3/Linode.
 * Returns { uploadUrl, fileKey, publicUrl }
 */
export async function getPresignedUploadUrl(
  folder: string,
  mimeType: AllowedMimeType,
  bucket: UploadBucket = 'public',
): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }> {
  if (!storageConfigured) {
    throw new Error('Object storage not configured. Set LINODE_* env vars.')
  }

  const ext = EXTENSIONS[mimeType]
  const fileKey = `${folder}/${crypto.randomUUID()}.${ext}`
  const bucketName = BUCKET_MAP[bucket]

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    ContentType: mimeType,
    ContentLength: MAX_SIZE_BYTES[mimeType],
  })

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
  const publicUrl = bucket === 'public'
    ? `${process.env.LINODE_STORAGE_ENDPOINT}/${bucketName}/${fileKey}`
    : fileKey

  return { uploadUrl, fileKey, publicUrl }
}

export async function deleteFile(fileKey: string, bucket: UploadBucket = 'public') {
  if (!storageConfigured) return
  await s3.send(new DeleteObjectCommand({
    Bucket: BUCKET_MAP[bucket],
    Key: fileKey,
  }))
}
