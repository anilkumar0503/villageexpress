import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

const createSchema = z.object({
  title: z.string().min(1).max(100),
  category: z.enum(['PAYMENT', 'BOOKING', 'ONBOARDING', 'GENERAL', 'TECHNICAL']),
  content: z.string().min(1),
})

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, 'settings:manage')
  if (error) return error

  try {
    const { searchParams } = req.nextUrl
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (category) where.category = category
    if (isActive !== null) where.isActive = isActive === 'true'

    const responses = await prisma.cannedResponse.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: responses })
  } catch (err) {
    console.error('[CANNED_RESPONSES/GET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission(req, 'settings:manage')
  if (error) return error

  try {
    const body = await req.json()
    const parsed = createSchema.parse(body)

    const response = await prisma.cannedResponse.create({
      data: parsed,
    })

    return NextResponse.json({ success: true, data: response }, { status: 201 })
  } catch (err) {
    console.error('[CANNED_RESPONSES/POST]', err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
