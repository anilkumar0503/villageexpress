import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env from root directory
config({ path: resolve(__dirname, '../../.env') })

const prisma = new PrismaClient()

async function main() {
  //console.log('🌱 Seeding testimonials...')

  // ─── Clean up existing testimonials ─────────────────────────────────────────────
  await prisma.testimonial.deleteMany({})
  //console.log('✅ Cleaned up existing testimonials')

  // ─── Sample Testimonials ────────────────────────────────────────────────────────
  const testimonials = await Promise.all([
    prisma.testimonial.create({
      data: {
        customerName: 'Ramesh Kumar',
        customerLocation: 'Karimnagar',
        rating: 5,
        content: 'Excellent service! My parcel was delivered from Jagitial to Karimnagar in just 2 days. The tracking feature is very helpful.',
        isApproved: true,
        isActive: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        customerName: 'Sunita Reddy',
        customerLocation: 'Warangal',
        rating: 5,
        content: 'Very reliable delivery service. I use Village Express for all my business deliveries. The captains are professional and courteous.',
        isApproved: true,
        isActive: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        customerName: 'Venkat Rao',
        customerLocation: 'Nizamabad',
        rating: 4,
        content: 'Good service overall. The delivery was on time and my package arrived in good condition. Would recommend to others.',
        isApproved: true,
        isActive: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        customerName: 'Lakshmi Devi',
        customerLocation: 'Hanumakonda',
        rating: 5,
        content: 'I was worried about sending fragile items, but Village Express handled it with care. Perfect condition delivery!',
        isApproved: true,
        isActive: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        customerName: 'Rajesh Sharma',
        customerLocation: 'Choppadandi',
        rating: 5,
        content: 'Best delivery service in rural Telangana. They cover areas that other couriers dont. Very affordable too!',
        isApproved: true,
        isActive: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        customerName: 'Priya Singh',
        customerLocation: 'Karimnagar',
        rating: 4,
        content: 'Quick and efficient. The real-time tracking feature is amazing - I could see exactly where my parcel was.',
        isApproved: true,
        isActive: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        customerName: 'Srinivas Murthy',
        customerLocation: 'Jagitial',
        rating: 5,
        content: 'Been using Village Express for 6 months now. Consistent quality service. The point managers are very helpful.',
        isApproved: true,
        isActive: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        customerName: 'Anjali Deshmukh',
        customerLocation: 'Poodoor',
        rating: 5,
        content: 'Sent important documents to Hyderabad - arrived safely and on time. Trustworthy service for important deliveries.',
        isApproved: true,
        isActive: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        customerName: 'Mohan Patel',
        customerLocation: 'Gangadhara',
        rating: 4,
        content: 'Good pricing and reliable service. The express delivery option is worth the extra cost for urgent parcels.',
        isApproved: true,
        isActive: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        customerName: 'Kavitha Naidu',
        customerLocation: 'Karimnagar',
        rating: 5,
        content: 'Excellent customer support. Had a query about my delivery and they resolved it quickly. Very impressed!',
        isApproved: true,
        isActive: true,
      },
    }),
    // Pending approval testimonials
    prisma.testimonial.create({
      data: {
        customerName: 'New Customer',
        customerLocation: 'Hyderabad',
        rating: 5,
        content: 'This is a pending testimonial waiting for admin approval.',
        isApproved: false,
        isActive: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        customerName: 'Another Customer',
        customerLocation: 'Secunderabad',
        rating: 4,
        content: 'Another pending testimonial for testing the approval workflow.',
        isApproved: false,
        isActive: true,
      },
    }),
  ])

  //console.log(`✅ ${testimonials.length} testimonials seeded (${testimonials.filter(t => t.isApproved).length} approved, ${testimonials.filter(t => !t.isApproved).length} pending)`)
  //console.log('🎉 Testimonial seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding testimonials:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
