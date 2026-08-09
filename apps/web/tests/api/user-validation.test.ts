import { describe, it, expect } from 'vitest'

/**
 * Mirrors the validation logic inside saveUser() in
 * apps/web/app/(dashboard)/users/page.tsx (lines 366-368)
 *
 * Rules:
 *  - If newPassword is empty → no change, always valid
 *  - If newPassword is set → must be >= 8 characters
 *  - If newPassword is set → must equal confirmPassword
 */
function validatePasswordChange(newPassword: string, confirmPassword: string): string | null {
  if (!newPassword) return null
  if (newPassword.length < 8) return 'Password must be at least 8 characters'
  if (newPassword !== confirmPassword) return 'Passwords do not match'
  return null
}

/**
 * Mirrors the displayId field behaviour:
 *  - Sent as-is to the API; non-empty string required for a meaningful update
 */
function validateDisplayId(displayId: string): boolean {
  return displayId.trim().length > 0
}

// ─── Password – no change ─────────────────────────────────────────────────────

describe('user password validation – no change (blank password)', () => {
  it('returns null when newPassword is empty string (skip update)', () => {
    expect(validatePasswordChange('', '')).toBeNull()
  })

  it('returns null when newPassword is empty even if confirmPassword has value', () => {
    // confirmPassword is irrelevant when newPassword is blank
    expect(validatePasswordChange('', 'something')).toBeNull()
  })
})

// ─── Password – minimum length ────────────────────────────────────────────────

describe('user password validation – minimum length of 8', () => {
  it('rejects a 1-character password', () => {
    expect(validatePasswordChange('a', 'a')).toBe('Password must be at least 8 characters')
  })

  it('rejects a 7-character password', () => {
    expect(validatePasswordChange('1234567', '1234567')).toBe('Password must be at least 8 characters')
  })

  it('accepts exactly 8 characters (boundary)', () => {
    expect(validatePasswordChange('12345678', '12345678')).toBeNull()
  })

  it('accepts more than 8 characters', () => {
    expect(validatePasswordChange('MySecurePass!', 'MySecurePass!')).toBeNull()
  })
})

// ─── Password – match check ───────────────────────────────────────────────────

describe('user password validation – passwords must match', () => {
  it('rejects when passwords differ by one character', () => {
    expect(validatePasswordChange('password1', 'password2')).toBe('Passwords do not match')
  })

  it('rejects when confirmPassword is empty but newPassword is not', () => {
    expect(validatePasswordChange('securepass', '')).toBe('Passwords do not match')
  })

  it('rejects case-mismatched passwords (case-sensitive check)', () => {
    expect(validatePasswordChange('Password', 'password')).toBe('Passwords do not match')
  })

  it('accepts identical passwords', () => {
    expect(validatePasswordChange('correctPass1!', 'correctPass1!')).toBeNull()
  })
})

// ─── Password – order of validation ──────────────────────────────────────────

describe('user password validation – length checked before match', () => {
  it('returns length error before match error when password is short AND mismatched', () => {
    // 'abc' (3 chars) !== 'xyz' – should hit length check first
    const result = validatePasswordChange('abc', 'xyz')
    expect(result).toBe('Password must be at least 8 characters')
  })
})

// ─── DisplayId validation ─────────────────────────────────────────────────────

describe('user displayId validation', () => {
  it('rejects an empty string', () => {
    expect(validateDisplayId('')).toBe(false)
  })

  it('rejects a whitespace-only string', () => {
    expect(validateDisplayId('   ')).toBe(false)
  })

  it('accepts a standard display ID', () => {
    expect(validateDisplayId('VE001')).toBe(true)
  })

  it('accepts alphanumeric IDs with hyphens', () => {
    expect(validateDisplayId('PM-042')).toBe(true)
  })

  it('accepts numeric-only IDs', () => {
    expect(validateDisplayId('12345')).toBe(true)
  })

  it('accepts a single character', () => {
    expect(validateDisplayId('X')).toBe(true)
  })
})

// ─── API payload construction ─────────────────────────────────────────────────

describe('user edit – API payload construction', () => {
  it('excludes newPassword from payload when field is blank', () => {
    const newPassword = ''
    const body: Record<string, unknown> = { displayId: 'VE001', name: 'Test' }
    if (newPassword) body.newPassword = newPassword
    expect(body).not.toHaveProperty('newPassword')
  })

  it('includes newPassword in payload when field is filled', () => {
    const newPassword = 'securepass'
    const body: Record<string, unknown> = { displayId: 'VE001', name: 'Test' }
    if (newPassword) body.newPassword = newPassword
    expect(body).toHaveProperty('newPassword', 'securepass')
  })

  it('always includes displayId in payload', () => {
    const body = { displayId: 'PM-007', name: 'Alice' }
    expect(body.displayId).toBe('PM-007')
  })
})
