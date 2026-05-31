import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env from root directory
config({ path: resolve(__dirname, '../../.env') })

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding blog data...')

  // ─── Clean up existing blog data ───────────────────────────────────────────────
  await prisma.blogTagOnBlog.deleteMany({})
  await prisma.blogCategoryOnBlog.deleteMany({})
  await prisma.blog.deleteMany({})
  await prisma.blogTag.deleteMany({})
  await prisma.blogCategory.deleteMany({})
  console.log('✅ Cleaned up existing blog data')

  // ─── Blog Categories ───────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.blogCategory.create({
      data: {
        name: 'Delivery Tips',
        slug: 'delivery-tips',
        description: 'Tips and tricks for better delivery experiences',
        isActive: true,
      },
    }),
    prisma.blogCategory.create({
      data: {
        name: 'Company News',
        slug: 'company-news',
        description: 'Latest updates and announcements from Village Express',
        isActive: true,
      },
    }),
    prisma.blogCategory.create({
      data: {
        name: 'Service Updates',
        slug: 'service-updates',
        description: 'New features and service improvements',
        isActive: true,
      },
    }),
    prisma.blogCategory.create({
      data: {
        name: 'Customer Stories',
        slug: 'customer-stories',
        description: 'Success stories from our valued customers',
        isActive: true,
      },
    }),
    prisma.blogCategory.create({
      data: {
        name: 'Captain Spotlight',
        slug: 'captain-spotlight',
        description: 'Featuring our dedicated delivery captains',
        isActive: true,
      },
    }),
  ])
  console.log(`✅ ${categories.length} blog categories seeded`)

  // ─── Blog Tags ────────────────────────────────────────────────────────────────
  const tags = await Promise.all([
    prisma.blogTag.create({
      data: { name: 'packaging', slug: 'packaging', isActive: true },
    }),
    prisma.blogTag.create({
      data: { name: 'tracking', slug: 'tracking', isActive: true },
    }),
    prisma.blogTag.create({
      data: { name: 'express', slug: 'express', isActive: true },
    }),
    prisma.blogTag.create({
      data: { name: 'rural-delivery', slug: 'rural-delivery', isActive: true },
    }),
    prisma.blogTag.create({
      data: { name: 'safety', slug: 'safety', isActive: true },
    }),
    prisma.blogTag.create({
      data: { name: 'tips', slug: 'tips', isActive: true },
    }),
    prisma.blogTag.create({
      data: { name: 'announcement', slug: 'announcement', isActive: true },
    }),
    prisma.blogTag.create({
      data: { name: 'feature', slug: 'feature', isActive: true },
    }),
  ])
  console.log(`✅ ${tags.length} blog tags seeded`)

  // ─── Sample Blog Posts ─────────────────────────────────────────────────────────
  const blog1 = await prisma.blog.create({
    data: {
      title: '5 Tips for Packaging Your Parcels Safely',
      slug: '5-tips-for-packaging-your-parcels-safely',
      excerpt: 'Learn how to package your items properly to ensure they arrive safely at their destination.',
      content: `
        <h2>Why Proper Packaging Matters</h2>
        <p>Proper packaging is essential to ensure your parcels arrive safely and in good condition. Here are 5 essential tips to help you package your items correctly.</p>
        
        <h3>1. Choose the Right Box</h3>
        <p>Use a sturdy box that can withstand the journey. Avoid reusing old boxes that may have lost their structural integrity.</p>
        
        <h3>2. Use Quality Packing Materials</h3>
        <p>Invest in good quality bubble wrap, packing peanuts, or foam inserts to protect your items during transit.</p>
        
        <h3>3. Wrap Items Individually</h3>
        <p>Each item should be wrapped separately to prevent them from rubbing against each other and getting damaged.</p>
        
        <h3>4. Fill Empty Spaces</h3>
        <p>Fill any empty spaces in the box with packing materials to prevent items from shifting during transit.</p>
        
        <h3>5. Seal Properly</h3>
        <p>Use strong packing tape and seal all seams and edges of the box securely.</p>
        
        <p>Following these tips will help ensure your parcels arrive safely at their destination!</p>
      `,
      coverImage: '/uploads/blog/sample-cover-1.jpg',
      author: 'Village Express Team',
      isPublished: true,
      publishedAt: new Date(),
      metaTitle: '5 Tips for Packaging Your Parcels Safely | Village Express',
      metaDescription: 'Learn how to package your items properly to ensure they arrive safely at their destination with these 5 essential tips.',
      metaKeywords: 'packaging, delivery tips, parcel safety, shipping',
      categories: {
        create: [
          { categoryId: categories[0].id },
        ],
      },
      tags: {
        create: [
          { tagId: tags[0].id },
          { tagId: tags[5].id },
        ],
      },
    },
  })

  const blog2 = await prisma.blog.create({
    data: {
      title: 'Introducing Real-Time Parcel Tracking',
      slug: 'introducing-real-time-parcel-tracking',
      excerpt: 'We are excited to announce our new real-time tracking feature that lets you track your parcels every step of the way.',
      content: `
        <h2>New Feature: Real-Time Tracking</h2>
        <p>We are thrilled to announce the launch of our new real-time parcel tracking feature. Now you can track your parcels every step of the journey from pickup to delivery.</p>
        
        <h3>How It Works</h3>
        <p>Simply enter your booking number in our tracking section to see the real-time status of your parcel. You will receive updates at every milestone:</p>
        <ul>
          <li>Parcel picked up</li>
          <li>In transit to hub</li>
          <li>Out for delivery</li>
          <li>Delivered</li>
        </ul>
        
        <h3>Benefits</h3>
        <p>With real-time tracking, you can:</p>
        <ul>
          <li>Know exactly where your parcel is</li>
          <li>Plan your schedule around delivery times</li>
          <li>Get instant notifications on status changes</li>
          <li>Have peace of mind knowing your parcel is on its way</li>
        </ul>
        
        <p>Try it out today and experience the convenience of real-time tracking!</p>
      `,
      coverImage: '/uploads/blog/sample-cover-2.jpg',
      author: 'Village Express Team',
      isPublished: true,
      publishedAt: new Date(),
      metaTitle: 'Introducing Real-Time Parcel Tracking | Village Express',
      metaDescription: 'Track your parcels in real-time with our new tracking feature. Get instant updates at every milestone of your delivery journey.',
      metaKeywords: 'tracking, real-time, feature, announcement',
      categories: {
        create: [
          { categoryId: categories[2].id },
        ],
      },
      tags: {
        create: [
          { tagId: tags[1].id },
          { tagId: tags[6].id },
          { tagId: tags[7].id },
        ],
      },
    },
  })

  const blog3 = await prisma.blog.create({
    data: {
      title: 'Expanding Our Rural Delivery Network',
      slug: 'expanding-our-rural-delivery-network',
      excerpt: 'We are expanding our delivery network to reach more rural areas and villages across Telangana.',
      content: `
        <h2>Reaching More Villages</h2>
        <p>At Village Express, our mission is to connect every village with reliable delivery services. We are excited to announce our expansion into new rural areas across Telangana.</p>
        
        <h3>New Coverage Areas</h3>
        <p>We have added delivery points in the following areas:</p>
        <ul>
          <li>Jagitial district - 15 new points</li>
          <li>Karimnagar district - 20 new points</li>
          <li>Warangal district - 12 new points</li>
          <li>Nizamabad district - 10 new points</li>
        </ul>
        
        <h3>What This Means for You</h3>
        <p>If you live in any of these areas, you can now:</p>
        <ul>
          <li>Send parcels to any location in our network</li>
          <li>Receive parcels from anywhere in India</li>
          <li>Enjoy our express delivery services</li>
          <li>Track your parcels in real-time</li>
        </ul>
        
        <p>We are committed to bringing reliable delivery services to every corner of Telangana. Stay tuned for more updates!</p>
      `,
      coverImage: '/uploads/blog/sample-cover-3.jpg',
      author: 'Village Express Team',
      isPublished: true,
      publishedAt: new Date(),
      metaTitle: 'Expanding Our Rural Delivery Network | Village Express',
      metaDescription: 'We are expanding our delivery network to reach more rural areas and villages across Telangana. Check if your area is now covered.',
      metaKeywords: 'rural delivery, expansion, network, telangana',
      categories: {
        create: [
          { categoryId: categories[1].id },
          { categoryId: categories[2].id },
        ],
      },
      tags: {
        create: [
          { tagId: tags[3].id },
          { tagId: tags[6].id },
        ],
      },
    },
  })

  const blog4 = await prisma.blog.create({
    data: {
      title: 'Meet Our Captain of the Month: Ramesh',
      slug: 'meet-our-captain-of-the-month-ramesh',
      excerpt: 'Get to know Ramesh, one of our most dedicated delivery captains who has completed over 1000 successful deliveries.',
      content: `
        <h2>Captain Spotlight: Ramesh</h2>
        <p>This month, we are proud to feature Ramesh as our Captain of the Month. Ramesh has been with Village Express for over 2 years and has completed over 1000 successful deliveries.</p>
        
        <h3>About Ramesh</h3>
        <p>Ramesh is based in Karimnagar and covers the Jagitial-Karimnagar route. He is known for his punctuality, friendly demeanor, and commitment to customer satisfaction.</p>
        
        <h3>What Makes Ramesh Special</h3>
        <ul>
          <li>100% on-time delivery rate</li>
          <li>Zero damaged parcels</li>
          <li>Consistently receives 5-star ratings from customers</li>
          <li>Mentors new captains on best practices</li>
        </ul>
        
        <h3>Ramesh's Tips for New Captains</h3>
        <p>"Always treat every parcel as if it were your own. Communication is key - keep customers informed about their delivery status. And most importantly, safety first - both yours and the parcel's."</p>
        
        <p>Thank you, Ramesh, for your dedication and excellent service!</p>
      `,
      coverImage: '/uploads/blog/sample-cover-4.jpg',
      author: 'Village Express Team',
      isPublished: true,
      publishedAt: new Date(),
      metaTitle: 'Meet Our Captain of the Month: Ramesh | Village Express',
      metaDescription: 'Get to know Ramesh, one of our most dedicated delivery captains who has completed over 1000 successful deliveries with 100% on-time rate.',
      metaKeywords: 'captain, spotlight, ramesh, delivery, customer service',
      categories: {
        create: [
          { categoryId: categories[4].id },
        ],
      },
      tags: {
        create: [
          { tagId: tags[4].id },
        ],
      },
    },
  })

  const blog5 = await prisma.blog.create({
    data: {
      title: 'How to Track Your Parcel: A Step-by-Step Guide',
      slug: 'how-to-track-your-parcel-step-by-step-guide',
      excerpt: 'Learn how to use our parcel tracking feature to stay updated on your delivery status.',
      content: `
        <h2>Tracking Your Parcel Made Easy</h2>
        <p>Tracking your parcel with Village Express is simple and straightforward. Follow this step-by-step guide to stay updated on your delivery status.</p>
        
        <h3>Step 1: Get Your Booking Number</h3>
        <p>When you book a delivery, you will receive a booking number via SMS and email. Keep this number handy for tracking.</p>
        
        <h3>Step 2: Visit Our Website or App</h3>
        <p>Go to our website or open the Village Express app and navigate to the tracking section.</p>
        
        <h3>Step 3: Enter Your Booking Number</h3>
        <p>Enter your booking number in the tracking field and click "Track".</p>
        
        <h3>Step 4: View Real-Time Status</h3>
        <p>You will see the current status of your parcel along with a timeline of all updates.</p>
        
        <h3>Step 5: Enable Notifications</h3>
        <p>Turn on push notifications to receive instant updates on your phone whenever your parcel status changes.</p>
        
        <p>That's it! You now have full visibility into your parcel's journey from pickup to delivery.</p>
      `,
      coverImage: '/uploads/blog/sample-cover-5.jpg',
      author: 'Village Express Team',
      isPublished: true,
      publishedAt: new Date(),
      metaTitle: 'How to Track Your Parcel: Step-by-Step Guide | Village Express',
      metaDescription: 'Learn how to use our parcel tracking feature with this easy step-by-step guide. Stay updated on your delivery status.',
      metaKeywords: 'tracking, guide, how-to, parcel status',
      categories: {
        create: [
          { categoryId: categories[0].id },
        ],
      },
      tags: {
        create: [
          { tagId: tags[1].id },
          { tagId: tags[5].id },
        ],
      },
    },
  })

  // Draft blog post
  const blog6 = await prisma.blog.create({
    data: {
      title: 'Upcoming Holiday Schedule Changes',
      slug: 'upcoming-holiday-schedule-changes',
      excerpt: 'Please note the changes to our delivery schedule during the upcoming holiday season.',
      content: '<p>Draft content - to be completed...</p>',
      author: 'Village Express Team',
      isPublished: false,
      metaTitle: 'Holiday Schedule Changes | Village Express',
      metaDescription: 'Important information about delivery schedule changes during holidays.',
      metaKeywords: 'holiday, schedule, delivery',
      categories: {
        create: [
          { categoryId: categories[1].id },
        ],
      },
      tags: {
        create: [
          { tagId: tags[6].id },
        ],
      },
    },
  })

  console.log(`✅ 6 blog posts seeded (5 published, 1 draft)`)

  console.log('🎉 Blog seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding blog data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
