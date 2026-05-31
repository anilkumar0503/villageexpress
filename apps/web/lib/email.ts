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

export async function sendDeliveryOtpEmail(email: string, name: string, bookingNumber: string, otp: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [DELIVERY_OTP] ${email} → ${bookingNumber} OTP: ${otp}`)
    return
  }
  await sendMail({
    to: email,
    subject: `Delivery OTP — ${bookingNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>Hi ${name},</p>
        <p>Your booking <strong>${bookingNumber}</strong> is ready for delivery.</p>
        <p>Please share this <strong>6-digit OTP</strong> with the point manager at the drop location:</p>
        <div style="font-size:48px;font-weight:bold;letter-spacing:12px;padding:24px 0;color:#1d4ed8;text-align:center">
          ${otp}
        </div>
        <p style="color:#666">This OTP is valid for <strong>7 days</strong>. Do not share with anyone except the point manager.</p>
        <p>Track your parcel from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/my">dashboard</a>.</p>
      </div>
    `,
  })
}

export async function sendCodRemittanceEmail(email: string, name: string, remittanceId: string, amount: number, remittanceDate: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [COD_REMITTANCE] ${email} → ${remittanceId} Amount: ₹${amount}`)
    return
  }
  await sendMail({
    to: email,
    subject: `COD Remittance Processed — ${remittanceId}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>Hi ${name},</p>
        <p>Your COD remittance has been processed successfully.</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
          <p><strong>Remittance ID:</strong> ${remittanceId}</p>
          <p><strong>Amount:</strong> ₹${amount.toFixed(2)}</p>
          <p><strong>Remittance Date:</strong> ${remittanceDate}</p>
        </div>
        <p>The amount will be credited to your account shortly.</p>
        <p>View details from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/cod-remittances">dashboard</a>.</p>
      </div>
    `,
  })
}

export async function sendCommissionPayoutEmail(email: string, name: string, payoutId: string, amount: number, payoutDate: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [COMMISSION_PAYOUT] ${email} → ${payoutId} Amount: ₹${amount}`)
    return
  }
  await sendMail({
    to: email,
    subject: `Commission Payout — ${payoutId}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>Hi ${name},</p>
        <p>Your commission payout has been processed.</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
          <p><strong>Payout ID:</strong> ${payoutId}</p>
          <p><strong>Amount:</strong> ₹${amount.toFixed(2)}</p>
          <p><strong>Payout Date:</strong> ${payoutDate}</p>
        </div>
        <p>The amount will be credited to your wallet shortly.</p>
        <p>View details from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/wallet">dashboard</a>.</p>
      </div>
    `,
  })
}

export async function sendWithdrawalRequestEmail(adminEmail: string, userName: string, userEmail: string, amount: number, requestId: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [WITHDRAWAL_REQUEST] ${adminEmail} → ${userEmail} Amount: ₹${amount}`)
    return
  }
  await sendMail({
    to: adminEmail,
    subject: `New Withdrawal Request — ${requestId}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>A new withdrawal request has been submitted.</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
          <p><strong>Request ID:</strong> ${requestId}</p>
          <p><strong>User:</strong> ${userName} (${userEmail})</p>
          <p><strong>Amount:</strong> ₹${amount.toFixed(2)}</p>
        </div>
        <p>Review and process this request from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/withdrawals">dashboard</a>.</p>
      </div>
    `,
  })
}

export async function sendRefundProcessedEmail(email: string, name: string, bookingNumber: string, refundAmount: number, refundId: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [REFUND_PROCESSED] ${email} → ${bookingNumber} Amount: ₹${refundAmount}`)
    return
  }
  await sendMail({
    to: email,
    subject: `Refund Processed — ${bookingNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>Hi ${name},</p>
        <p>Your refund has been processed successfully.</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
          <p><strong>Booking Number:</strong> ${bookingNumber}</p>
          <p><strong>Refund ID:</strong> ${refundId}</p>
          <p><strong>Refund Amount:</strong> ₹${refundAmount.toFixed(2)}</p>
        </div>
        <p>The amount will be credited to your original payment method within 5-7 business days.</p>
        <p>Thank you for your patience.</p>
      </div>
    `,
  })
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [WELCOME] ${email}`)
    return
  }
  await sendMail({
    to: email,
    subject: 'Welcome to Village Express!',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Welcome to Village Express!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for joining Village Express. We're excited to have you on board!</p>
        <p>With Village Express, you can:</p>
        <ul style="margin:16px 0;padding-left:20px">
          <li>Book parcel deliveries across villages</li>
          <li>Track your shipments in real-time</li>
          <li>Enjoy competitive pricing</li>
          <li>Get reliable doorstep delivery</li>
        </ul>
        <p>Get started by <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/new">booking your first parcel</a>.</p>
        <p>If you have any questions, feel free to <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact">contact us</a>.</p>
        <p>Welcome aboard!</p>
      </div>
    `,
  })
}

export async function sendReviewRequestEmail(email: string, name: string, bookingNumber: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [REVIEW_REQUEST] ${email} → ${bookingNumber}`)
    return
  }
  await sendMail({
    to: email,
    subject: `How was your experience? — ${bookingNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>Hi ${name},</p>
        <p>Your parcel for booking <strong>${bookingNumber}</strong> has been delivered successfully.</p>
        <p>We'd love to hear about your experience! Your feedback helps us improve our services.</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/testimonials" style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">
            Leave a Review
          </a>
        </div>
        <p>Thank you for choosing Village Express!</p>
      </div>
    `,
  })
}

