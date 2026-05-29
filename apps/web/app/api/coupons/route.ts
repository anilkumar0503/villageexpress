import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

// GET /api/coupons - List all coupons (admin only)
export async function GET(req: NextRequest) {
  const { error, session } = await requirePermission(req, 'coupon:read')
  if (error) return error

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: coupons })
  } catch (err) {
    console.error('[COUPONS/GET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/coupons - Create new coupon (admin only)
export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission(req, 'coupon:write')
  if (error) return error

  try {
    const body = await req.json()
    const { code, discountType, discountValue, minOrderValue, maxDiscountAmount, usageLimit, validFrom, validUntil } = body

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type: 'FLAT',
        discountType,
        discountValue,
        minOrderValue,
        maxDiscountAmount,
        usageLimit,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, data: coupon })
  } catch (err) {
    console.error('[COUPONS/POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
