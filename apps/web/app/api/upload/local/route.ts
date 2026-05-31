import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string
    const fileKey = formData.get('fileKey') as string

    if (!file || !folder || !fileKey) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const filePath = path.join(uploadDir, path.basename(fileKey))
    await writeFile(filePath, buffer)

    const publicUrl = `/uploads/${fileKey}`
    return NextResponse.json({ success: true, data: { publicUrl } })
  } catch (err) {
    console.error('[UPLOAD/LOCAL]', err)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
