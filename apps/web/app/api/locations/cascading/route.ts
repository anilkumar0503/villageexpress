import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const state = searchParams.get('state')
  const district = searchParams.get('district')

  if (!state) {
    const states = await prisma.location.findMany({
      where: { isActive: true },
      select: { state: true },
      distinct: ['state'],
      orderBy: { state: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: { states: states.map((s: any) => s.state) },
    })
  }

  if (state && !district) {
    const districts = await prisma.location.findMany({
      where: { state, isActive: true },
      select: { district: true },
      distinct: ['district'],
      orderBy: { district: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: { districts: districts.map((d: any) => d.district) },
    })
  }

  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(1000, Number(searchParams.get('pageSize') ?? 1000))

  const [locations, total] = await Promise.all([
    prisma.location.findMany({
      where: { state: state!, district: district!, isActive: true },
      select: {
        id: true,
        village: true,
        mandal: true,
        pointName: true,
        pincode: true,
        locationType: true,
        latitude: true,
        longitude: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { village: 'asc' },
    }),
    prisma.location.count({
      where: { state: state!, district: district!, isActive: true },
    }),
  ])

  return NextResponse.json({
    success: true,
    data: { locations, total, page, pageSize },
  })
}
