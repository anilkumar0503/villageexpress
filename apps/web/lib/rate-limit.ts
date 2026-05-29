const otpAttempts = new Map<string, { count: number; resetAt: number }>()

export function checkOtpRateLimit(phone: string): { allowed: boolean; remaining: number } {
  // Disable rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return { allowed: true, remaining: 999 }
  }

  const now = Date.now()
  const record = otpAttempts.get(phone)

  if (!record || now > record.resetAt) {
    otpAttempts.set(phone, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return { allowed: true, remaining: 2 }
  }

  if (record.count >= 3) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: 3 - record.count }
}

export function resetOtpRateLimit(phone: string): void {
  otpAttempts.delete(phone)
}
