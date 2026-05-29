import { prisma } from '@ve/db'
import { generateOtp, sendOtpEmail } from '../email'

const OTP_EXPIRY_MINUTES = 10

export async function createAndSendOtp(email: string): Promise<void> {
  await prisma.otpCode.updateMany({
    where: { email, used: false },
    data: { used: true },
  })

  const code = generateOtp()
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  await prisma.otpCode.create({
    data: { email, code, expiresAt },
  })

  await sendOtpEmail(email, code)
}

export async function verifyOtp(email: string, code: string): Promise<boolean> {
  const otp = await prisma.otpCode.findFirst({
    where: {
      email,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!otp) return false

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { used: true },
  })

  return true
}
