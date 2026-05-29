import { calculateDistance } from './haversine'

const PRIORITY_MULTIPLIER: Record<string, number> = {
  STANDARD: 1.0,
  EXPRESS: 1.5,
  OVERNIGHT: 2.0,
}

export type PricingRule = {
  basePrice: number
  pricePerKm: number
  estimatedDeliveryDays: number
  weightSurcharge?: number
}

export type PriceCalculationInput = {
  pickupLat: number
  pickupLon: number
  dropLat: number
  dropLon: number
  parcelWeight: number
  deliveryPriority: string
  pricingRule: PricingRule
  ruralSurcharge?: number
}

export type PriceCalculationResult = {
  distanceKm: number
  basePrice: number
  distanceCharge: number
  priorityCharge: number
  weightSurcharge: number
  ruralSurcharge: number
  finalPrice: number
  estimatedDeliveryDays: number
}

export async function calculatePrice(input: PriceCalculationInput): Promise<PriceCalculationResult> {
  const { pickupLat, pickupLon, dropLat, dropLon, parcelWeight, deliveryPriority, pricingRule, ruralSurcharge = 0 } = input

  const distanceKm = await calculateDistance(pickupLat, pickupLon, dropLat, dropLon)
  const multiplier = PRIORITY_MULTIPLIER[deliveryPriority] ?? 1.0

  const basePrice = Number(pricingRule.basePrice)
  const distanceCharge = distanceKm * Number(pricingRule.pricePerKm)
  const priorityCharge = basePrice * (multiplier - 1)
  const weightSurcharge = Number(pricingRule.weightSurcharge ?? 0)

  const finalPrice = basePrice + distanceCharge + priorityCharge + weightSurcharge + ruralSurcharge

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    basePrice,
    distanceCharge: Math.round(distanceCharge * 100) / 100,
    priorityCharge: Math.round(priorityCharge * 100) / 100,
    weightSurcharge: Math.round(weightSurcharge * 100) / 100,
    ruralSurcharge,
    finalPrice: Math.round(finalPrice * 100) / 100,
    estimatedDeliveryDays: pricingRule.estimatedDeliveryDays,
  }
}

export function generateBookingNumber(): string {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')
  return `VE-BK-${yy}${mm}${dd}-${seq}`
}

const rolePrefixMap: Record<string, string> = {
  SUPER_ADMIN: 'VE-SA-',
  ADMIN: 'VE-AD-',
  FRANCHISE_OWNER: 'VE-FO-',
  POINT_MANAGER: 'VE-PM-',
  CAPTAIN: 'VE-CAP-',
  CUSTOMER: 'VE-CUST-',
}

export function generateDisplayId(roleName: string, sequence: number): string {
  const prefix = rolePrefixMap[roleName] ?? 'VE-USR-'
  return `${prefix}${String(sequence).padStart(4, '0')}`
}
