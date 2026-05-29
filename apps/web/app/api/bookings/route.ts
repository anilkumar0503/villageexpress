import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { generateBookingNumber } from '@ve/utils'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'
import { resolvePrice, autoAssignPointManager } from '@/lib/booking/pricing-service'
import { sendNewBookingToPM, sendDeliveryOtpEmail } from '@/lib/email'

type DistanceTier = {
  minDistance: number
  maxDistance: number
  pricePerKm: number
}

// Calculate progressive distance cost using distance tiers
function calculateProgressiveDistanceCost(distanceKm: number, tiers: DistanceTier[], fallbackRate: number): number {
  if (!tiers || tiers.length === 0) {
    return distanceKm * fallbackRate
  }

  let totalCost = 0
  let remainingDistance = distanceKm

  // Sort tiers by minDistance
  const sortedTiers = [...tiers].sort((a, b) => a.minDistance - b.minDistance)

  for (const tier of sortedTiers) {
    if (remainingDistance <= 0) break

    const tierMin = tier.minDistance
    const tierMax = tier.maxDistance

    // Calculate how much of the distance falls into this tier
    const segmentStart = Math.max(tierMin, 0)
    const segmentEnd = Math.min(tierMax, distanceKm)

    if (segmentStart < segmentEnd) {
      const segmentDistance = segmentEnd - segmentStart
      const segmentCost = segmentDistance * tier.pricePerKm
      totalCost += segmentCost
      remainingDistance -= segmentDistance
    }
  }

  // If there's remaining distance that doesn't fit in any tier, use fallback rate
  if (remainingDistance > 0) {
    totalCost += remainingDistance * fallbackRate
  }

  return totalCost
}

const createSchema = z.object({
  pickupLocationId: z.string().uuid(),
  dropLocationId: z.string().uuid(),
  parcelWeight: z.number().positive(),
  parcelType: z.enum(['DOCUMENTS', 'GENERAL', 'FRAGILE', 'PERISHABLE']),
  deliveryPriority: z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT']).default('STANDARD'),
  vehicleType: z.enum(['BIKE', 'AUTO', 'MINI_VAN', 'VAN']).optional(),
  paymentMethod: z.enum(['UPI', 'CARD', 'NETBANKING', 'COD', 'ONLINE', 'WALLET']),
  routeId: z.string().uuid().optional(),
  couponId: z.string().uuid().optional(),
  finalPrice: z.number().positive().optional(),
})

const bookingSelect = {
  id: true,
  bookingNumber: true,
  status: true,
  parcelWeight: true,
  parcelType: true,
  deliveryPriority: true,
  calculatedPrice: true,
  estimatedDeliveryDate: true,
  paymentStatus: true,
  paymentMethod: true,
  createdAt: true,
  customer: { select: { id: true, displayId: true, name: true, phone: true } },
  pickupLocation: { select: { id: true, pointName: true, village: true, district: true } },
  dropLocation: { select: { id: true, pointName: true, village: true, district: true } },
  pointManager: { select: { id: true, displayId: true, name: true, phone: true } },
  captain: { select: { id: true, displayId: true, name: true, phone: true } },
}

