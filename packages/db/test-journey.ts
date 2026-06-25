import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env from root directory
config({ path: resolve(__dirname, '../../.env') })

const prisma = new PrismaClient()

async function testFullJourney() {
  //console.log('🚀 Starting Full Journey Test Case...\n')

  // Get the test booking
  const booking = await prisma.booking.findUnique({
    where: { bookingNumber: 'VE-ROUTE-TEST-001' },
    include: {
      segments: {
        include: {
          routeSegment: {
            include: {
              fromLocation: true,
              toLocation: true,
            },
          },
          pointManager: true,
        },
        orderBy: { sequenceOrder: 'asc' },
      },
    },
  })

  if (!booking) {
    console.error('❌ Test booking not found. Run seed.ts first.')
    return
  }

  //console.log(`📦 Booking: ${booking.bookingNumber}`)
  //console.log(`   From: ${booking.pickupLocationId}`)
  //console.log(`   To: ${booking.dropLocationId}`)
  //console.log(`   Total Segments: ${booking.segments.length}\n`)

  // Get captains
  const captains = await prisma.user.findMany({
    where: {
      captainProfile: {
        isNot: null,
      },
      email: {
        startsWith: 'captain',
      },
    },
    include: {
      captainProfile: true,
    },
  })

  //console.log(`👥 Found ${captains.length} captains for testing\n`)

  // Simulate the journey through each segment
  for (let i = 0; i < booking.segments.length; i++) {
    const segment = booking.segments[i]
    const segmentNum = i + 1
    const fromLoc = segment.routeSegment.fromLocation.pointName
    const toLoc = segment.routeSegment.toLocation.pointName

    //console.log(`\n${'='.repeat(60)}`)
    //console.log(`SEGMENT ${segmentNum}: ${fromLoc} → ${toLoc}`)
    //console.log(`Current Status: ${segment.status}`)
    //console.log(`Assigned PM: ${segment.pointManager?.name || 'None'}`)

    // Step 1: Point Manager receives parcel
    //console.log(`\n📥 Step 1: Point Manager at ${fromLoc} receives parcel`)
    await prisma.bookingSegment.update({
      where: { id: segment.id },
      data: {
        status: 'RECEIVED_AT_POINT',
      },
    })
    //console.log(`   ✅ Status updated to RECEIVED_AT_POINT`)

    // Step 2: Assign captain to this segment
    const captain = captains[i]
    //console.log(`\n👤 Step 2: Assign Captain ${captain.name} to segment`)
    await prisma.bookingSegment.update({
      where: { id: segment.id },
      data: {
        assignedCaptainId: captain.id,
        status: 'ASSIGNED',
      },
    })
    //console.log(`   ✅ Captain assigned: ${captain.name}`)
    //console.log(`   ✅ Status updated to ASSIGNED`)

    // Step 3: Captain picks up parcel
    //console.log(`\n🏍️  Step 3: Captain picks up parcel from ${fromLoc}`)
    await prisma.bookingSegment.update({
      where: { id: segment.id },
      data: {
        status: 'PICKED_UP',
      },
    })
    //console.log(`   ✅ Status updated to PICKED_UP`)

    // Step 4: Captain in transit
    //console.log(`\n🚗 Step 4: Captain in transit to ${toLoc}`)
    await prisma.bookingSegment.update({
      where: { id: segment.id },
      data: {
        status: 'IN_TRANSIT',
      },
    })
    //console.log(`   ✅ Status updated to IN_TRANSIT`)

    // Step 5: Captain delivers to next point
    //console.log(`\n📦 Step 5: Captain delivers parcel to ${toLoc}`)
    await prisma.bookingSegment.update({
      where: { id: segment.id },
      data: {
        status: 'HANDED_OFF',
        handedOffAt: new Date(),
      },
    })
    //console.log(`   ✅ Status updated to HANDED_OFF`)
    //console.log(`   ✅ Handoff time recorded`)

    // If this is the last segment, mark as delivered
    if (i === booking.segments.length - 1) {
      //console.log(`\n🎉 FINAL DELIVERY: Parcel delivered to ${toLoc}`)
      await prisma.bookingSegment.update({
        where: { id: segment.id },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      })
      //console.log(`   ✅ Final segment status updated to DELIVERED`)

      // Update main booking status
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'DELIVERED',
        },
      })
      //console.log(`   ✅ Main booking status updated to DELIVERED`)
    } else {
      // Next segment: Point Manager at next location receives
      const nextSegment = booking.segments[i + 1]
      const nextLoc = nextSegment.routeSegment.fromLocation.pointName
      //console.log(`\n📥 Step 6: Point Manager at ${nextLoc} receives parcel (handoff)`)
      await prisma.bookingSegment.update({
        where: { id: nextSegment.id },
        data: {
          status: 'RECEIVED_AT_POINT',
        },
      })
      //console.log(`   ✅ Next segment status updated to RECEIVED_AT_POINT`)
    }

    // Wait a bit to simulate time passing
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Final state check
  //console.log(`\n${'='.repeat(60)}`)
  //console.log('📊 FINAL STATE')
  //console.log('='.repeat(60))

  const finalBooking = await prisma.booking.findUnique({
    where: { id: booking.id },
    include: {
      segments: {
        include: {
          routeSegment: {
            include: {
              fromLocation: true,
              toLocation: true,
            },
          },
          pointManager: true,
          captain: true,
        },
        orderBy: { sequenceOrder: 'asc' },
      },
    },
  })

  //console.log(`\nBooking Status: ${finalBooking?.status}`)
  //console.log('\nSegment Statuses:')
  finalBooking?.segments.forEach((seg, idx) => {
    const from = seg.routeSegment.fromLocation.pointName
    const to = seg.routeSegment.toLocation.pointName
    //console.log(`  ${idx + 1}. ${from} → ${to}`)
    //console.log(`     Status: ${seg.status}`)
    //console.log(`     PM: ${seg.pointManager?.name || 'None'}`)
    //console.log(`     Captain: ${seg.captain?.name || 'None'}`)
    if (seg.handedOffAt) //console.log(`     Handed Off: ${seg.handedOffAt.toISOString()}`)
    if (seg.deliveredAt) //console.log(`     Delivered: ${seg.deliveredAt.toISOString()}`)
  })

  //console.log(`\n✅ Full journey test completed successfully!`)
}

testFullJourney()
  .catch((e) => {
    console.error('❌ Test failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
