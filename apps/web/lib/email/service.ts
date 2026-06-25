// Email service for sending transactional emails
// This is a placeholder implementation that can be integrated with email providers like SendGrid, Resend, or AWS SES

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
}

export interface BookingConfirmationEmailData {
  bookingNumber: string
  customerName: string
  customerEmail: string
  pickupLocation: string
  dropLocation: string
  scheduledDate?: string
  timeSlot?: string
  estimatedPrice: number
  deliveryPriority: string
}

export interface DeliveryConfirmationEmailData {
  bookingNumber: string
  customerName: string
  customerEmail: string
  deliveredAt: string
  captainName?: string
}

export interface CancellationEmailData {
  bookingNumber: string
  customerName: string
  customerEmail: string
  cancelReason?: string
  refundAmount?: number
}

export interface SupportTicketCreatedEmailData {
  ticketNumber: string
  userName: string
  userEmail: string
  userPhone: string
  subject: string
  category: string
  priority: string
  message: string
  bookingNumber?: string
}

export interface SupportMessageEmailData {
  ticketNumber: string
  ticketSubject: string
  recipientName: string
  recipientEmail: string
  senderName: string
  message: string
  isAdmin: boolean
}

export interface SupportTicketStatusEmailData {
  ticketNumber: string
  ticketSubject: string
  userName: string
  userEmail: string
  status: string
  resolvedBy?: string
}

class EmailService {
  private apiKey: string | null = null
  private fromEmail: string = 'noreply@villageexpress.com'

  constructor() {
    this.apiKey = process.env.EMAIL_API_KEY || null
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@villageexpress.com'
  }

  async sendEmail(email: EmailTemplate): Promise<boolean> {
    // Placeholder implementation - integrate with email provider
    // console.log('[EMAIL_SERVICE] Sending email:', {
    //   to: email.to,
    //   subject: email.subject,
    // })

    // TODO: Integrate with email provider (SendGrid, Resend, AWS SES, etc.)
    // Example with Resend:
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     from: this.fromEmail,
    //     to: email.to,
    //     subject: email.subject,
    //     html: email.html,
    //     text: email.text,
    //   }),
    // })
    // return response.ok

    return true // Placeholder
  }

  async sendBookingConfirmation(data: BookingConfirmationEmailData): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Booking Confirmed!</h2>
        <p>Dear ${data.customerName},</p>
        <p>Your booking has been confirmed successfully.</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Booking Details</h3>
          <p><strong>Booking Number:</strong> ${data.bookingNumber}</p>
          <p><strong>Pickup Location:</strong> ${data.pickupLocation}</p>
          <p><strong>Drop Location:</strong> ${data.dropLocation}</p>
          ${data.scheduledDate ? `<p><strong>Scheduled Date:</strong> ${data.scheduledDate}</p>` : ''}
          ${data.timeSlot ? `<p><strong>Time Slot:</strong> ${data.timeSlot}</p>` : ''}
          <p><strong>Delivery Priority:</strong> ${data.deliveryPriority}</p>
          <p><strong>Estimated Price:</strong> ₹${data.estimatedPrice.toFixed(2)}</p>
        </div>
        
        <p>You can track your booking in the dashboard.</p>
        <p>Thank you for choosing Village Express!</p>
      </div>
    `

    return this.sendEmail({
      to: data.customerEmail,
      subject: `Booking Confirmed - ${data.bookingNumber}`,
      html,
      text: `Your booking ${data.bookingNumber} has been confirmed. Pickup: ${data.pickupLocation}, Drop: ${data.dropLocation}`,
    })
  }

  async sendDeliveryConfirmation(data: DeliveryConfirmationEmailData): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16a34a;">Delivery Completed!</h2>
        <p>Dear ${data.customerName},</p>
        <p>Your booking has been successfully delivered.</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Delivery Details</h3>
          <p><strong>Booking Number:</strong> ${data.bookingNumber}</p>
          <p><strong>Delivered At:</strong> ${data.deliveredAt}</p>
          ${data.captainName ? `<p><strong>Captain:</strong> ${data.captainName}</p>` : ''}
        </div>
        
        <p>Please rate your experience in the dashboard.</p>
        <p>Thank you for choosing Village Express!</p>
      </div>
    `

