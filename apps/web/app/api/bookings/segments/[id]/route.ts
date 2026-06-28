import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

const updateSchema = z.object({
  status: z.enum(['PENDING', 'RECEIVED_AT_POINT', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'HANDED_OFF', 'DELIVERED']),
  assignedCaptainId: z.string().uuid().optional(),
  receiverPhone: z.string().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/bookings/segments/[id] - Get single segment details
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'booking:read')
  if (error) return error

  const { id } = await params
  try {
    const segment = await prisma.bookingSegment.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            parcelWeight: true,
            parcelType: true,
            customer: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
        routeSegment: {
          include: {
            fromLocation: {
              select: { id: true, pointName: true, village: true },
            },
            toLocation: {
              select: { id: true, pointName: true, village: true },
            },
          },
        },
        pointManager: {
          select: { id: true, name: true, phone: true },
        },
        captain: {
          select: { id: true, name: true, phone: true },
        },
      },
    })

    if (!segment) {
      return NextResponse.json({ success: false, error: 'Segment not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: segment })
  } catch (err) {
    console.error('[BOOKINGS/SEGMENTS/[id]/GET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/bookings/segments/[id] - Update segment status and assign captain
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'booking:update_status')
  if (error) return error

  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { status, assignedCaptainId, receiverPhone } = parsed.data
    const { id } = await params

    // Check if this is a direct booking (starts with "direct-")
    if (id.startsWith('direct-')) {
      const bookingId = id.replace('direct-', '')
      
      // Get current booking
      const currentBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          captain: true,
        },
      })

      if (!currentBooking) {
        return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
      }

      // Map segment status to booking status
      const statusMap: Record<string, string> = {
        PENDING: 'PENDING',
        RECEIVED_AT_POINT: 'RECEIVED_AT_POINT',
        ASSIGNED: 'ASSIGNED',
        PICKED_UP: 'PICKED_UP',
        IN_TRANSIT: 'IN_TRANSIT',
        OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
        HANDED_OFF: 'IN_TRANSIT',
        DELIVERED: 'DELIVERED',
      }

      const bookingStatus = statusMap[status] || status

      // Prepare update data
      const updateData: any = {
        status: bookingStatus,
      }

      // Assign captain if provided
      if (assignedCaptainId) {
        updateData.assignedCaptainId = assignedCaptainId
      }

      // Update booking
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
        include: {
          captain: {
            select: { id: true, name: true, phone: true },
          },
          pickupLocation: {
            select: { id: true, pointName: true, village: true },
          },
          dropLocation: {
            select: { id: true, pointName: true, village: true },
          },
        },
      })

      // Auto-create commission ledger entries for captain on delivery
      if (status === 'DELIVERED' && updatedBooking.assignedCaptainId) {
        // For direct bookings, use a default commission rate or look up by route
        const captainAmount = Number(updatedBooking.calculatedPrice) * 0.1 // 10% default
        if (captainAmount > 0) {
          await prisma.commissionLedger.create({
            data: {
              userId: updatedBooking.assignedCaptainId,
              bookingSegmentId: `direct-${updatedBooking.id}`,
              role: 'CAPTAIN',
              amount: captainAmount,
            },
          })
        }

        // Reset captain availability when direct booking is delivered
        await prisma.captainProfile.updateMany({
          where: { userId: updatedBooking.assignedCaptainId },
          data: { availabilityStatus: 'AVAILABLE' },
        })

        // Create PM commission for direct bookings on delivery (if not already created)
        const dropLocationPM = await prisma.pointManagerProfile.findFirst({
          where: { shopLocationId: updatedBooking.dropLocationId },
          select: { userId: true },
        })

        if (dropLocationPM) {
          // Check if PM commission already exists
          const existingCommission = await prisma.commissionLedger.findFirst({
            where: {
              bookingSegmentId: `direct-${updatedBooking.id}`,
              userId: dropLocationPM.userId,
              role: 'POINT_MANAGER',
            },
          })

          if (!existingCommission) {
            // Look up commission rule
            let commissionRule = await prisma.globalCommissionRule.findFirst({
              where: {
                OR: [
                  { vehicleType: updatedBooking.vehicleType ?? null },
                  { vehicleType: null },
                ],
                isActive: true,
              },
              orderBy: { vehicleType: 'desc' },
            })

            if (!commissionRule) {
              commissionRule = await prisma.globalCommissionRule.findFirst({
                where: { isActive: true },
                orderBy: { vehicleType: 'desc' },
              })
            }

            if (commissionRule) {
              const pmAmount = (Number(updatedBooking.calculatedPrice) * Number(commissionRule.pmCommissionPct)) / 100
              if (pmAmount > 0) {
                await prisma.commissionLedger.create({
                  data: {
                    userId: dropLocationPM.userId,
                    bookingSegmentId: `direct-${updatedBooking.id}`,
                    role: 'POINT_MANAGER',
                    amount: pmAmount,
                  },
                })
              }
            }
          }
        }
      }

      // Reset captain availability when direct booking is handed off (IN_TRANSIT)
      if (status === 'IN_TRANSIT' && updatedBooking.assignedCaptainId) {
        await prisma.captainProfile.updateMany({
          where: { userId: updatedBooking.assignedCaptainId },
          data: { availabilityStatus: 'AVAILABLE' },
        })
      }

      return NextResponse.json({ success: true, data: updatedBooking })
    }

    // Handle regular segment updates
    // Get current segment
    const currentSegment = await prisma.bookingSegment.findUnique({
      where: { id },
      include: {
        booking: true,
        routeSegment: true,
      },
    })

    if (!currentSegment) {
      return NextResponse.json({ success: false, error: 'Segment not found' }, { status: 404 })
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      PENDING: ['RECEIVED_AT_POINT', 'ASSIGNED'],
      RECEIVED_AT_POINT: ['ASSIGNED'],
      ASSIGNED: ['PICKED_UP'],
      PICKED_UP: ['IN_TRANSIT'],
      IN_TRANSIT: ['OUT_FOR_DELIVERY', 'HANDED_OFF'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'HANDED_OFF'],
      HANDED_OFF: ['DELIVERED'],
      DELIVERED: [],
    }

    const allowedTransitions = validTransitions[currentSegment.status] || []
    if (status !== currentSegment.status && !allowedTransitions.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status transition from ${currentSegment.status} to ${status}` },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      status,
    }

    // Add timestamps based on status
    if (status === 'HANDED_OFF') {
      updateData.handedOffAt = new Date()
    }
    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date()
    }

    // Update booking receiver phone if provided
    if (receiverPhone && status === 'RECEIVED_AT_POINT') {
      await prisma.booking.update({
        where: { id: currentSegment.bookingId },
        data: { receiverPhone },
      })
    }

    // Assign captain if provided, otherwise preserve existing
    if (assignedCaptainId) {
      updateData.assignedCaptainId = assignedCaptainId
    } else if (currentSegment.assignedCaptainId) {
      updateData.assignedCaptainId = currentSegment.assignedCaptainId
    }

    // Handle wallet payment if assigning captain and payment is pending
    if (assignedCaptainId && currentSegment.booking.paymentMethod === 'WALLET' as any && currentSegment.booking.paymentStatus === 'PENDING_PAYMENT' as any) {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: currentSegment.booking.customerId },
      })

      if (!wallet) {
        return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 })
      }

      if (Number(wallet.balance) < Number(currentSegment.booking.calculatedPrice)) {
        return NextResponse.json({ success: false, error: 'Insufficient wallet balance' }, { status: 400 })
      }

      // Debit wallet and update booking payment status
      const debitAmount = Number(currentSegment.booking.calculatedPrice)
      const balanceBefore = wallet.balance
      const balanceAfter = balanceBefore.minus(debitAmount)

      await prisma.$transaction([
        prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: balanceAfter },
        }),
        prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId: currentSegment.booking.customerId,
            type: 'BOOKING_PAYMENT',
            amount: debitAmount,
            balanceBefore,
            balanceAfter,
            description: `Payment for booking ${currentSegment.booking.bookingNumber}`,
            referenceId: currentSegment.booking.id,
            referenceType: 'BOOKING',
          },
        }),
        prisma.booking.update({
          where: { id: currentSegment.bookingId },
          data: {
            paymentStatus: 'PAID',
            paidAmount: debitAmount,
            paidAt: new Date(),
          },
        }),
      ])
    }

    // Update segment
    const updatedSegment = await prisma.bookingSegment.update({
      where: { id },
      data: updateData,
      include: {
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            status: true,
          },
        },
        routeSegment: {
          include: {
            fromLocation: {
              select: { id: true, pointName: true, village: true },
            },
            toLocation: {
              select: { id: true, pointName: true, village: true },
            },
          },
        },
        pointManager: {
          select: { id: true, name: true, phone: true },
        },
        captain: {
          select: { id: true, name: true, phone: true },
        },
      },
    })

    // Auto-create commission ledger entries
    if (status === 'ASSIGNED' && updatedSegment.assignedPointManagerId) {
      //console.log('[COMMISSION] Creating PM commission for segment:', updatedSegment.id, 'PM:', updatedSegment.assignedPointManagerId)
      //console.log('[COMMISSION] Segment vehicleType:', (updatedSegment as any).vehicleType)
      //console.log('[COMMISSION] Route segment ID:', updatedSegment.routeSegmentId)

      // Look up commission rule for this route segment + vehicle type
      let commissionRule = await prisma.routeCommissionRule.findFirst({
        where: {
          routeSegmentId: updatedSegment.routeSegmentId,
          OR: [
            { vehicleType: (updatedSegment as any).vehicleType ?? null },
            { vehicleType: null },
          ],
          isActive: true,
        },
        orderBy: { vehicleType: 'desc' }, // prefer specific vehicle type rule over null
      })

      //console.log('[COMMISSION] Route commission rule:', commissionRule)

      // Fallback to global commission rules if no route-specific rule found
      if (!commissionRule) {
        // First try with isActive filter and matching vehicle type
        const globalRule = await prisma.globalCommissionRule.findFirst({
          where: {
            OR: [
              { vehicleType: (updatedSegment as any).vehicleType ?? null },
              { vehicleType: null },
            ],
            isActive: true,
          },
          orderBy: { vehicleType: 'desc' },
        })
        //console.log('[COMMISSION] Global commission rule (active only, matching vehicleType):', globalRule)

        // If still null, fall back to ANY active global rule (for segments with null vehicleType)
        if (!globalRule) {
          const anyGlobalRule = await prisma.globalCommissionRule.findFirst({
            where: { isActive: true },
            orderBy: { vehicleType: 'desc' },
          })
          //console.log('[COMMISSION] Global commission rule (any active):', anyGlobalRule)
          commissionRule = anyGlobalRule as any
        } else {
          commissionRule = globalRule as any
        }
      }

      if (commissionRule) {
        const bookingPrice = Number((await prisma.booking.findUnique({
          where: { id: updatedSegment.bookingId },
          select: { calculatedPrice: true },
        }))?.calculatedPrice ?? 0)
        const pmAmount = (bookingPrice * Number(commissionRule.pmCommissionPct)) / 100
        //console.log('[COMMISSION] PM commission amount:', pmAmount, 'from booking price:', bookingPrice, 'rate:', commissionRule.pmCommissionPct)
        if (pmAmount > 0) {
          await prisma.commissionLedger.create({
            data: {
              userId: updatedSegment.assignedPointManagerId!,
              bookingSegmentId: updatedSegment.id,
              role: 'POINT_MANAGER',
              amount: pmAmount,
            },
          })
          //console.log('[COMMISSION] PM commission created successfully')
        } else {
          //console.log('[COMMISSION] PM commission amount is 0, skipping')
        }
      } else {
        //console.log('[COMMISSION] No commission rule found for PM')
      }
    } else {
      //console.log('[COMMISSION] PM commission not created - status:', status, 'assignedPM:', updatedSegment.assignedPointManagerId)
    }

    if (status === 'DELIVERED' && updatedSegment.assignedCaptainId) {
      //console.log('[COMMISSION] Creating Captain commission for segment:', updatedSegment.id, 'Captain:', updatedSegment.assignedCaptainId)
      let commissionRule = await prisma.routeCommissionRule.findFirst({
        where: {
          routeSegmentId: updatedSegment.routeSegmentId,
          OR: [
            { vehicleType: (updatedSegment as any).vehicleType ?? null },
            { vehicleType: null },
          ],
          isActive: true,
        },
        orderBy: { vehicleType: 'desc' },
      })

      //console.log('[COMMISSION] Route commission rule:', commissionRule)

      // Fallback to global commission rules if no route-specific rule found
      if (!commissionRule) {
        // First try with isActive filter and matching vehicle type
        const globalRule = await prisma.globalCommissionRule.findFirst({
          where: {
            OR: [
              { vehicleType: (updatedSegment as any).vehicleType ?? null },
              { vehicleType: null },
            ],
            isActive: true,
          },
          orderBy: { vehicleType: 'desc' },
        })
        //console.log('[COMMISSION] Global commission rule (active only, matching vehicleType):', globalRule)

        // If still null, fall back to ANY active global rule (for segments with null vehicleType)
        if (!globalRule) {
          const anyGlobalRule = await prisma.globalCommissionRule.findFirst({
            where: { isActive: true },
            orderBy: { vehicleType: 'desc' },
          })
          //console.log('[COMMISSION] Global commission rule (any active):', anyGlobalRule)
          commissionRule = anyGlobalRule as any
        } else {
          commissionRule = globalRule as any
        }
      }

      if (commissionRule) {
        const bookingPrice = Number((await prisma.booking.findUnique({
          where: { id: updatedSegment.bookingId },
          select: { calculatedPrice: true },
        }))?.calculatedPrice ?? 0)
        const captainAmount = (bookingPrice * Number(commissionRule.captainCommissionPct)) / 100
        //console.log('[COMMISSION] Captain commission amount:', captainAmount, 'from booking price:', bookingPrice, 'rate:', commissionRule.captainCommissionPct)
        if (captainAmount > 0) {
          await prisma.commissionLedger.create({
            data: {
              userId: updatedSegment.assignedCaptainId,
              bookingSegmentId: updatedSegment.id,
              role: 'CAPTAIN',
              amount: captainAmount,
            },
          })
          //console.log('[COMMISSION] Captain commission created successfully')
        } else {
          //console.log('[COMMISSION] Captain commission amount is 0, skipping')
        }

        // Create PM commission for segments that skip ASSIGNED status
        if (updatedSegment.assignedPointManagerId) {
          //console.log('[COMMISSION] Checking for existing PM commission for segment:', updatedSegment.id, 'PM:', updatedSegment.assignedPointManagerId)
          // Check if PM commission already exists
          const existingCommission = await prisma.commissionLedger.findFirst({
            where: {
              bookingSegmentId: updatedSegment.id,
              userId: updatedSegment.assignedPointManagerId,
              role: 'POINT_MANAGER',
            },
          })

          //console.log('[COMMISSION] Existing PM commission found:', existingCommission)
          if (!existingCommission) {
            //console.log('[COMMISSION] Creating PM commission for segment on DELIVERED:', updatedSegment.id, 'PM:', updatedSegment.assignedPointManagerId)
            const pmAmount = (bookingPrice * Number(commissionRule.pmCommissionPct)) / 100
            //console.log('[COMMISSION] PM commission amount:', pmAmount, 'from booking price:', bookingPrice, 'rate:', commissionRule.pmCommissionPct)
            if (pmAmount > 0) {
              await prisma.commissionLedger.create({
                data: {
                  userId: updatedSegment.assignedPointManagerId,
                  bookingSegmentId: updatedSegment.id,
                  role: 'POINT_MANAGER',
                  amount: pmAmount,
                },
              })
              //console.log('[COMMISSION] PM commission created successfully on DELIVERED')
            } else {
              //console.log('[COMMISSION] PM commission amount is 0, skipping')
            }
          } else {
            //console.log('[COMMISSION] PM commission already exists, skipping creation')
          }
        } else {
          //console.log('[COMMISSION] No assigned PM for segment, skipping PM commission')
        }
      } else {
        //console.log('[COMMISSION] No commission rule found for Captain')
      }
    } else {
      //console.log('[COMMISSION] Captain commission not created - status:', status, 'assignedCaptain:', updatedSegment.assignedCaptainId)
    }

    // Update booking status to reflect the highest segment status
    // This ensures the tracking timeline shows correct progress
    // DELIVERED is excluded - it requires OTP validation separately
    if (status !== 'DELIVERED') {
      const allSegments = await prisma.bookingSegment.findMany({
        where: { bookingId: currentSegment.bookingId },
        select: { status: true },
      })

      console.log('[BOOKING_STATUS_UPDATE] All segments:', allSegments.map(s => s.status))

      // Map segment statuses to booking statuses for priority
      const statusPriority: Record<string, number> = {
        PENDING: 0,
        RECEIVED_AT_POINT: 1,
        ASSIGNED: 2,
        PICKED_UP: 3,
        IN_TRANSIT: 4,
        OUT_FOR_DELIVERY: 5,
        HANDED_OFF: 4,
        DELIVERED: 6,
      }

      // Find the highest priority status among all segments
      const highestStatus = allSegments.reduce((highest, seg) => {
        const segPriority = statusPriority[seg.status] ?? 0
        const highestPriority = statusPriority[highest] ?? 0
        return segPriority > highestPriority ? seg.status : highest
      }, 'PENDING')

      console.log('[BOOKING_STATUS_UPDATE] Highest segment status:', highestStatus)

      // Map segment status to booking status
      const segmentToBookingStatus: Record<string, string> = {
        PENDING: 'PENDING',
        RECEIVED_AT_POINT: 'CONFIRMED',
        ASSIGNED: 'ASSIGNED',
        PICKED_UP: 'PICKED_UP',
        IN_TRANSIT: 'IN_TRANSIT',
        OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
        HANDED_OFF: 'IN_TRANSIT',
      }

      const bookingStatus = (segmentToBookingStatus[highestStatus] || highestStatus) as 'PENDING' | 'CONFIRMED' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
      console.log('[BOOKING_STATUS_UPDATE] Mapped booking status:', bookingStatus)

      await prisma.booking.update({
        where: { id: currentSegment.bookingId },
        data: { status: bookingStatus },
      })
      console.log('[BOOKING_STATUS_UPDATE] Booking status updated to:', bookingStatus)
    }

    // If handed off, update next segment to RECEIVED_AT_POINT
    if (status === 'HANDED_OFF') {
      const nextSegment = await prisma.bookingSegment.findFirst({
        where: {
          bookingId: currentSegment.bookingId,
          sequenceOrder: currentSegment.sequenceOrder + 1,
        },
      })

      if (nextSegment) {
        await prisma.bookingSegment.update({
          where: { id: nextSegment.id },
          data: { status: 'RECEIVED_AT_POINT' },
        })
      }

      // Reset captain availability when they hand off the parcel
      if (updatedSegment.assignedCaptainId) {
        await prisma.captainProfile.updateMany({
          where: { userId: updatedSegment.assignedCaptainId },
          data: { availabilityStatus: 'AVAILABLE' },
        })
      }
    }

    // Reset captain availability when segment is delivered
    if (status === 'DELIVERED' && updatedSegment.assignedCaptainId) {
      await prisma.captainProfile.updateMany({
        where: { userId: updatedSegment.assignedCaptainId },
        data: { availabilityStatus: 'AVAILABLE' },
      })
    }

    return NextResponse.json({ success: true, data: updatedSegment })
  } catch (err) {
    console.error('[BOOKINGS/SEGMENTS/[id]/PUT]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