export async function GET(req: NextRequest) {
  const { error, session } = await requirePermission(req, 'booking:read')
  if (error) return error

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined
  const scope = searchParams.get('scope') ?? undefined
  const fromLocationId = searchParams.get('fromLocationId') ?? undefined
  const toLocationId = searchParams.get('toLocationId') ?? undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 20))

  let pmLocationId: string | undefined
  if (scope === 'my-point') {
    const pmProfile = await prisma.pointManagerProfile.findUnique({
      where: { userId: session!.userId },
      select: { shopLocationId: true },
    })
    pmLocationId = pmProfile?.shopLocationId ?? undefined
  }

  const where: any = {
    ...(status && { status: status as 'PENDING' }),
    ...(pmLocationId && { pickupLocationId: pmLocationId }),
    ...(fromLocationId && { pickupLocationId: fromLocationId }),
    ...(toLocationId && { dropLocationId: toLocationId }),
  }

  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: bookingSelect,
    }),
    prisma.booking.count({ where }),
  ])

  return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission(req, 'booking:create')
  if (error) return error

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { pickupLocationId, dropLocationId, parcelWeight, parcelType, deliveryPriority, vehicleType, paymentMethod, routeId, couponId } = parsed.data

    if (pickupLocationId === dropLocationId) {
      return NextResponse.json(
        { success: false, error: 'Pickup and drop locations cannot be the same' },
        { status: 400 },
      )
    }

    // Find matching route (either provided or auto-detected)
    let selectedRoute
    if (routeId) {
      selectedRoute = await prisma.route.findUnique({
        where: { id: routeId, isActive: true },
        include: {
          segments: {
            orderBy: { sequenceOrder: 'asc' },
            include: {
              fromLocation: true,
              toLocation: true,
            },
          },
          pricingRules: true,
        },
      })
    } else {
      // Auto-find route matching pickup and drop
      selectedRoute = await prisma.route.findFirst({
        where: {
          sourceLocationId: pickupLocationId,
          destinationLocationId: dropLocationId,
          isActive: true,
        },
        include: {
          segments: {
            orderBy: { sequenceOrder: 'asc' },
            include: {
              fromLocation: true,
              toLocation: true,
            },
          },
          pricingRules: true,
        },
      })
    }

    // Calculate price
    let priceResult
    let estimatedDeliveryDays = 3

    if (selectedRoute) {
      // Fetch vehicle configuration to get weight limits and distance pricing tiers
      let vehicleConfig = null
      if (vehicleType) {
        vehicleConfig = await prisma.vehicleConfiguration.findFirst({
          where: { vehicleType: vehicleType as any, isActive: true },
          include: {
            distanceTiers: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        })
      }

      const defaultWeight = vehicleConfig?.defaultWeight ?? 5
      const maxWeight = vehicleConfig?.maxWeight ?? 50

      // Validate parcel weight against vehicle max weight
      if (parcelWeight > maxWeight) {
        return NextResponse.json(
          { success: false, error: `Parcel weight ${parcelWeight}kg exceeds maximum allowed weight of ${maxWeight}kg for ${vehicleType || 'selected vehicle'}` },
          { status: 400 },
        )
      }

      // Match by vehicleType if provided, then fall back to rules with no vehicleType
      const matchingRule = selectedRoute.pricingRules.find(
        (rule: any) =>
          rule.priority === deliveryPriority &&
          rule.isActive &&
          (vehicleType ? rule.vehicleType === vehicleType || rule.vehicleType === null : true)
      )

      if (matchingRule) {
        const totalDistance = selectedRoute.segments.reduce((sum, seg) => sum + Number(seg.distanceKm), 0)
        const weightSurcharge = parcelWeight > defaultWeight ? Number((matchingRule as any).weightSurcharge ?? 0) : 0
        
        // Use progressive distance pricing tiers if available, otherwise use rule's pricePerKm
        let distanceCost = 0
        if (vehicleConfig && vehicleConfig.distanceTiers.length > 0) {
          const tiers = vehicleConfig.distanceTiers.map((tier: any) => ({
            minDistance: Number(tier.minDistance),
            maxDistance: Number(tier.maxDistance),
            pricePerKm: Number(tier.pricePerKm),
          }))
          distanceCost = calculateProgressiveDistanceCost(totalDistance, tiers, Number(matchingRule.pricePerKm))
        } else {
          distanceCost = totalDistance * Number(matchingRule.pricePerKm)
        }
        
        const multiplier = deliveryPriority === 'EXPRESS' ? 1.5 : deliveryPriority === 'OVERNIGHT' ? 2.0 : 1.0
        const priorityCharge = Number(matchingRule.basePrice) * (multiplier - 1)
        
        priceResult = {
          finalPrice: Number(matchingRule.basePrice) + distanceCost + priorityCharge + weightSurcharge,
          estimatedDeliveryDays: selectedRoute.estimatedDays,
        }
      } else if (selectedRoute.pricingRules.length > 0) {
        // Route has rules but none match this priority + vehicleType
        const available = selectedRoute.pricingRules
          .map((r: any) => `${r.priority}${r.vehicleType ? ` (${r.vehicleType})` : ''}`)
          .join(', ')
        return NextResponse.json(
          { success: false, error: `No ${deliveryPriority} pricing rule${vehicleType ? ` with ${vehicleType}` : ''} on this route. Available: ${available}` },
          { status: 422 },
        )
      } else {
        // Route has no pricing rules at all — fall back to standard pricing
        priceResult = await resolvePrice({
          pickupLocationId,
          dropLocationId,
          parcelWeight,
          deliveryPriority,
          vehicleType,
        })
      }
    } else {
      // No route found, use standard pricing
      priceResult = await resolvePrice({
        pickupLocationId,
        dropLocationId,
        parcelWeight,
        deliveryPriority,
        vehicleType,
      })
    }

    estimatedDeliveryDays = priceResult.estimatedDeliveryDays

    // Use finalPrice from request if provided (and no coupon), otherwise calculate server-side
    let finalPrice = couponId ? priceResult.finalPrice : (body.finalPrice || priceResult.finalPrice)
    let discountAmount = 0
    let couponData = null

    if (couponId) {
      const coupon = await prisma.coupon.findUnique({
        where: { id: couponId },
      })

      if (!coupon || !coupon.isActive) {
        return NextResponse.json({ success: false, error: 'Invalid or inactive coupon' }, { status: 400 })
      }

      const now = new Date()
      if (now < coupon.validFrom || now > coupon.validUntil) {
        return NextResponse.json({ success: false, error: 'Coupon has expired' }, { status: 400 })
      }

      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return NextResponse.json({ success: false, error: 'Coupon usage limit reached' }, { status: 400 })
      }

      if (coupon.applicableUsers.length > 0 && !coupon.applicableUsers.includes(session!.userId)) {
        return NextResponse.json({ success: false, error: 'Coupon not applicable to your account' }, { status: 403 })
      }

      if (priceResult.finalPrice < coupon.minOrderValue) {
        return NextResponse.json({ success: false, error: `Minimum order value of ₹${Number(coupon.minOrderValue).toFixed(2)} required` }, { status: 400 })
      }

      // Calculate discount
      if (coupon.discountType === 'FLAT') {
        discountAmount = Number(coupon.discountValue)
      } else if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = priceResult.finalPrice * (Number(coupon.discountValue) / 100)
      }

      if (coupon.maxDiscountAmount && discountAmount > Number(coupon.maxDiscountAmount)) {
        discountAmount = Number(coupon.maxDiscountAmount)
      }

      if (discountAmount > priceResult.finalPrice) {
        discountAmount = priceResult.finalPrice
      }

      finalPrice = priceResult.finalPrice - discountAmount
      couponData = coupon
    }

    // Assign point manager for first segment (pickup location)
    const pointManagerId = await autoAssignPointManager(pickupLocationId)

    const estimatedDeliveryDate = new Date()
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + estimatedDeliveryDays)

    let bookingNumber: string
    let attempts = 0
    do {
      bookingNumber = generateBookingNumber()
      const exists = await prisma.booking.findUnique({ where: { bookingNumber } })
      if (!exists) break
      attempts++
    } while (attempts < 5)

    // Generate delivery OTP for customer
    const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString()
    const deliveryOtpExpiresAt = new Date()
    deliveryOtpExpiresAt.setDate(deliveryOtpExpiresAt.getDate() + 7) // OTP valid for 7 days

    // Create booking with segments if route exists
    const booking = await prisma.booking.create({
      data: {
        bookingNumber: bookingNumber!,
        customerId: session!.userId,
        pickupLocationId,
        dropLocationId,
        routeId: selectedRoute?.id,
        assignedPointManagerId: pointManagerId,
        parcelWeight,
        parcelType,
        numberOfBags: body.numberOfBags || 1,
        deliveryPriority,
        calculatedPrice: finalPrice,
        estimatedDeliveryDate,
        scheduledDeliveryDate: body.scheduledDeliveryDate ? new Date(body.scheduledDeliveryDate) : null,
        deliveryTimeSlot: body.deliveryTimeSlot || null,
        paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'COD' : 'PENDING',
        status: paymentMethod === 'COD' ? 'CONFIRMED' : 'PENDING',
        receiverName: body.receiverName || null,
        receiverPhone: body.receiverPhone || null,
        deliveryOtp,
        deliveryOtpExpiresAt,
        ...(selectedRoute && {
          segments: {
            create: selectedRoute.segments.map((segment) => ({
              routeSegmentId: segment.id,
              sequenceOrder: segment.sequenceOrder,
              status: segment.sequenceOrder === 1 ? 'PENDING' : 'PENDING',
              assignedPointManagerId: segment.sequenceOrder === 1 ? pointManagerId : null,
            })),
          },
        }),
      },
      select: bookingSelect,
    })

    // Record coupon usage if coupon was applied
    if (couponData) {
      await prisma.$transaction([
        prisma.coupon.update({
          where: { id: couponId },
          data: { usageCount: { increment: 1 } },
        }),
        prisma.couponUsage.create({
          data: {
            couponId,
            userId: session!.userId,
            bookingId: booking.id,
            discountAmount,
          },
        }),
      ])
    }

    // Send delivery OTP to customer
    const customer = await prisma.user.findUnique({
      where: { id: session!.userId },
      select: { name: true, email: true },
    })
    if (customer?.email) {
      sendDeliveryOtpEmail(customer.email, customer.name, booking.bookingNumber, deliveryOtp).catch((err) => {
        console.error('Failed to send delivery OTP email:', err)
      })
    }

    // Handle wallet payment - defer debit until captain assignment
    if (paymentMethod === 'WALLET') {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: session!.userId },
      })

      if (!wallet) {
        return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 })
      }

      if (wallet.balance < finalPrice) {
        const requiredAmount = finalPrice - wallet.balance
        return NextResponse.json({
          success: false,
          error: 'Insufficient wallet balance',
          code: 'INSUFFICIENT_BALANCE',
          data: {
            currentBalance: Number(wallet.balance),
            requiredAmount: Number(finalPrice),
            shortfall: Number(requiredAmount),
          }
        }, { status: 400 })
      }

      // Set status to PENDING_PAYMENT, will be debited after captain assignment
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: 'PENDING_PAYMENT',
          status: 'PENDING',
        },
      })
    }

    if (pointManagerId) {
      const pm = await prisma.user.findUnique({
        where: { id: pointManagerId },
        select: { name: true, email: true },
      })
      if (pm?.email) {
        const pickupLoc = await prisma.location.findUnique({
          where: { id: pickupLocationId },
          select: { pointName: true },
        })
        sendNewBookingToPM(pm.email, pm.name, booking.bookingNumber, pickupLoc?.pointName || '').catch(() => {})
      }
    }

    return NextResponse.json({ success: true, data: booking }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[BOOKINGS/POST]', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
