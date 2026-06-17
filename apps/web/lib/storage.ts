import crypto from 'crypto'
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { writeFile, mkdir, unlink, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export type UploadBucket = 'public' | 'private'

export type AllowedMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif'
  | 'application/pdf'

const BUCKET_MAP: Record<UploadBucket, string> = {
  public: process.env.LINODE_BUCKET_PUBLIC ?? 'village-express-public',
  private: process.env.LINODE_BUCKET_PRIVATE ?? 'village-express-private',
}

const EXTENSIONS: Record<AllowedMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
}

export const MAX_SIZE_BYTES: Record<AllowedMimeType, number> = {
  'image/jpeg': 5 * 1024 * 1024,
  'image/png': 5 * 1024 * 1024,
  'image/webp': 5 * 1024 * 1024,
  'image/gif': 5 * 1024 * 1024,
  'application/pdf': 10 * 1024 * 1024,
}

// ─── S3 Client ────────────────────────────────────────────────────────────────

function createS3Client(): S3Client | null {
  const endpoint = process.env.LINODE_STORAGE_ENDPOINT
  const accessKeyId = process.env.LINODE_ACCESS_KEY
  const secretAccessKey = process.env.LINODE_SECRET_KEY

  if (!endpoint || !accessKeyId || !secretAccessKey) return null

  return new S3Client({
    region: process.env.LINODE_STORAGE_REGION ?? 'us-east-1',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: false,
  })
}

export function isStorageConfigured(): boolean {
  return !!(
    process.env.LINODE_STORAGE_ENDPOINT &&
    process.env.LINODE_ACCESS_KEY &&
    process.env.LINODE_SECRET_KEY
  )
}

// ─── URL helpers ──────────────────────────────────────────────────────────────

/**
 * Build the public CDN URL for an object in a public Linode bucket.
 * endpoint: https://us-east-1.linodeobjects.com
 * → https://<bucket>.us-east-1.linodeobjects.com/<fileKey>
 */
function getPublicObjectUrl(bucketName: string, fileKey: string): string {
  const endpoint = process.env.LINODE_STORAGE_ENDPOINT!
  const host = endpoint.replace(/^https?:\/\//, '')
  return `https://${bucketName}.${host}/${fileKey}`
}

// ─── Presigned PUT (browser → Linode direct upload) ──────────────────────────

/**
 * Generate a presigned PUT URL so the browser can upload directly to Linode.
 * Falls back to local storage if Linode is not configured.
 * Returns { uploadUrl, fileKey, publicUrl }
 *
 * publicUrl for public buckets: the permanent CDN URL.
 * publicUrl for private buckets: the fileKey (caller must use getPresignedDownloadUrl).
 */
export async function getPresignedUploadUrl(
  folder: string,
  mimeType: AllowedMimeType,
  bucket: UploadBucket = 'public',
): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }> {
  const ext = EXTENSIONS[mimeType]
  const fileKey = `${folder}/${crypto.randomUUID()}.${ext}`
  const bucketName = BUCKET_MAP[bucket]

  const s3 = createS3Client()

  if (s3) {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: mimeType,
      ...(bucket === 'public' ? { ACL: 'public-read' } : {}),
    })
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
    const publicUrl =
      bucket === 'public' ? getPublicObjectUrl(bucketName, fileKey) : fileKey
    return { uploadUrl, fileKey, publicUrl }
  }

  // ── Local fallback ──
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }
  const uploadUrl = `/api/upload/local?folder=${encodeURIComponent(folder)}&fileKey=${encodeURIComponent(fileKey)}`
  const publicUrl = `/uploads/${fileKey}`
  return { uploadUrl, fileKey, publicUrl }
}

// ─── Server-side upload (buffer → Linode) ────────────────────────────────────

/**
 * Upload a file buffer directly from the server to Linode (or local fallback).
 * Returns { fileKey, publicUrl }.
 *
 * publicUrl for public buckets: permanent CDN URL.
 * publicUrl for private buckets: the fileKey (use getPresignedDownloadUrl to serve).
 */
export async function uploadFile(
  folder: string,
  mimeType: AllowedMimeType,
  buffer: Buffer,
  bucket: UploadBucket = 'public',
): Promise<{ fileKey: string; publicUrl: string }> {
  const ext = EXTENSIONS[mimeType]
  const fileKey = `${folder}/${crypto.randomUUID()}.${ext}`
  const bucketName = BUCKET_MAP[bucket]

  const s3 = createS3Client()

  if (s3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: buffer,
        ContentType: mimeType,
        ...(bucket === 'public' ? { ACL: 'public-read' } : {}),
      }),
    )
    const publicUrl =
      bucket === 'public' ? getPublicObjectUrl(bucketName, fileKey) : fileKey
    return { fileKey, publicUrl }
  }

  // ── Local fallback ──
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }
  await writeFile(path.join(uploadDir, path.basename(fileKey)), buffer)
  return { fileKey, publicUrl: `/uploads/${fileKey}` }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete a file from Linode or local storage.
 */
export async function deleteFile(
  fileKey: string,
  bucket: UploadBucket = 'public',
): Promise<void> {
  const bucketName = BUCKET_MAP[bucket]
  const s3 = createS3Client()

  if (s3) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: fileKey }))
    return
  }

  // ── Local fallback ──
  const filePath = path.join(process.cwd(), 'public', 'uploads', fileKey)
  if (existsSync(filePath)) {
    await unlink(filePath)
  }
}

// ─── List ─────────────────────────────────────────────────────────────────────

/**
 * List files under a folder prefix in Linode or local storage.
 */
export async function listFiles(
  folder: string,
  bucket: UploadBucket = 'public',
): Promise<{ fileKey: string; publicUrl: string; createdAt: string }[]> {
  const bucketName = BUCKET_MAP[bucket]
  const s3 = createS3Client()

  if (s3) {
    const result = await s3.send(
      new ListObjectsV2Command({ Bucket: bucketName, Prefix: `${folder}/` }),
    )
    return (result.Contents ?? []).map((obj) => ({
      fileKey: obj.Key!,
      publicUrl:
        bucket === 'public'
          ? getPublicObjectUrl(bucketName, obj.Key!)
          : obj.Key!,
      createdAt: obj.LastModified?.toISOString() ?? '',
    }))
  }

  // ── Local fallback ──
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
  if (!existsSync(uploadDir)) return []

  const files = await readdir(uploadDir)
  return files
    .filter((f) => /\.(jpg|jpeg|png|webp|gif|pdf)$/i.test(f))
    .map((f) => ({
      fileKey: `${folder}/${f}`,
      publicUrl: `/uploads/${folder}/${f}`,
      createdAt: f.split('-')[0] ?? '0',
    }))
}

// ─── Presigned GET (private files) ───────────────────────────────────────────

/**
 * Generate a time-limited presigned GET URL for a private file.
 * Returns null when Linode is not configured (caller should handle local path).
 */
export async function getPresignedDownloadUrl(
  fileKey: string,
  bucket: UploadBucket = 'private',
  expiresIn = 3600,
): Promise<string | null> {
  const bucketName = BUCKET_MAP[bucket]
  const s3 = createS3Client()
  if (!s3) return null

  const command = new GetObjectCommand({ Bucket: bucketName, Key: fileKey })
  return getSignedUrl(s3, command, { expiresIn })
}
