export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type PaginatedResponse<T> = ApiResponse<{
  items: T[]
  total: number
  page: number
  pageSize: number
}>

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'FRANCHISE_OWNER'
  | 'POINT_MANAGER'
  | 'CAPTAIN'
  | 'CUSTOMER'

export type BookingStatusType =
  | 'PENDING'
  | 'PAYMENT_FAILED'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_INITIATED'
  | 'RETURNED'

export type NotificationEvent =
  | 'REGISTRATION_SUBMITTED'
  | 'REGISTRATION_APPROVED'
  | 'REGISTRATION_REJECTED'
  | 'OTP_SENT'
  | 'BOOKING_CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'CAPTAIN_ASSIGNED'
  | 'BOOKING_PICKED_UP'
  | 'BOOKING_DELIVERED'
  | 'BOOKING_CANCELLED'
  | 'NEW_BOOKING_ROUTED'
  | 'NEW_PENDING_APPROVAL'
  | 'PRICING_RULE_MISSING'
