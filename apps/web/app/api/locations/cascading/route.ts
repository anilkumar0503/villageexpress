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
      data: { states: states.map((s) => s.state) },
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
      data: { districts: districts.map((d) => d.district) },
    })
  }

  const locations = await prisma.location.findMany({
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
    orderBy: { village: 'asc' },
  })

  return NextResponse.json({
    success: true,
    data: { locations },
  })
}
