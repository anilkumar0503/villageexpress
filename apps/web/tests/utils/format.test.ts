import { describe, it, expect } from 'vitest'

describe('Format Utilities', () => {
  it('should format currency correctly', () => {
    const amount = 1234.56
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount)
    
    expect(formatted).toBe('₹1,234.56')
  })

  it('should format date correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z')
    const formatted = new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
    
    expect(formatted).toBeDefined()
    expect(typeof formatted).toBe('string')
  })

  it('should handle zero values', () => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(0)
    
    expect(formatted).toBe('₹0.00')
  })
})
