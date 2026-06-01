'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TruckIcon,
  PackageSearch,
  Wallet,
  IndianRupee,
  MapPin,
  Clock,
  CheckCircle2,
  MessageSquare,
  Settings,
  History,
  Star,
  TrendingUp,
  ArrowRight,
  Phone,
  Navigation,
  Shield
} from 'lucide-react'

const featureCategories = [
  {
    title: 'My Assignments',
    icon: PackageSearch,
    color: 'blue',
    features: [
      { name: 'Active Deliveries', description: 'View your current pickup and delivery assignments', href: '/captain' },
      { name: 'Delivery History', description: 'View your past delivery records', href: '/bookings/my' },
      { name: 'Route Navigation', description: 'Get navigation to pickup and drop locations', href: '/captain' },
    ]
  },
  {
    title: 'Earnings & Wallet',
    icon: Wallet,
    color: 'green',
    features: [
      { name: 'My Wallet', description: 'View wallet balance and transaction history', href: '/wallet' },
      { name: 'Request Withdrawal', description: 'Withdraw earnings to bank account or UPI', href: '/withdrawals' },
      { name: 'Earnings Report', description: 'View daily and weekly earnings summary', href: '/commissions' },
    ]
  },
  {
    title: 'Support & Help',
    icon: MessageSquare,
    color: 'purple',
    features: [
      { name: 'Support Tickets', description: 'Create and track support requests', href: '/captain/support' },
      { name: 'Technical Issues', description: 'Report app crashes or technical problems', href: '/captain/support' },
      { name: 'KYC Verification', description: 'Check KYC verification status', href: '/captain/support' },
    ]
  },
  {
    title: 'Account Settings',
    icon: Settings,
    color: 'gray',
    features: [
      { name: 'My Profile', description: 'Update your profile information', href: '/profile' },
      { name: 'Vehicle Details', description: 'Manage your vehicle information', href: '/profile' },
      { name: 'Availability Status', description: 'Set your availability for assignments', href: '/profile' },
    ]
  },
]

const colorMap = {
  blue: 'bg-blue-100 text-blue-600 border-blue-200',
  green: 'bg-green-100 text-green-600 border-green-200',
  purple: 'bg-purple-100 text-purple-600 border-purple-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function CaptainWelcomePage() {
  const { user, hasRole } = useAuth()
  const router = useRouter()

  if (!hasRole('CAPTAIN')) {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Captain Portal</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.name}. Manage your deliveries and earnings.
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Captain
          </Badge>
          <span className="text-sm text-muted-foreground">{user?.displayId}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickStatCard
          icon={PackageSearch}
          label="Active Assignments"
          value="View"
          color="blue"
          href="/captain"
        />
        <QuickStatCard
          icon={CheckCircle2}
          label="Delivered Today"
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
        <QuickStatCard
          icon={TrendingUp}
          label="This Week Earnings"
          value="View"
          color="green"
          href="/commissions"
        />
      </div>

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

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Navigation className="h-4 w-4 text-blue-600" />
                <span>Start Delivery</span>
              </div>
              <p className="text-sm text-muted-foreground">View and start your assigned deliveries</p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="/captain">View Assignments</a>
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="h-4 w-4 text-green-600" />
                <span>Check Earnings</span>
              </div>
              <p className="text-sm text-muted-foreground">View your current wallet balance</p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="/wallet">Go to Wallet</a>
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <span>Need Help?</span>
              </div>
              <p className="text-sm text-muted-foreground">Create a support ticket for assistance</p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="/captain/support">Get Support</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safety Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Verify Recipient</p>
                <p className="text-xs text-muted-foreground">Always verify recipient identity before handing over parcels</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Take Delivery Proof</p>
                <p className="text-xs text-muted-foreground">Capture photo or signature as delivery proof</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Safe Route Navigation</p>
                <p className="text-xs text-muted-foreground">Follow suggested routes for safe and timely delivery</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Report Issues</p>
                <p className="text-xs text-muted-foreground">Report any delivery issues immediately through support</p>
              </div>
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
