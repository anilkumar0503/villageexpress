import { describe, it, expect } from 'vitest'

/**
 * Mirrors the resolveCommission helper in
 * apps/web/app/api/bookings/segments/[id]/route.ts
 *
 * Rules:
 *  - Flat amount (captainCommissionFlat / pmCommissionFlat) takes priority over percentage
 *  - Falls back to percentage calculation when flat is null / undefined
 *  - Default captain pct = 10, default pm pct = 5
 */
function resolveCommission(
  rule: {
    captainCommissionFlat?: number | null
    captainCommissionPct?: number | null
    pmCommissionFlat?: number | null
    pmCommissionPct?: number | null
  },
  role: 'CAPTAIN' | 'POINT_MANAGER',
  bookingPrice: number
): number {
  if (role === 'CAPTAIN') {
    if (rule.captainCommissionFlat != null) return Number(rule.captainCommissionFlat)
    return (bookingPrice * Number(rule.captainCommissionPct ?? 10)) / 100
  }
  if (rule.pmCommissionFlat != null) return Number(rule.pmCommissionFlat)
  return (bookingPrice * Number(rule.pmCommissionPct ?? 5)) / 100
}

// ─── CAPTAIN ─────────────────────────────────────────────────────────────────

describe('resolveCommission – CAPTAIN', () => {
  it('returns flat amount when captainCommissionFlat is set', () => {
    const rule = { captainCommissionFlat: 6, captainCommissionPct: 10 }
    expect(resolveCommission(rule, 'CAPTAIN', 100)).toBe(6)
  })

  it('flat amount does NOT scale with booking price', () => {
    const rule = { captainCommissionFlat: 6 }
    expect(resolveCommission(rule, 'CAPTAIN', 30)).toBe(6)
    expect(resolveCommission(rule, 'CAPTAIN', 500)).toBe(6)
    expect(resolveCommission(rule, 'CAPTAIN', 1000)).toBe(6)
  })

  it('falls back to percentage when flat is null', () => {
    const rule = { captainCommissionFlat: null, captainCommissionPct: 10 }
    expect(resolveCommission(rule, 'CAPTAIN', 100)).toBe(10)
    expect(resolveCommission(rule, 'CAPTAIN', 60)).toBe(6)
  })

  it('falls back to percentage when flat is undefined', () => {
    const rule = { captainCommissionPct: 20 }
    expect(resolveCommission(rule, 'CAPTAIN', 100)).toBe(20)
  })

  it('defaults to 10% when no rule fields are provided', () => {
    expect(resolveCommission({}, 'CAPTAIN', 100)).toBe(10)
    expect(resolveCommission({}, 'CAPTAIN', 200)).toBe(20)
  })

  it('returns 0 flat when explicitly set to zero', () => {
    const rule = { captainCommissionFlat: 0 }
    expect(resolveCommission(rule, 'CAPTAIN', 500)).toBe(0)
  })
})

// ─── POINT_MANAGER ────────────────────────────────────────────────────────────

describe('resolveCommission – POINT_MANAGER', () => {
  it('returns flat amount when pmCommissionFlat is set', () => {
    const rule = { pmCommissionFlat: 6, pmCommissionPct: 5 }
    expect(resolveCommission(rule, 'POINT_MANAGER', 100)).toBe(6)
  })

  it('flat amount does NOT scale with booking price', () => {
    const rule = { pmCommissionFlat: 6 }
    expect(resolveCommission(rule, 'POINT_MANAGER', 30)).toBe(6)
    expect(resolveCommission(rule, 'POINT_MANAGER', 500)).toBe(6)
    expect(resolveCommission(rule, 'POINT_MANAGER', 1000)).toBe(6)
  })

  it('falls back to percentage when flat is null', () => {
    const rule = { pmCommissionFlat: null, pmCommissionPct: 5 }
    expect(resolveCommission(rule, 'POINT_MANAGER', 100)).toBe(5)
  })

  it('defaults to 5% when no rule fields are provided', () => {
    expect(resolveCommission({}, 'POINT_MANAGER', 100)).toBe(5)
    expect(resolveCommission({}, 'POINT_MANAGER', 200)).toBe(10)
  })
})

// ─── BOTH ROLES FLAT (primary use-case: ₹6 default) ──────────────────────────

describe('resolveCommission – ₹6 flat for both roles', () => {
  const rule = {
    captainCommissionFlat: 6,
    pmCommissionFlat: 6,
    captainCommissionPct: 10,
    pmCommissionPct: 5,
  }

  it('captain always gets ₹6 regardless of booking price', () => {
    for (const price of [20, 50, 100, 200, 500, 1000]) {
      expect(resolveCommission(rule, 'CAPTAIN', price)).toBe(6)
    }
  })

  it('point manager always gets ₹6 regardless of booking price', () => {
    for (const price of [20, 50, 100, 200, 500, 1000]) {
      expect(resolveCommission(rule, 'POINT_MANAGER', price)).toBe(6)
    }
  })

  it('captain and PM each get exactly ₹6 on a ₹30 order (small order)', () => {
    expect(resolveCommission(rule, 'CAPTAIN', 30)).toBe(6)
    expect(resolveCommission(rule, 'POINT_MANAGER', 30)).toBe(6)
  })
})

// ─── FLAT OVERRIDES PERCENTAGE ───────────────────────────────────────────────

describe('resolveCommission – flat overrides percentage (priority)', () => {
  it('captain flat of ₹3 beats 10% of ₹100 (which would be ₹10)', () => {
    const rule = { captainCommissionFlat: 3, captainCommissionPct: 10 }
    expect(resolveCommission(rule, 'CAPTAIN', 100)).toBe(3)
  })

  it('pm flat of ₹8 beats 5% of ₹200 (which would be ₹10)', () => {
    const rule = { pmCommissionFlat: 8, pmCommissionPct: 5 }
    expect(resolveCommission(rule, 'POINT_MANAGER', 200)).toBe(8)
  })

  it('percentage is used when flat is cleared to null', () => {
    const withFlat = { captainCommissionFlat: 6, captainCommissionPct: 10 }
    const withoutFlat = { captainCommissionFlat: null, captainCommissionPct: 10 }
    expect(resolveCommission(withFlat, 'CAPTAIN', 100)).toBe(6)
    expect(resolveCommission(withoutFlat, 'CAPTAIN', 100)).toBe(10)
  })
})