export async function sendPaymentConfirmationEmail(email: string, name: string, bookingNumber: string, amount: number, paymentMethod: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [PAYMENT_CONFIRMED] ${email} → ${bookingNumber} Amount: ₹${amount}`)
    return
  }
  await sendMail({
    to: email,
    subject: `Payment Confirmed — ${bookingNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>Hi ${name},</p>
        <p>Your payment for booking <strong>${bookingNumber}</strong> has been confirmed.</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
          <p><strong>Booking Number:</strong> ${bookingNumber}</p>
          <p><strong>Amount Paid:</strong> ₹${amount.toFixed(2)}</p>
          <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        </div>
        <p>Your booking is now being processed. Track your parcel from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/my">dashboard</a>.</p>
      </div>
    `,
  })
}

export async function sendFailedDeliveryEmail(email: string, name: string, bookingNumber: string, reason: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [FAILED_DELIVERY] ${email} → ${bookingNumber}`)
    return
  }
  await sendMail({
    to: email,
    subject: `Delivery Attempt Failed — ${bookingNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#dc2626">Village Express</h2>
        <p>Hi ${name},</p>
        <p>We attempted to deliver your parcel for booking <strong>${bookingNumber}</strong> but were unable to complete the delivery.</p>
        <div style="background:#fef2f2;padding:16px;border-radius:8px;margin:16px 0">
          <p><strong>Reason:</strong> ${reason}</p>
        </div>
        <p>Our team will attempt delivery again. If you have any questions, please contact support.</p>
        <p>Track your parcel from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/my">dashboard</a>.</p>
      </div>
    `,
  })
}

export async function sendDocumentRejectionEmail(email: string, name: string, documentType: string, reason: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [DOC_REJECTED] ${email} → ${documentType}`)
    return
  }
  await sendMail({
    to: email,
    subject: `Document Verification Failed — ${documentType}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#dc2626">Village Express</h2>
        <p>Hi ${name},</p>
        <p>Your <strong>${documentType}</strong> could not be verified.</p>
        <div style="background:#fef2f2;padding:16px;border-radius:8px;margin:16px 0">
          <p><strong>Reason:</strong> ${reason}</p>
        </div>
        <p>Please upload valid documents and resubmit for verification. Contact support if you believe this is an error.</p>
      </div>
    `,
  })
}

export async function sendAccountSuspendedEmail(email: string, name: string, reason: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [ACCOUNT_SUSPENDED] ${email}`)
    return
  }
  await sendMail({
    to: email,
    subject: 'Account Suspended — Village Express',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#dc2626">Village Express</h2>
        <p>Hi ${name},</p>
        <p>Your account has been suspended due to a violation of our terms of service.</p>
        <div style="background:#fef2f2;padding:16px;border-radius:8px;margin:16px 0">
          <p><strong>Reason:</strong> ${reason}</p>
        </div>
        <p>If you believe this is an error, please contact our support team for assistance.</p>
      </div>
    `,
  })
}

export async function sendPasswordChangedEmail(email: string, name: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [PASSWORD_CHANGED] ${email}`)
    return
  }
  await sendMail({
    to: email,
    subject: 'Password Changed — Village Express',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>Hi ${name},</p>
        <p>Your password has been changed successfully.</p>
        <p>If you did not make this change, please contact support immediately and change your password.</p>
        <p>For your security, never share your password with anyone.</p>
      </div>
    `,
  })
}

export async function sendBookingModifiedEmail(email: string, name: string, bookingNumber: string, changes: string): Promise<void> {
  if (!smtpConfigured) {
    console.log(`📧 [BOOKING_MODIFIED] ${email} → ${bookingNumber}`)
    return
  }
  await sendMail({
    to: email,
    subject: `Booking Modified — ${bookingNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Village Express</h2>
        <p>Hi ${name},</p>
        <p>Your booking <strong>${bookingNumber}</strong> has been modified.</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
          <p><strong>Changes:</strong></p>
          <p>${changes}</p>
        </div>
        <p>View updated details from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/my">dashboard</a>.</p>
      </div>
    `,
  })
}
