import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'
import { resolvePrice } from '@/lib/booking/pricing-service'

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

const schema = z.object({
  pickupLocationId: z.string().uuid(),
  dropLocationId: z.string().uuid(),
  parcelWeight: z.number().positive(),
  deliveryPriority: z.string().default('STANDARD'),
  routeId: z.string().uuid().optional(),
  vehicleType: z.enum(['BIKE', 'AUTO', 'MINI_VAN', 'VAN']).nullable().optional(),
})

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
    }

    const { pickupLocationId, dropLocationId, parcelWeight, deliveryPriority, routeId, vehicleType } = parsed.data

    // If a route is selected, use its RoutePricingRule (same logic as booking creation)
    if (routeId) {
      const route = await prisma.route.findUnique({
        where: { id: routeId, isActive: true },
        include: {
          segments: true,
          pricingRules: { where: { isActive: true } },
        },
      })

      if (route && route.pricingRules.length > 0) {
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

        const defaultWeight = Number(vehicleConfig?.defaultWeight ?? 5)
        const maxWeight = Number(vehicleConfig?.maxWeight ?? 50)

        // Validate parcel weight against vehicle max weight
        if (parcelWeight > maxWeight) {
          return NextResponse.json({
            success: false,
            error: `Parcel weight ${parcelWeight}kg exceeds maximum allowed weight of ${maxWeight}kg for ${vehicleType || 'selected vehicle'}`,
          }, { status: 400 })
        }

        const matchingRule = route.pricingRules.find(
          (rule: any) =>
            rule.priority === deliveryPriority &&
            (vehicleType ? rule.vehicleType === vehicleType : rule.vehicleType === null),
        )

        if (matchingRule) {
          const totalDistance = route.segments.reduce((sum: number, seg: any) => sum + Number(seg.distanceKm), 0)
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
          const finalPrice = Number(matchingRule.basePrice) + distanceCost + priorityCharge + weightSurcharge
          const estimatedTimeHours = deliveryPriority === 'EXPRESS' ? 2 : deliveryPriority === 'OVERNIGHT' ? 24 : 4

          return NextResponse.json({
            success: true,
            data: {
              finalPrice,
              estimatedDeliveryDays: route.estimatedDays,
              estimatedDeliveryHours: estimatedTimeHours,
              source: 'route',
              breakdown: {
                basePrice: Number(matchingRule.basePrice),
                distanceCost: Math.round(distanceCost * 100) / 100,
                priorityCharge: Math.round(priorityCharge * 100) / 100,
                weightSurcharge: Math.round(weightSurcharge * 100) / 100,
                totalDistance,
              },
            },
          })
        }

        // Route has rules but none match — fall back to global pricing
        // Don't return error, let it fall through to resolvePrice below
      }
    }

    // Fallback: global/location-based pricing (no route selected or route has no rules)
    const result = await resolvePrice({ pickupLocationId, dropLocationId, parcelWeight, deliveryPriority, vehicleType })
    const estimatedTimeHours = deliveryPriority === 'EXPRESS' ? 2 : deliveryPriority === 'OVERNIGHT' ? 24 : 4
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        estimatedDeliveryHours: estimatedTimeHours,
        source: 'global',
        breakdown: {
          basePrice: result.basePrice,
          distanceCost: result.distanceCharge,
          priorityCharge: result.priorityCharge,
          weightSurcharge: result.weightSurcharge,
          totalDistance: result.distanceKm,
        },
      }
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not calculate price'
    return NextResponse.json({ success: false, error: message }, { status: 422 })
  }
}
