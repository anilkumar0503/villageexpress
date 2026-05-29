import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth, requireAnyRole } from '@/lib/auth/permissions'
import { RemittanceStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { error: permissionError } = await requireAnyRole(req, ['ADMIN', 'SUPER_ADMIN'])
  if (permissionError) return permissionError

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') || 'ALL'
  const page = Number(searchParams.get('page') ?? 1)
  const pageSize = Number(searchParams.get('pageSize') ?? 20)

  const where = status !== 'ALL' ? { status: status as RemittanceStatus } : {}

  const [remittances, total] = await Promise.all([
    prisma.codRemittance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            displayId: true,
          },
        },
        collection: {
          include: {
            booking: {
              select: {
                bookingNumber: true,
                calculatedPrice: true,
              },
            },
          },
        },
      },
      orderBy: { remittanceDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.codRemittance.count({ where }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      items: remittances,
      total,
      page,
      pageSize,
    },
  })
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { error: permissionError } = await requireAnyRole(req, ['ADMIN', 'SUPER_ADMIN'])
  if (permissionError) return permissionError

  const body = await req.json()
  const { remittanceId, status, transactionId } = body

  if (!remittanceId || !status) {
    return NextResponse.json(
      { success: false, error: 'Remittance ID and status are required' },
      { status: 400 }
    )
  }

  const remittance = await prisma.codRemittance.findUnique({
    where: { id: remittanceId },
  })

  if (!remittance) {
    return NextResponse.json(
      { success: false, error: 'Remittance not found' },
      { status: 404 }
    )
  }

  const updated = await prisma.codRemittance.update({
    where: { id: remittanceId },
    data: {
      status: status as RemittanceStatus,
      transactionId,
    },
  })

  return NextResponse.json({
    success: true,
    data: updated,
  })
}
