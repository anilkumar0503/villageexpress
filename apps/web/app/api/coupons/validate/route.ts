import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

// POST /api/coupons/validate - Validate and apply coupon
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  try {
    const { code, bookingAmount, routeId } = await req.json()

    if (!code) {
      return NextResponse.json({ success: false, error: 'Coupon code is required' }, { status: 400 })
    }

    const amount = Number(bookingAmount)

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Invalid coupon code' }, { status: 404 })
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json({ success: false, error: 'Coupon is not active' }, { status: 400 })
    }

    // Check validity dates
    const now = new Date()
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return NextResponse.json({ success: false, error: 'Coupon has expired or is not yet valid' }, { status: 400 })
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ success: false, error: 'Coupon usage limit reached' }, { status: 400 })
    }

    // Check if applicable to user
    if (coupon.applicableUsers.length > 0 && !coupon.applicableUsers.includes(session!.userId)) {
      return NextResponse.json({ success: false, error: 'Coupon is not applicable to your account' }, { status: 403 })
    }

    // Check if applicable to route
    if (routeId && coupon.applicableRoutes.length > 0 && !coupon.applicableRoutes.includes(routeId)) {
      return NextResponse.json({ success: false, error: 'Coupon is not applicable to this route' }, { status: 400 })
    }

    // Check minimum order value
    if (amount < Number(coupon.minOrderValue)) {
      return NextResponse.json({
        success: false,
        error: `Minimum order value of ₹${Number(coupon.minOrderValue).toFixed(2)} required`
      }, { status: 400 })
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.discountType === 'FLAT') {
      discountAmount = Number(coupon.discountValue)
    } else if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = amount * Number(coupon.discountValue) / 100
    }

    // Apply max discount cap if set
    if (coupon.maxDiscountAmount && discountAmount > Number(coupon.maxDiscountAmount)) {
      discountAmount = Number(coupon.maxDiscountAmount)
    }

    // Ensure discount doesn't exceed booking amount
    if (discountAmount > amount) {
      discountAmount = amount
    }

    return NextResponse.json({
      success: true,
      data: {
        couponId: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        finalAmount: amount - discountAmount,
      },
    })
  } catch (err) {
    console.error('[COUPONS/VALIDATE/POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