    return this.sendEmail({
      to: data.customerEmail,
      subject: `Delivery Completed - ${data.bookingNumber}`,
      html,
      text: `Your booking ${data.bookingNumber} has been delivered successfully.`,
    })
  }

  async sendCancellationNotification(data: CancellationEmailData): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">Booking Cancelled</h2>
        <p>Dear ${data.customerName},</p>
        <p>Your booking has been cancelled.</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Cancellation Details</h3>
          <p><strong>Booking Number:</strong> ${data.bookingNumber}</p>
          ${data.cancelReason ? `<p><strong>Reason:</strong> ${data.cancelReason}</p>` : ''}
          ${data.refundAmount ? `<p><strong>Refund Amount:</strong> ₹${data.refundAmount.toFixed(2)}</p>` : ''}
        </div>
        
        <p>If you have any questions, please contact support.</p>
        <p>Thank you for choosing Village Express!</p>
      </div>
    `

    return this.sendEmail({
      to: data.customerEmail,
      subject: `Booking Cancelled - ${data.bookingNumber}`,
      html,
      text: `Your booking ${data.bookingNumber} has been cancelled.`,
    })
  }

  async sendSupportTicketCreated(data: SupportTicketCreatedEmailData): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Support Ticket Created</h2>
        <p>Dear ${data.userName},</p>
        <p>Your support ticket has been created successfully. Our team will review it and get back to you shortly.</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Ticket Details</h3>
          <p><strong>Ticket Number:</strong> ${data.ticketNumber}</p>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Category:</strong> ${data.category}</p>
          <p><strong>Priority:</strong> ${data.priority}</p>
          ${data.bookingNumber ? `<p><strong>Booking:</strong> ${data.bookingNumber}</p>` : ''}
        </div>
        
        <p><strong>Your Message:</strong></p>
        <p style="background: #fff; padding: 10px; border-left: 3px solid #2563eb;">${data.message}</p>
        
        <p>You can track your ticket status in the support section of your dashboard.</p>
        <p>Thank you for contacting Village Express Support!</p>
      </div>
    `

    return this.sendEmail({
      to: data.userEmail,
      subject: `Support Ticket Created - ${data.ticketNumber}`,
      html,
      text: `Your support ticket ${data.ticketNumber} has been created. Subject: ${data.subject}`,
    })
  }

  async sendSupportMessage(data: SupportMessageEmailData): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">New Message on Support Ticket</h2>
        <p>Dear ${data.recipientName},</p>
        <p>You have received a new message on your support ticket.</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Ticket Details</h3>
          <p><strong>Ticket Number:</strong> ${data.ticketNumber}</p>
          <p><strong>Subject:</strong> ${data.ticketSubject}</p>
          <p><strong>From:</strong> ${data.senderName} ${data.isAdmin ? '(Support Team)' : ''}</p>
        </div>
        
        <p><strong>Message:</strong></p>
        <p style="background: #fff; padding: 10px; border-left: 3px solid #2563eb;">${data.message}</p>
        
        <p>Please log in to your dashboard to respond.</p>
        <p>Thank you for using Village Express!</p>
      </div>
    `

    return this.sendEmail({
      to: data.recipientEmail,
      subject: `New Message - ${data.ticketNumber}`,
      html,
      text: `New message on ticket ${data.ticketNumber} from ${data.senderName}`,
    })
  }

  async sendSupportTicketStatus(data: SupportTicketStatusEmailData): Promise<boolean> {
    const statusColors: Record<string, string> = {
      OPEN: '#eab308',
      IN_PROGRESS: '#3b82f6',
      RESOLVED: '#22c55e',
      CLOSED: '#6b7280',
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: ${statusColors[data.status] || '#2563eb'};">Support Ticket Status Updated</h2>
        <p>Dear ${data.userName},</p>
        <p>Your support ticket status has been updated.</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Ticket Details</h3>
          <p><strong>Ticket Number:</strong> ${data.ticketNumber}</p>
          <p><strong>Subject:</strong> ${data.ticketSubject}</p>
          <p><strong>New Status:</strong> <span style="color: ${statusColors[data.status] || '#2563eb'}; font-weight: bold;">${data.status}</span></p>
          ${data.resolvedBy ? `<p><strong>Resolved By:</strong> ${data.resolvedBy}</p>` : ''}
        </div>
        
        <p>You can view the full ticket details in the support section of your dashboard.</p>
        <p>Thank you for contacting Village Express Support!</p>
      </div>
    `

    return this.sendEmail({
      to: data.userEmail,
      subject: `Ticket Status Updated - ${data.ticketNumber}`,
      html,
      text: `Your ticket ${data.ticketNumber} status is now ${data.status}`,
    })
  }
}

export const emailService = new EmailService()
