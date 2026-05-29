'use client'

import { CheckCircle2, Circle, Clock, Package, Truck, MapPin, CheckCircle } from 'lucide-react'

type TimelineStep = {
  key: string
  label: string
  icon: React.ElementType
  completed: boolean
  current: boolean
  timestamp?: Date | string | null
}

interface BookingTimelineProps {
  booking: {
    status: string
    createdAt: string | Date
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

export function BookingTimeline({ booking, segments = [], compact = false }: BookingTimelineProps) {
  const getSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = [
      {
        key: 'created',
        label: 'Booked',
        icon: Package,
        completed: true,
        current: false,
        timestamp: booking.createdAt,
      },
    ]

    if (booking.paidAt || booking.paymentStatus === 'PAID') {
      steps.push({
        key: 'paid',
        label: 'Payment',
        icon: CheckCircle,
        completed: true,
        current: false,
        timestamp: booking.paidAt,
      })
    }

    // Check if any segment is delivered
    const isDelivered = segments.some(s => s.status === 'DELIVERED')
    const lastDeliveredSegment = segments.find(s => s.status === 'DELIVERED')

    if (isDelivered && lastDeliveredSegment) {
      steps.push({
        key: 'delivered',
        label: 'Delivered',
        icon: CheckCircle2,
        completed: true,
        current: false,
        timestamp: lastDeliveredSegment.deliveredAt,
      })
    }

    return steps
  }

  const steps = getSteps()
  const currentStepIndex = steps.findIndex((s) => s.current)

  const formatTimestamp = (timestamp?: Date | string | null) => {
    if (!timestamp) return null
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
      return date.toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return null
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Live Tracking</p>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((step, idx) => {
          const Icon = step.icon
          const isCompleted = step.completed
          const isCurrent = step.current
          const isPending = !isCompleted && !isCurrent
          const timestamp = formatTimestamp(step.timestamp)

          return (
            <div key={step.key} className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`rounded-full p-1.5 ${
                  isCompleted
                    ? 'bg-green-100 text-green-600'
                    : isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="h-3 w-3" />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-xs font-medium whitespace-nowrap ${
                    isCompleted ? 'text-foreground' : isCurrent ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </p>
                {timestamp && (
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{timestamp}</p>
                )}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-0.5 w-8 flex-shrink-0 ${
                    isCompleted ? 'bg-green-200' : isCurrent ? 'bg-primary/30' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
