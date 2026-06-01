import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  // Get admin payment settings
  const paymentSettings = await prisma.adminPaymentSettings.findFirst({
    where: { isActive: true },
  })

  // Get COD collections that haven't been remitted yet
  const pendingCollections = await prisma.codCollection.findMany({
    where: {
      userId: session!.userId,
      status: 'COLLECTED',
    },
    include: {
      booking: {
        select: {
          bookingNumber: true,
          calculatedPrice: true,
        },
      },
    },
    orderBy: { collectionDate: 'desc' },
  })

  // Get total pending amount
  const totalPending = pendingCollections.reduce(
    (sum, col) => sum + Number(col.amount),
    0
  )

  // Get remittance history
  const remittances = await prisma.codRemittance.findMany({
    where: { userId: session!.userId },
    include: {
      collection: {
        include: {
          booking: {
            select: {
              bookingNumber: true,
            },
          },
        },
      },
    },
    orderBy: { remittanceDate: 'desc' },
    take: 20,
  })

  return NextResponse.json({
    success: true,
    data: {
      paymentSettings,
      pendingCollections,
      totalPending,
      remittances,
    },
  })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const body = await req.json()
  const { collectionIds, remittanceMethod, transactionId, bankReferenceNumber, notes } = body

  if (!collectionIds || collectionIds.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Collection IDs are required' },
      { status: 400 }
    )
  }

  // Verify collections belong to the user and are in COLLECTED status
  const collections = await prisma.codCollection.findMany({
    where: {
      id: { in: collectionIds },
      userId: session!.userId,
      status: 'COLLECTED',
    },
  })

  if (collections.length !== collectionIds.length) {
    return NextResponse.json(
      { success: false, error: 'Some collections are invalid or already remitted' },
      { status: 400 }
    )
  }

  // Calculate total amount
  const totalAmount = collections.reduce((sum: number, col: any) => sum + Number(col.amount), 0)

  // Create remittance record for each collection
  const remittances = await Promise.all(
    collections.map((collection: any) =>
      prisma.codRemittance.create({
        data: {
          collectionId: collection.id,
          userId: session!.userId,
          amount: collection.amount,
          remittanceMethod,
          transactionId,
          bankReferenceNumber,
          notes,
          status: 'PENDING',
        },
      })
    )
  )

  // Update collection statuses
  await prisma.codCollection.updateMany({
    where: { id: { in: collectionIds } },
    data: { status: 'REMITTED' },
  })

  return NextResponse.json({
    success: true,
    data: { remittances, totalAmount },
  })
}
