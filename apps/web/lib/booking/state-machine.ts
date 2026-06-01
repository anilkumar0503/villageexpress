import type { BookingStatus } from '@ve/db'

type Transition = {
  from: BookingStatus[]
  requiredPermission: string
}

export const STATUS_TRANSITIONS: Record<BookingStatus, Transition> = {
  CONFIRMED: {
    from: ['PENDING'],
    requiredPermission: 'booking:update_status',
  },
  PAYMENT_FAILED: {
    from: ['PENDING'],
    requiredPermission: 'booking:update_status',
  },
  RECEIVED_AT_POINT: {
    from: ['CONFIRMED'],
    requiredPermission: 'booking:update_status',
  },
  ASSIGNED: {
    from: ['RECEIVED_AT_POINT'],
    requiredPermission: 'booking:assign_captain',
  },
  PICKED_UP: {
    from: ['ASSIGNED'],
    requiredPermission: 'booking:update_status',
  },
  IN_TRANSIT: {
    from: ['PICKED_UP'],
    requiredPermission: 'booking:update_status',
  },
  OUT_FOR_DELIVERY: {
    from: ['IN_TRANSIT'],
    requiredPermission: 'booking:update_status',
  },
  DELIVERED: {
    from: ['OUT_FOR_DELIVERY'],
    requiredPermission: 'booking:update_status',
  },
  CANCELLED: {
    from: ['PENDING', 'CONFIRMED', 'ASSIGNED'],
    requiredPermission: 'booking:update_status',
  },
  RETURN_INITIATED: {
    from: ['OUT_FOR_DELIVERY', 'DELIVERED'],
    requiredPermission: 'booking:update_status',
  },
  RETURNED: {
    from: ['RETURN_INITIATED'],
    requiredPermission: 'booking:update_status',
  },
  PENDING: {
    from: [],
    requiredPermission: '',
  },
}

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  const transition = STATUS_TRANSITIONS[to]
  if (!transition) return false
  return transition.from.includes(from)
}

export function getRequiredPermission(to: BookingStatus): string {
  return STATUS_TRANSITIONS[to]?.requiredPermission ?? 'booking:update_status'
}
