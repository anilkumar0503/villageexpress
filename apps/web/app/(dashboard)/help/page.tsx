'use client'

import { HelpCircle, Package, Truck, CreditCard, User, MapPin, Clock, IndianRupee } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const faqs = [
  {
    category: 'Booking',
    icon: Package,
    questions: [
      {
        q: 'How do I book a delivery?',
        a: 'Navigate to the "New Booking" page, select your pickup and drop locations, choose your parcel type and delivery priority, then submit your booking. You can pay via wallet, COD, or online payment.',
      },
      {
        q: 'Can I schedule a delivery for a later date?',
        a: 'Yes! During booking, select "Schedule for Later" under Delivery Timing and choose your preferred date and time slot.',
      },
      {
        q: 'What are the delivery options?',
        a: 'We offer Same Day and Next Day delivery for ASAP bookings. You can also schedule deliveries for specific dates with time slots from 9 AM to 9 PM.',
      },
      {
        q: 'How is the delivery price calculated?',
        a: 'The price is based on distance between pickup and drop locations, parcel weight, delivery priority (Standard/Express/Overnight), and vehicle type selected.',
      },
    ],
  },
  {
    category: 'Payment',
    icon: CreditCard,
    questions: [
      {
        q: 'What payment methods are available?',
        a: 'You can pay using your wallet balance, Cash on Delivery (COD), or online payment via Razorpay (if enabled).',
      },
      {
        q: 'How do I recharge my wallet?',
        a: 'Go to the Wallet page and click "Recharge". Enter the amount and complete the payment using Razorpay. The amount will be added to your wallet instantly.',
      },
      {
        q: 'Can I pay partially?',
        a: 'Yes! When paying with wallet, you can choose to pay a partial amount (up to 50%) now and the remaining amount later.',
      },
      {
        q: 'How do I withdraw money from my wallet?',
        a: 'Go to the Wallet page, add your payout details (UPI or bank account), then click "Withdraw" to transfer funds to your account.',
      },
    ],
  },
  {
    category: 'Tracking',
    icon: Truck,
    questions: [
      {
        q: 'How can I track my delivery?',
        a: 'Go to the My Bookings page and click on any booking to view its real-time status. You can see when it is picked up, in transit, and delivered.',
      },
      {
        q: 'What are the different booking statuses?',
        a: 'Pending → Assigned → Picked Up → In Transit → Delivered. Bookings can also be Cancelled if needed.',
      },
      {
        q: 'Will I receive notifications about my delivery?',
        a: 'Yes, you will receive in-app notifications for status updates. Make sure to enable notifications in your browser.',
      },
    ],
  },
  {
    category: 'Locations',
    icon: MapPin,
    questions: [
      {
        q: 'What locations do you serve?',
        a: 'We serve multiple villages and districts. Check the location dropdown during booking to see available pickup and drop points.',
      },
      {
        q: 'Can I save my favorite locations?',
        a: 'Yes! Click "Add to Favorites" next to any location during booking. You can manage your favorites from the Favorites page.',
      },
      {
        q: 'How do I use the "Book Again" feature?',
        a: 'On any completed booking, click "Book Again" to quickly create a new booking with the same locations and receiver details.',
      },
    ],
  },
  {
    category: 'Account',
    icon: User,
    questions: [
      {
        q: 'How do I update my profile?',
        a: 'Go to your profile settings to update your name, phone number, and other details.',
      },
      {
        q: 'Can I rate my captain?',
        a: 'Yes! After a delivery is completed, you can rate your captain and leave feedback on the booking detail page.',
      },
      {
        q: 'How do I view my booking history?',
        a: 'Go to the Dashboard to see your recent bookings. You can filter by status, date range, or search by booking number.',
      },
    ],
  },
  {
    category: 'Support',
    icon: HelpCircle,
    questions: [
      {
        q: 'How do I contact support?',
        a: 'You can reach out to our support team through the help section or by creating a support ticket from your dashboard.',
      },
      {
        q: 'What if my delivery is delayed?',
        a: 'Check the tracking page for real-time updates. If there is an unusual delay, contact support with your booking number.',
      },
      {
        q: 'Can I cancel my booking?',
        a: 'Yes, you can cancel bookings that are in "Pending" status from the booking detail page. Cancellations may be subject to our cancellation policy.',
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Help & FAQ</h1>
        <p className="text-muted-foreground">Find answers to common questions about our delivery service</p>
      </div>

      {faqs.map((category) => (
        <Card key={category.category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <category.icon className="h-5 w-5" />
              {category.category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {category.questions.map((faq, idx) => (
                <div key={idx} className="border-b last:border-0 pb-4 last:pb-0">
                  <h3 className="font-medium mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Still need help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Can't find what you're looking for? Our support team is here to help you.
          </p>
          <div className="flex gap-3">
            <Button variant="outline">Create Support Ticket</Button>
            <Button variant="outline">Contact Us</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
