import nodemailer from 'nodemailer'

const FROM = process.env.SMTP_FROM ?? 'noreply@villageexpress.in'
const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

async function sendMail(options: { to: string; subject: string; html: string }) {
  if (!smtpConfigured) {
    console.log(`📧 [MAIL FALLBACK] To: ${options.to} | Subject: ${options.subject}`)
    return
  }
  await getTransporter().sendMail({ from: FROM, ...options })
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [OTP] ${email} → ${otp}`)
    return
  }
  await sendMail({
    to: email,
    subject: 'Your Village Express OTP',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>Your one-time password is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;padding:16px 0;color:#1d4ed8">
          ${otp}
        </div>
        <p style="color:#666">Expires in <strong>10 minutes</strong>. Do not share with anyone.</p>
      </div>
    `,
  })
}

export async function sendApprovalEmail(email: string, name: string, approved: boolean, reason?: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [APPROVAL] ${email} → ${approved ? 'APPROVED' : 'REJECTED'}`)
    return
  }
  await sendMail({
    to: email,
    subject: `Village Express — Registration ${approved ? 'Approved' : 'Rejected'}`,
    html: approved
      ? `<div style="font-family:sans-serif;padding:24px"><h2 style="color:#1d4ed8">Village Express</h2><p>Hi ${name},</p><p>Your registration has been <strong>approved</strong>. You can now <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">sign in here</a>.</p></div>`
      : `<div style="font-family:sans-serif;padding:24px"><h2 style="color:#1d4ed8">Village Express</h2><p>Hi ${name},</p><p>Your registration was <strong>not approved</strong>.</p>${reason ? `<p>Reason: ${reason}</p>` : ''}<p>Contact support if you believe this is a mistake.</p></div>`,
  })
}

export async function sendBookingConfirmationEmail(email: string, name: string, bookingNumber: string, amount: number): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [BOOKING] ${email} → ${bookingNumber} confirmed`)
    return
  }
  await sendMail({
    to: email,
    subject: `Booking Confirmed — ${bookingNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>Hi ${name},</p>
        <p>Your booking <strong>${bookingNumber}</strong> has been confirmed.</p>
        <p>Amount: <strong>₹${amount.toFixed(2)}</strong></p>
        <p>Track your parcel anytime from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/my">dashboard</a>.</p>
      </div>
    `,
  })
}

export async function sendCaptainAssignedEmail(email: string, name: string, bookingNumber: string, captainName: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [CAPTAIN_ASSIGNED] ${email} → ${bookingNumber}`)
    return
  }
  await sendMail({
    to: email,
    subject: `Captain Assigned — ${bookingNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>Hi ${name},</p>
        <p>Captain <strong>${captainName}</strong> has been assigned to your booking <strong>${bookingNumber}</strong>.</p>
        <p>Track your parcel from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/my">dashboard</a>.</p>
      </div>
    `,
  })
}

export async function sendBookingPickedUpEmail(email: string, name: string, bookingNumber: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [PICKED_UP] ${email} → ${bookingNumber}`)
    return
  }
  await sendMail({
    to: email,
    subject: `Parcel Picked Up — ${bookingNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>Hi ${name},</p>
        <p>Your parcel for booking <strong>${bookingNumber}</strong> has been picked up and is now in transit.</p>
      </div>
    `,
  })
}

export async function sendBookingDeliveredEmail(email: string, name: string, bookingNumber: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [DELIVERED] ${email} → ${bookingNumber}`)
    return
  }
  await sendMail({
    to: email,
    subject: `Parcel Delivered — ${bookingNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>Hi ${name},</p>
        <p>Your parcel for booking <strong>${bookingNumber}</strong> has been delivered successfully.</p>
        <p>Thank you for using Village Express!</p>
      </div>
    `,
  })
}

export async function sendBookingCancelledEmail(email: string, name: string, bookingNumber: string, refunded: boolean): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [CANCELLED] ${email} → ${bookingNumber}`)
    return
  }
  await sendMail({
    to: email,
    subject: `Booking Cancelled — ${bookingNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>Hi ${name},</p>
        <p>Your booking <strong>${bookingNumber}</strong> has been cancelled.</p>
        ${refunded ? '<p>A refund has been initiated to your original payment method.</p>' : ''}
      </div>
    `,
  })
}

export async function sendNewBookingToPM(email: string, name: string, bookingNumber: string, pickupLocation: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [NEW_BOOKING_PM] ${email} → ${bookingNumber}`)
    return
  }
  await sendMail({
    to: email,
    subject: `New Booking — ${bookingNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>Hi ${name},</p>
        <p>A new booking <strong>${bookingNumber}</strong> has been routed to your location: <strong>${pickupLocation}</strong>.</p>
        <p>Please assign a captain from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/point-manager">dashboard</a>.</p>
      </div>
    `,
  })
}

export async function sendCaptainAssignmentEmail(email: string, name: string, bookingNumber: string, pickupLocation: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [CAPTAIN_ASSIGN] ${email} → ${bookingNumber}`)
    return
  }
  await sendMail({
    to: email,
    subject: `New Assignment — ${bookingNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>Hi ${name},</p>
        <p>You have been assigned to booking <strong>${bookingNumber}</strong>.</p>
        <p>Pickup location: <strong>${pickupLocation}</strong></p>
        <p>View details from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/captain">dashboard</a>.</p>
      </div>
    `,
  })
}

export async function sendPendingApprovalEmail(email: string, applicantName: string, applicantType: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [PENDING_APPROVAL] ${email} → ${applicantType} ${applicantName}`)
    return
  }
  await sendMail({
    to: email,
    subject: `Pending Approval — ${applicantType}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>A new ${applicantType.toLowerCase()} registration is pending approval.</p>
        <p>Applicant: <strong>${applicantName}</strong></p>
        <p>Review from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/approvals">dashboard</a>.</p>
      </div>
    `,
  })
}

export async function sendMissingPricingRuleEmail(email: string, pickup: string, drop: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [MISSING_PRICING] ${email} → ${pickup} → ${drop}`)
    return
  }
  await sendMail({
    to: email,
    subject: `Missing Pricing Rule — ${pickup} → ${drop}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>A booking attempt failed due to missing pricing rule.</p>
        <p>Route: <strong>${pickup}</strong> → <strong>${drop}</strong></p>
        <p>Please add a pricing rule from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/pricing">dashboard</a>.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, name: string, resetLink: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [PASSWORD_RESET] ${email} → ${resetLink}`)
    return
  }
  await sendMail({
    to: email,
    subject: 'Reset Your Password — Village Express',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">
            Reset Password
          </a>
        </div>
        <p style="color:#666;font-size:14px">This link will expire in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  })
}
