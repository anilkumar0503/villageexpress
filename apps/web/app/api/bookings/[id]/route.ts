import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'
import { getUserPermissions } from '@/lib/auth/session'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { id } = await params

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
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
      paymentGatewayRef: true,
      cancelReason: true,
      refundId: true,
      createdAt: true,
      customerId: true,
      assignedPointManagerId: true,
      assignedCaptainId: true,
      pickupLocationId: true,
      dropLocationId: true,
      codCollectedBy: true as any,
      codCollectedAt: true as any,
      codCollectedAtLocation: true as any,
      customer: { select: { id: true, displayId: true, name: true, email: true, phone: true } },
      pickupLocation: {
        select: { id: true, pointName: true, village: true, district: true, state: true, pincode: true },
      },
      dropLocation: {
        select: { id: true, pointName: true, village: true, district: true, state: true, pincode: true },
      },
      pointManager: { select: { id: true, displayId: true, name: true, phone: true } },
      captain: {
        select: {
          id: true, displayId: true, name: true, phone: true,
          captainProfile: { select: { vehicleType: true, vehicleNumber: true } },
        },
      },
      segments: {
        orderBy: { sequenceOrder: 'asc' },
        select: {
          id: true,
          sequenceOrder: true,
          status: true,
          routeSegment: {
            select: {
              fromLocation: { select: { pointName: true, village: true } },
              toLocation: { select: { pointName: true, village: true } },
            },
          },
          pointManager: { select: { name: true } },
          captain: { select: { name: true } },
        },
      },
    },
  })

  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
  }

  const userId = session!.userId
  const isOwner = booking.customerId === userId
  const isAssignedPM = booking.assignedPointManagerId === userId
  const isAssignedCaptain = booking.assignedCaptainId === userId

  const permissions = await getUserPermissions(userId)
  const isStaff = permissions.includes('user:read')
  const isAdmin = permissions.includes('admin:all') || permissions.includes('booking:read')

  // Check if user is a point manager at pickup or drop location (for direct bookings)
  let isLocationPM = false
  if (!isOwner && !isAssignedPM && !isAssignedCaptain && !isStaff && !isAdmin) {
    const pmProfile = await prisma.pointManagerProfile.findUnique({
      where: { userId },
      select: { shopLocationId: true },
    })
    if (pmProfile) {
      isLocationPM = booking.pickupLocationId === pmProfile.shopLocationId || booking.dropLocationId === pmProfile.shopLocationId
    }
  }

  if (!isOwner && !isAssignedPM && !isAssignedCaptain && !isStaff && !isAdmin && !isLocationPM) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  // Fetch user who collected COD if applicable
  let codCollectedByUser = null
  if (booking.codCollectedBy) {
    codCollectedByUser = await prisma.user.findUnique({
      where: { id: booking.codCollectedBy },
      select: { id: true, name: true, phone: true },
    })
  }

  return NextResponse.json({ success: true, data: { ...booking, codCollectedByUser } })
}

const updateSchema = z.object({
  pickupLocationId: z.string().uuid().optional(),
  dropLocationId: z.string().uuid().optional(),
  parcelWeight: z.number().positive().optional(),
  parcelType: z.enum(['DOCUMENTS', 'GENERAL', 'FRAGILE', 'PERISHABLE']).optional(),
  deliveryPriority: z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT']).optional(),
  assignedPointManagerId: z.string().uuid().nullable().optional(),
  assignedCaptainId: z.string().uuid().nullable().optional(),
  calculatedPrice: z.number().positive().optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'COD']).optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'RECEIVED_AT_POINT', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']).optional(),
})

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'booking:update')
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const booking = await prisma.booking.findUnique({ where: { id } })
  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
  }

  // Filter out undefined values
  const updateData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  )

  const updated = await prisma.booking.update({
    where: { id },
    data: updateData,
    include: {
      customer: { select: { id: true, displayId: true, name: true, email: true, phone: true } },
      pickupLocation: true,
      dropLocation: true,
      pointManager: { select: { id: true, displayId: true, name: true, phone: true } },
      captain: {
        select: {
          id: true, displayId: true, name: true, phone: true,
          captainProfile: { select: { vehicleType: true, vehicleNumber: true } },
        },
      },
      segments: {
        orderBy: { sequenceOrder: 'asc' },
        include: {
          routeSegment: {
            include: {
              fromLocation: { select: { pointName: true, village: true } },
              toLocation: { select: { pointName: true, village: true } },
            },
          },
          pointManager: { select: { name: true } },
          captain: { select: { name: true } },
        },
      },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: session!.userId,
      action: 'BOOKING_UPDATED',
      resource: `booking:${id}`,
      result: 'GRANTED',
    },
  })

  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'booking:delete')
  if (error) return error

  const { id } = await params

  const booking = await prisma.booking.findUnique({ where: { id } })
  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
  }

  if (booking.status === 'ASSIGNED' || booking.status === 'PICKED_UP' || booking.status === 'IN_TRANSIT' || booking.status === 'OUT_FOR_DELIVERY') {
    return NextResponse.json({ success: false, error: 'Cannot delete booking in active transit' }, { status: 400 })
  }

  await prisma.booking.delete({ where: { id } })

  await prisma.auditLog.create({
    data: {
      userId: session!.userId,
      action: 'BOOKING_DELETED',
      resource: `booking:${id}`,
      result: 'GRANTED',
    },
  })

  return NextResponse.json({ success: true, message: 'Booking deleted' })
}
