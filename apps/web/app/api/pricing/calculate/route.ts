import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { resolvePrice } from '@/lib/booking/pricing-service'

const schema = z.object({
  pickupLocationId: z.string().uuid(),
  dropLocationId: z.string().uuid(),
  parcelWeight: z.number().positive(),
  deliveryPriority: z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT']).default('STANDARD'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { pickupLocationId, dropLocationId, parcelWeight, deliveryPriority } = parsed.data

    if (pickupLocationId === dropLocationId) {
      return NextResponse.json(
        { success: false, error: 'Pickup and drop locations cannot be the same' },
        { status: 400 },
      )
    }

    const result = await resolvePrice({
      pickupLocationId,
      dropLocationId,
      parcelWeight,
      deliveryPriority,
    })

    return NextResponse.json({
      success: true,
      data: {
        finalPrice: result.finalPrice,
        basePrice: result.basePrice,
        priorityCharge: result.priorityCharge,
        estimatedDeliveryDays: result.estimatedDeliveryDays,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[PRICING/CALCULATE]', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
