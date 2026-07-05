export type DaySchedule = {
  isOpen: boolean
  openTime: string  // "HH:mm" 24-hour
  closeTime: string // "HH:mm" 24-hour
}

export type WorkingHours = {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  monday:    { isOpen: true,  openTime: '09:00', closeTime: '18:00' },
  tuesday:   { isOpen: true,  openTime: '09:00', closeTime: '18:00' },
  wednesday: { isOpen: true,  openTime: '09:00', closeTime: '18:00' },
  thursday:  { isOpen: true,  openTime: '09:00', closeTime: '18:00' },
  friday:    { isOpen: true,  openTime: '09:00', closeTime: '18:00' },
  saturday:  { isOpen: true,  openTime: '09:00', closeTime: '13:00' },
  sunday:    { isOpen: false, openTime: '09:00', closeTime: '18:00' },
}

/** Returns current weekday and time components in IST (Asia/Kolkata). */
function getISTComponents(): { day: DayOfWeek; hours: number; minutes: number } {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now)

  const weekday = (parts.find((p) => p.type === 'weekday')?.value ?? 'Monday').toLowerCase() as DayOfWeek
  const hours = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minutes = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return { day: weekday, hours, minutes }
}

export type OpenStatus = {
  open: boolean
  reason?: string
  /** Current day schedule, if available */
  todaySchedule?: DaySchedule
}

/**
 * Determines whether the point is currently accepting orders.
 * If workingHours is null/undefined the point is considered always open.
 */
export function isPointOpen(workingHours: WorkingHours | null | undefined): OpenStatus {
  if (!workingHours) return { open: true }

  const { day, hours, minutes } = getISTComponents()
  const schedule = workingHours[day]

  if (!schedule) return { open: true }

  if (!schedule.isOpen) {
    return { open: false, reason: `Closed on ${DAY_LABELS[day]}`, todaySchedule: schedule }
  }

  const [openH, openM] = schedule.openTime.split(':').map(Number)
  const [closeH, closeM] = schedule.closeTime.split(':').map(Number)
  const nowMinutes = hours * 60 + minutes
  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM

  if (nowMinutes < openMinutes) {
    return { open: false, reason: `Opens at ${schedule.openTime}`, todaySchedule: schedule }
  }
  if (nowMinutes >= closeMinutes) {
    return { open: false, reason: `Closed at ${schedule.closeTime}`, todaySchedule: schedule }
  }

  return { open: true, todaySchedule: schedule }
}

/** Formats "09:00" → "9:00 AM", "18:00" → "6:00 PM" */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}
