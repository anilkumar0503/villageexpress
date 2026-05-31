import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, 'user:read')
  if (error) return error

  const { searchParams } = req.nextUrl
  const role = searchParams.get('role') ?? undefined
  const approvalStatus = searchParams.get('approvalStatus') ?? undefined
  const isActive = searchParams.get('isActive')
  const search = searchParams.get('search') ?? undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 20))

  const where = {
    ...(approvalStatus && { approvalStatus: approvalStatus as 'PENDING' | 'APPROVED' | 'REJECTED' }),
    ...(isActive !== null && isActive !== '' && { isActive: isActive === 'true' }),
    ...(role && { userRoles: { some: { role: { name: role } } } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search } },
        { displayId: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        displayId: true,
        name: true,
        email: true,
        phone: true,
        approvalStatus: true,
        isActive: true,
        createdAt: true,
        userRoles: { select: { role: { select: { name: true } }, isPrimary: true } },
        pointManagerProfile: {
          select: {
            shopLocation: {
              select: {
                pointName: true,
                village: true,
                district: true,
              },
            },
          },
        },
        captainProfile: {
          select: {
            id: true,
            vehicleType: true,
            vehicleNumber: true,
            aadhaarNumber: true,
            aadhaarPhoto: true,
            licensePhoto: true,
            // @ts-ignore - these fields exist in DB but TypeScript needs client regeneration
            aadhaarVerificationStatus: true,
            // @ts-ignore - these fields exist in DB but TypeScript needs client regeneration
            licenseVerificationStatus: true,
            // @ts-ignore - these fields exist in DB but TypeScript needs client regeneration
            aadhaarRejectionReason: true,
            // @ts-ignore - these fields exist in DB but TypeScript needs client regeneration
            licenseRejectionReason: true,
            districtId: true,
            pointAssignments: {
              where: { isActive: true },
              select: {
                locationId: true,
                location: {
                  select: {
                    pointName: true,
                    village: true,
                    district: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
}
