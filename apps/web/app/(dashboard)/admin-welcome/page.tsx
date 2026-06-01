'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  MapPin,
  PackageSearch,
  Settings,
  BarChart3,
  Ticket,
  Wallet,
  TruckIcon,
  IndianRupee,
  Shield,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  LayoutGrid,
  ArrowRight
} from 'lucide-react'

const featureCategories = [
  {
    title: 'User Management',
    icon: Users,
    color: 'blue',
    features: [
      { name: 'View All Users', description: 'Manage and view all registered users', href: '/users' },
      { name: 'Pending Approvals', description: 'Approve or reject new user registrations', href: '/approvals' },
      { name: 'Role Management', description: 'Configure user roles and permissions', href: '/settings/roles' },
    ]
  },
  {
    title: 'Location & Routes',
    icon: MapPin,
    color: 'green',
    features: [
      { name: 'Manage Locations', description: 'Add and manage delivery points and hubs', href: '/locations' },
      { name: 'Route Configuration', description: 'Set up multi-segment delivery routes', href: '/routes' },
      { name: 'Captain Assignments', description: 'Assign captains to points and routes', href: '/captains-by-point' },
    ]
  },
  {
    title: 'Booking Management',
    icon: PackageSearch,
    color: 'purple',
    features: [
      { name: 'All Bookings', description: 'View and manage all system bookings', href: '/bookings' },
      { name: 'Booking Analytics', description: 'Track booking statistics and trends', href: '/reports' },
      { name: 'Refund Requests', description: 'Process and manage refund requests', href: '/refunds' },
    ]
  },
  {
    title: 'Financial Management',
    icon: IndianRupee,
    color: 'yellow',
    features: [
      { name: 'Commission Reports', description: 'View captain and PM commission data', href: '/commissions' },
      { name: 'COD Remittances', description: 'Track COD collections and remittances', href: '/cod-remittances' },
      { name: 'Withdrawal Requests', description: 'Process captain withdrawal requests', href: '/withdrawals' },
      { name: 'Payment Settings', description: 'Configure payment gateways', href: '/settings/payment' },
    ]
  },
  {
    title: 'Support System',
    icon: Ticket,
    color: 'red',
    features: [
      { name: 'Support Dashboard', description: 'View all support tickets and analytics', href: '/admin-support' },
      { name: 'Ticket Management', description: 'Assign and resolve support tickets', href: '/admin-support' },
      { name: 'Canned Responses', description: 'Manage response templates', href: '/admin-support' },
    ]
  },
  {
    title: 'System Settings',
    icon: Settings,
    color: 'gray',
    features: [
      { name: 'Pricing Rules', description: 'Configure delivery pricing', href: '/settings/pricing' },
      { name: 'Commission Settings', description: 'Set commission rates', href: '/settings/commissions' },
      { name: 'Vehicle Configurations', description: 'Manage vehicle types and pricing', href: '/vehicle-configurations' },
      { name: 'Coupon Management', description: 'Create and manage discount coupons', href: '/coupons' },
    ]
  },
  {
    title: 'Content Management',
    icon: FileText,
    color: 'teal',
    features: [
      { name: 'Blog Management', description: 'Manage blog posts and content', href: '/admin-blogs' },
      { name: 'Testimonials', description: 'Manage customer testimonials', href: '/admin-testimonials' },
      { name: 'Contact Submissions', description: 'View contact form submissions', href: '/admin-contact-submissions' },
    ]
  },
  {
    title: 'Analytics & Reports',
    icon: BarChart3,
    color: 'indigo',
    features: [
      { name: 'Dashboard Analytics', description: 'View overall system analytics', href: '/dashboard' },
      { name: 'Performance Reports', description: 'Generate detailed performance reports', href: '/reports' },
      { name: 'Audit Logs', description: 'View system activity logs', href: '/audit-logs' },
    ]
  },
]

const colorMap = {
  blue: 'bg-blue-100 text-blue-600 border-blue-200',
  green: 'bg-green-100 text-green-600 border-green-200',
  purple: 'bg-purple-100 text-purple-600 border-purple-200',
  yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
  red: 'bg-red-100 text-red-600 border-red-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  teal: 'bg-teal-100 text-teal-600 border-teal-200',
  indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200',
}

export default function AdminWelcomePage() {
  const { user, hasRole } = useAuth()
  const router = useRouter()

  if (!hasRole('ADMIN') && !hasRole('SUPER_ADMIN')) {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Portal</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.name}. Manage all aspects of the Village Express platform.
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            {hasRole('SUPER_ADMIN') ? 'Super Admin' : 'Admin'}
          </Badge>
          <span className="text-sm text-muted-foreground">{user?.displayId}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickStatCard
          icon={Users}
          label="Total Users"
          value="View"
          color="blue"
          href="/users"
        />
        <QuickStatCard
          icon={PackageSearch}
          label="Total Bookings"
          value="View"
          color="purple"
          href="/bookings"
        />
        <QuickStatCard
          icon={Ticket}
          label="Support Tickets"
          value="View"
          color="red"
          href="/admin-support"
        />
        <QuickStatCard
          icon={TrendingUp}
          label="Analytics"
          value="View"
          color="indigo"
          href="/reports"
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

      {/* Getting Started */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Step 1</span>
              </div>
              <p className="text-sm text-muted-foreground">Review pending user approvals</p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="/approvals">Go to Approvals</a>
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Step 2</span>
              </div>
              <p className="text-sm text-muted-foreground">Check support tickets requiring attention</p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="/admin-support">View Support Tickets</a>
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span>Step 3</span>
              </div>
              <p className="text-sm text-muted-foreground">Review today's booking analytics</p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="/dashboard">View Dashboard</a>
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
