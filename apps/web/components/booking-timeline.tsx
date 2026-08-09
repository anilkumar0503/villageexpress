'use client'

const STATUS_ORDER = [
  'PENDING', 'CONFIRMED', 'RECEIVED_AT_POINT', 'ASSIGNED',
  'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED',
]

const STEPS = [
  { status: 'RECEIVED_AT_POINT', label: 'At Pickup' },
  { status: 'ASSIGNED',          label: 'Assigned'  },
  { status: 'PICKED_UP',         label: 'Picked Up' },
  { status: 'IN_TRANSIT',        label: 'In Transit' },
  { status: 'OUT_FOR_DELIVERY',  label: 'Out for Delivery' },
  { status: 'DELIVERED',         label: 'Delivered' },
]

interface BookingTimelineProps {
  booking: {
    status: string
    createdAt?: string | Date
    paidAt?: string | Date | null
    paymentStatus?: string
  }
  segments?: Array<{
    status: string
    handedOffAt?: string | Date | null
    deliveredAt?: string | Date | null
    routeSegment: {
      fromLocation: { pointName: string }
      toLocation: { pointName: string }
    }
  }>
  compact?: boolean
}

export function BookingTimeline({ booking }: BookingTimelineProps) {
  const isCancelled = booking.status === 'CANCELLED'
  const currentOrderIdx = STATUS_ORDER.indexOf(booking.status)

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">Order Status</p>
      {isCancelled ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Cancelled
        </span>
      ) : (
        <div className="flex items-end overflow-x-auto pb-1">
          {STEPS.map((step, idx) => {
            const stepOrderIdx = STATUS_ORDER.indexOf(step.status)
            const isCompleted = currentOrderIdx > stepOrderIdx
            const isCurrent = currentOrderIdx === stepOrderIdx
            const isLast = idx === STEPS.length - 1

            return (
              <div key={step.status} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <span className={`text-[10px] whitespace-nowrap leading-none ${
                    isCompleted
                      ? 'text-green-600 font-medium'
                      : isCurrent
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground/50'
                  }`}>
                    {step.label}
                  </span>
                  <div className={`h-2 w-2 rounded-full ${
                    isCompleted
                      ? 'bg-green-500'
                      : isCurrent
                      ? 'bg-primary ring-2 ring-primary/30'
                      : 'bg-muted-foreground/25'
                  }`} />
                </div>
                {!isLast && (
                  <div className={`h-0.5 w-5 mx-0.5 self-end mb-[3px] flex-shrink-0 ${
                    isCompleted ? 'bg-green-300' : 'bg-muted-foreground/15'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
