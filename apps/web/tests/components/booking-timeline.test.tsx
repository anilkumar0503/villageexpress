import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BookingTimeline } from '@/components/booking-timeline'

const ALL_STEP_LABELS = ['At Pickup', 'Assigned', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered']

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('BookingTimeline – rendering', () => {
  it('renders the "Order Status" heading', () => {
    render(<BookingTimeline booking={{ status: 'PENDING' }} />)
    expect(screen.getByText('Order Status')).toBeDefined()
  })

  it('renders all 6 step labels for a non-cancelled booking', () => {
    render(<BookingTimeline booking={{ status: 'PENDING' }} />)
    for (const label of ALL_STEP_LABELS) {
      expect(screen.getByText(label)).toBeDefined()
    }
  })

  it('does NOT render step labels when booking is CANCELLED', () => {
    render(<BookingTimeline booking={{ status: 'CANCELLED' }} />)
    for (const label of ALL_STEP_LABELS) {
      expect(screen.queryByText(label)).toBeNull()
    }
  })

  it('renders "Cancelled" pill for CANCELLED status', () => {
    render(<BookingTimeline booking={{ status: 'CANCELLED' }} />)
    expect(screen.getByText('Cancelled')).toBeDefined()
  })

  it('does NOT render "Cancelled" pill for active statuses', () => {
    render(<BookingTimeline booking={{ status: 'DELIVERED' }} />)
    expect(screen.queryByText('Cancelled')).toBeNull()
  })
})

// ─── Each status renders without crashing ────────────────────────────────────

describe('BookingTimeline – renders without error for every status', () => {
  const statuses = [
    'PENDING',
    'CONFIRMED',
    'RECEIVED_AT_POINT',
    'ASSIGNED',
    'PICKED_UP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ]

  for (const status of statuses) {
    it(`status: ${status}`, () => {
      const { unmount } = render(<BookingTimeline booking={{ status }} />)
      expect(screen.getByText('Order Status')).toBeDefined()
      unmount()
    })
  }
})

// ─── Optional props don't break rendering ────────────────────────────────────

describe('BookingTimeline – optional props', () => {
  it('accepts createdAt as an ISO string', () => {
    render(<BookingTimeline booking={{ status: 'ASSIGNED', createdAt: '2024-01-01T00:00:00Z' }} />)
    expect(screen.getByText('Order Status')).toBeDefined()
  })

  it('accepts createdAt as a Date object', () => {
    render(<BookingTimeline booking={{ status: 'IN_TRANSIT', createdAt: new Date() }} />)
    expect(screen.getByText('Order Status')).toBeDefined()
  })

  it('accepts undefined paidAt without error', () => {
    render(<BookingTimeline booking={{ status: 'DELIVERED', paidAt: undefined }} />)
    expect(screen.getByText('Order Status')).toBeDefined()
  })

  it('accepts null paidAt without error', () => {
    render(<BookingTimeline booking={{ status: 'DELIVERED', paidAt: null }} />)
    expect(screen.getByText('Order Status')).toBeDefined()
  })

  it('accepts paymentStatus without error', () => {
    render(<BookingTimeline booking={{ status: 'CONFIRMED', paymentStatus: 'PAID' }} />)
    expect(screen.getByText('Order Status')).toBeDefined()
  })

  it('accepts segments prop without error', () => {
    render(
      <BookingTimeline
        booking={{ status: 'IN_TRANSIT' }}
        segments={[
          {
            status: 'IN_TRANSIT',
            routeSegment: {
              fromLocation: { pointName: 'Karimnagar' },
              toLocation: { pointName: 'Hyderabad' },
            },
          },
        ]}
      />
    )
    expect(screen.getByText('Order Status')).toBeDefined()
  })

  it('accepts compact prop without error', () => {
    render(<BookingTimeline booking={{ status: 'PICKED_UP' }} compact={true} />)
    expect(screen.getByText('Order Status')).toBeDefined()
  })
})

// ─── Step count ───────────────────────────────────────────────────────────────

describe('BookingTimeline – step count', () => {
  it('renders exactly 6 step labels', () => {
    const { container } = render(<BookingTimeline booking={{ status: 'PENDING' }} />)
    // Each step label appears once
    const found = ALL_STEP_LABELS.filter(
      (label) => container.textContent?.includes(label)
    )
    expect(found).toHaveLength(6)
  })
})
