'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  PackageSearch,
  MapPin,
  Clock,
  CheckCircle2,
  Wallet,
  IndianRupee,
  MessageSquare,
  Settings,
  History,
  Star,
  TrendingUp,
  ArrowRight,
  Plus,
  Heart,
  BarChart3,
  FileText,
  HeadphonesIcon,
  Phone
} from 'lucide-react'

const featureCategories = [
  {
    title: 'Bookings',
    icon: PackageSearch,
    color: 'blue',
    features: [
      { name: 'Create New Booking', description: 'Send a new parcel to any location', href: '/bookings/new' },
      { name: 'My Bookings', description: 'View all your parcel bookings', href: '/bookings/my' },
      { name: 'Track Parcel', description: 'Real-time tracking of your parcels', href: '/bookings/my' },
      { name: 'Booking History', description: 'View past booking records', href: '/bookings/my' },
    ]
  },
  {
    title: 'Locations',
    icon: MapPin,
    color: 'green',
    features: [
      { name: 'All Locations', description: 'View all available delivery points', href: '/bookings/new' },
      { name: 'Favorite Locations', description: 'Save frequently used addresses', href: '/favorites' },
      { name: 'Service Areas', description: 'Check areas we serve', href: '/bookings/new' },
    ]
  },
  {
    title: 'Payments & Wallet',
    icon: Wallet,
    color: 'purple',
    features: [
      { name: 'My Wallet', description: 'View wallet balance and add funds', href: '/wallet' },
      { name: 'Transaction History', description: 'View all payment transactions', href: '/wallet' },
      { name: 'Refund Requests', description: 'Request refunds for cancelled bookings', href: '/refunds' },
    ]
  },
  {
    title: 'Support & Help',
    icon: MessageSquare,
    color: 'red',
    features: [
      { name: 'Support Tickets', description: 'Create and track support requests', href: '/support' },
      { name: 'FAQ & Help', description: 'Get answers to common questions', href: '/help' },
      { name: 'Contact Us', description: 'Get in touch with our support team', href: '/help' },
    ]
  },
  {
    title: 'Account Settings',
    icon: Settings,
    color: 'gray',
    features: [
      { name: 'My Profile', description: 'Update your personal information', href: '/profile' },
      { name: 'Address Book', description: 'Manage saved addresses', href: '/favorites' },
      { name: 'Notification Settings', description: 'Configure notification preferences', href: '/profile' },
    ]
  },
  {
    title: 'Offers & Rewards',
    icon: Star,
    color: 'yellow',
    features: [
      { name: 'Available Coupons', description: 'View and apply discount coupons', href: '/bookings/new' },
      { name: 'Referral Program', description: 'Earn rewards by referring friends', href: '/help' },
      { name: 'Loyalty Points', description: 'View and redeem loyalty points', href: '/wallet' },
    ]
  },
]

const colorMap = {
  blue: 'bg-blue-100 text-blue-600 border-blue-200',
  green: 'bg-green-100 text-green-600 border-green-200',
  purple: 'bg-purple-100 text-purple-600 border-purple-200',
  red: 'bg-red-100 text-red-600 border-red-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
}

export default function CustomerWelcomePage() {
  const { user, hasRole } = useAuth()
  const router = useRouter()

  if (!hasRole('CUSTOMER')) {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Customer Portal</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.name}. Send parcels anywhere with Village Express.
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Customer
          </Badge>
          <span className="text-sm text-muted-foreground">{user?.displayId}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickStatCard
          icon={PackageSearch}
          label="Total Bookings"
          value="View"
          color="blue"
          href="/bookings/my"
        />
        <QuickStatCard
          icon={Clock}
          label="Active Shipments"
          value="View"
          color="yellow"
          href="/bookings/my"
        />
        <QuickStatCard
          icon={CheckCircle2}
          label="Delivered"
          value="View"
          color="green"
          href="/bookings/my"
        />
        <QuickStatCard
          icon={Wallet}
          label="Wallet Balance"
          value="View"
          color="purple"
          href="/wallet"
        />
      </div>

      {/* CTA Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Ready to send a parcel?</h3>
              <p className="text-blue-100">Create a new booking in just a few clicks</p>
            </div>
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50" asChild>
              <a href="/bookings/new">
                <Plus className="h-5 w-5 mr-2" />
                New Booking
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Categories */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">All Features</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {featureCategories.map((category) => (
            <Card key={category.title} className="overflow-hidden">
              <CardHeader className={`border-b ${colorMap[category.color as keyof typeof colorMap]?.split(' ')[0] || 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colorMap[category.color as keyof typeof colorMap]}`}>
                    <category.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {category.features.length} features available
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {category.features.map((feature) => (
                    <Button
                      key={feature.name}
                      variant="ghost"
                      className="w-full justify-between h-auto py-3 px-4 hover:bg-muted/50"
                      asChild
                    >
                      <a href={feature.href}>
                        <div className="text-left">
                          <p className="font-medium text-sm">{feature.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageSearch className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold">
                1
              </div>
              <h4 className="font-medium">Create Booking</h4>
              <p className="text-sm text-muted-foreground">Enter pickup and drop locations with parcel details</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600 font-bold">
                2
              </div>
              <h4 className="font-medium">Make Payment</h4>
              <p className="text-sm text-muted-foreground">Pay via UPI, card, wallet, or choose COD</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 font-bold">
                3
              </div>
              <h4 className="font-medium">Drop at Point</h4>
              <p className="text-sm text-muted-foreground">Hand over parcel to nearest Village Express point</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 font-bold">
                4
              </div>
              <h4 className="font-medium">Track & Receive</h4>
              <p className="text-sm text-muted-foreground">Track in real-time and receive at your doorstep</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeadphonesIcon className="h-5 w-5" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <span>Support Tickets</span>
              </div>
              <p className="text-sm text-muted-foreground">Create a support ticket for any issues</p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="/support">Create Ticket</a>
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>FAQ & Help</span>
              </div>
              <p className="text-sm text-muted-foreground">Find answers to common questions</p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="/help">View FAQ</a>
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4 text-green-600" />
                <span>Contact Us</span>
              </div>
              <p className="text-sm text-muted-foreground">Call our support team for immediate help</p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="/help">Contact Support</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function QuickStatCard({ icon: Icon, label, value, color, href }: {
  icon: React.ElementType
  label: string
  value: string
  color: keyof typeof colorMap
  href: string
}) {
  return (
    <a href={href} className="block">
      <Card className="hover:shadow-md transition-all cursor-pointer border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
            <div className={`p-3 rounded-xl ${colorMap[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  )
}
