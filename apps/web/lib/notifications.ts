import { prisma } from '@ve/db'

export async function sendNotification(userId: string, type: string, title: string, message: string, bookingId?: string) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        bookingId,
      },
    })
  } catch (error) {
    console.error('[SEND_NOTIFICATION]', error)
  }
}

export async function sendBookingStatusNotification(bookingId: string, status: string, userId: string) {
  const statusMessages: Record<string, { title: string; message: string }> = {
    CONFIRMED: {
      title: 'Booking Confirmed',
      message: 'Your booking has been confirmed and is being processed.',
    },
    ASSIGNED: {
      title: 'Captain Assigned',
      message: 'A captain has been assigned to your booking.',
    },
    PICKED_UP: {
      title: 'Parcel Picked Up',
      message: 'Your parcel has been picked up and is on the way.',
    },
    IN_TRANSIT: {
      title: 'In Transit',
      message: 'Your parcel is in transit to the destination.',
    },
    OUT_FOR_DELIVERY: {
      title: 'Out for Delivery',
      message: 'Your parcel is out for delivery.',
    },
    DELIVERED: {
      title: 'Delivered',
      message: 'Your parcel has been delivered successfully!',
    },
    CANCELLED: {
      title: 'Booking Cancelled',
      message: 'Your booking has been cancelled.',
    },
  }

  const notification = statusMessages[status]
  if (notification) {
    await sendNotification(userId, 'BOOKING_STATUS', notification.title, notification.message, bookingId)
  }
}
