import { prisma } from '@ve/db'
import { calculatePrice, type PriceCalculationResult } from '@ve/utils'

type PricingInput = {
  pickupLocationId: string
  dropLocationId: string
  parcelWeight: number
  deliveryPriority: string
  vehicleType?: string | null
}

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

export async function resolvePrice(input: PricingInput): Promise<PriceCalculationResult> {
  const { pickupLocationId, dropLocationId, parcelWeight, deliveryPriority, vehicleType } = input

  const [pickup, drop] = await Promise.all([
    prisma.location.findUnique({ where: { id: pickupLocationId } }),
    prisma.location.findUnique({ where: { id: dropLocationId } }),
  ])

  if (!pickup || !drop) throw new Error('Invalid pickup or drop location')

  // Build vehicle type filter: if specified, try matching type first, then null as fallback
  const vehicleTypeFilter = vehicleType
    ? { vehicleType: vehicleType as any }
    : {}

  // Build delivery priority filter
  const priorityFilter = { deliveryPriority: deliveryPriority as any }

  const rule =
    // 1st priority: exact route rule with matching vehicle type and priority
    (await prisma.pricingRule.findFirst({
      where: { sourceLocationId: pickupLocationId, destinationLocationId: dropLocationId, ...vehicleTypeFilter, ...priorityFilter },
    })) ??
    // 1b: exact route rule with null vehicle type (fallback if vehicle type specified)
    (vehicleType
      ? await prisma.pricingRule.findFirst({
          where: { sourceLocationId: pickupLocationId, destinationLocationId: dropLocationId, vehicleType: null, ...priorityFilter },
        })
      : null) ??
    // 2nd priority: source-only rule with matching vehicle type and priority
    (await prisma.pricingRule.findFirst({
      where: { sourceLocationId: pickupLocationId, destinationLocationId: null, ...vehicleTypeFilter, ...priorityFilter },
    })) ??
    // 2b: source-only rule with null vehicle type (fallback if vehicle type specified)
    (vehicleType
      ? await prisma.pricingRule.findFirst({
          where: { sourceLocationId: pickupLocationId, destinationLocationId: null, vehicleType: null, ...priorityFilter },
        })
      : null) ??
    // 3rd priority: global rule with matching vehicle type and priority
    (await prisma.pricingRule.findFirst({
      where: { sourceLocationId: null, destinationLocationId: null, ...vehicleTypeFilter, ...priorityFilter },
      orderBy: { createdAt: 'desc' },
    })) ??
    // 3b: global rule with null vehicle type (fallback if vehicle type specified)
    (vehicleType
      ? await prisma.pricingRule.findFirst({
          where: { sourceLocationId: null, destinationLocationId: null, vehicleType: null, ...priorityFilter },
          orderBy: { createdAt: 'desc' },
        })
      : null)

  if (!rule) {
    throw new Error('No pricing rule found. Please contact support.')
  }

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

  // If no vehicle config or no vehicle type, use default weight of 5kg (bike)
  const defaultWeight = vehicleConfig?.defaultWeight ?? 5
  const maxWeight = vehicleConfig?.maxWeight ?? 50

  // Validate parcel weight against vehicle max weight
  if (parcelWeight > maxWeight) {
    throw new Error(
      `Parcel weight ${parcelWeight}kg exceeds maximum allowed weight of ${maxWeight}kg for ${vehicleType || 'selected vehicle'}`,
    )
  }

  // Calculate weight surcharge: if parcel weight > defaultWeight, apply surcharge
  const weightSurcharge = parcelWeight > defaultWeight ? Number((rule as any).weightSurcharge ?? 0) : 0

  // First calculate the distance
  const distanceResult = await calculatePrice({
    pickupLat: Number(pickup.latitude),
    pickupLon: Number(pickup.longitude),
    dropLat: Number(drop.latitude),
    dropLon: Number(drop.longitude),
    parcelWeight,
    deliveryPriority,
    pricingRule: {
      basePrice: Number(rule.basePrice),
      pricePerKm: Number(rule.pricePerKm),
      estimatedDeliveryDays: rule.estimatedDeliveryDays,
      weightSurcharge,
    },
  })
  
  const distanceKm = distanceResult.distanceKm
  
  // Calculate progressive distance cost using distance tiers if available
  let distanceCost = 0
  if (vehicleConfig && vehicleConfig.distanceTiers.length > 0) {
    const tiers = vehicleConfig.distanceTiers.map((tier: any) => ({
      minDistance: Number(tier.minDistance),
      maxDistance: Number(tier.maxDistance),
      pricePerKm: Number(tier.pricePerKm),
    }))
    distanceCost = calculateProgressiveDistanceCost(distanceKm, tiers, Number(rule.pricePerKm))
  } else {
    distanceCost = distanceKm * Number(rule.pricePerKm)
  }

  // Return result with progressive distance cost
  const multiplier = deliveryPriority === 'EXPRESS' ? 1.5 : deliveryPriority === 'OVERNIGHT' ? 2.0 : 1.0
  const priorityCharge = Number(rule.basePrice) * (multiplier - 1)
  
  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    basePrice: Number(rule.basePrice),
    distanceCharge: Math.round(distanceCost * 100) / 100,
    priorityCharge: Math.round(priorityCharge * 100) / 100,
    weightSurcharge: Math.round(weightSurcharge * 100) / 100,
    ruralSurcharge: 0,
    finalPrice: Math.round((Number(rule.basePrice) + distanceCost + priorityCharge + weightSurcharge) * 100) / 100,
    estimatedDeliveryDays: rule.estimatedDeliveryDays,
  }
}

export async function autoAssignPointManager(pickupLocationId: string): Promise<string | null> {
  const profile = await prisma.pointManagerProfile.findUnique({
    where: { shopLocationId: pickupLocationId },
    include: { user: { select: { id: true, isActive: true, approvalStatus: true } } },
  })

  if (profile?.user?.isActive && profile.user.approvalStatus === 'APPROVED') {
    return profile.user.id
  }

  return null
}
