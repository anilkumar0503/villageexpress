'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, PackageSearch, MapPin,
  Users, CheckSquare, Settings, LogOut, Menu, X, ChevronRight, Truck, ShieldCheck, UserCircle, Plus, Route, IndianRupee, QrCode, Percent, Wallet, Bell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAuth, useAuthSync } from '@/hooks/use-auth'
import { useNotifications } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

type NavItem = { label: string; href: string; icon: React.ElementType; roles?: string[] }
type NavSection = { title: string; items: NavItem[] }

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Quick Scan', href: '/scan', icon: QrCode },
    ],
  },
  {
    title: 'Customer',
    items: [
      { label: 'My Bookings', href: '/bookings/my', icon: PackageSearch, roles: ['CUSTOMER'] },
      { label: 'New Booking', href: '/bookings/new', icon: Plus, roles: ['CUSTOMER'] },
      { label: 'My Wallet', href: '/wallet', icon: IndianRupee, roles: ['CUSTOMER', 'CAPTAIN', 'POINT_MANAGER'] },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'My Assignments', href: '/captain', icon: Truck, roles: ['CAPTAIN'] },
      { label: 'My Point Queue', href: '/bookings/point-manager', icon: PackageSearch, roles: ['POINT_MANAGER'] },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'All Bookings', href: '/bookings', icon: PackageSearch, roles: ['SUPER_ADMIN', 'ADMIN', 'FRANCHISE_OWNER'] },
      { label: 'Coupons', href: '/coupons', icon: IndianRupee, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Refunds', href: '/refunds', icon: IndianRupee, roles: ['CUSTOMER', 'POINT_MANAGER', 'SUPER_ADMIN', 'ADMIN'] },
      { label: 'Approvals', href: '/approvals', icon: CheckSquare, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Users', href: '/users', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Commissions', href: '/commissions', icon: IndianRupee, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'COD Management', href: '/cod', icon: Wallet, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'COD Remittances', href: '/cod-remittances', icon: Wallet, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Withdrawals', href: '/withdrawals', icon: IndianRupee, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Captains by Point', href: '/captains-by-point', icon: Truck, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Locations', href: '/locations', icon: MapPin, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Routes', href: '/routes', icon: Route, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Reports', href: '/reports', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN', 'POINT_MANAGER'] },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Vehicle Configurations', href: '/vehicle-configurations', icon: Truck, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Payment Settings', href: '/settings/payment', icon: Wallet, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Commission Rules', href: '/settings/commissions', icon: Percent, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Pricing Rules', href: '/settings/pricing', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Roles & Permissions', href: '/settings/roles', icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
    ],
  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, accessToken, clearAuth, hasRole } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  useNotifications()
  useAuthSync()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !accessToken) router.replace('/login')
  }, [mounted, accessToken, router])

  useEffect(() => {
    if (accessToken && !user) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            const { setAuth } = useAuth.getState()
            setAuth(d.data.user, accessToken)
          } else if (d.code === 'TOKEN_EXPIRED') {
            const { clearAuth } = useAuth.getState()
            clearAuth()
            document.cookie = 'access_token=; path=/; max-age=0'
            document.cookie = 'refresh_token=; path=/; max-age=0'
            router.replace('/login?expired=true')
          }
        })
        .catch(() => {})
    }
  }, [accessToken, user, router])

  useEffect(() => {
    if (accessToken) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000) // Refresh every 30s
      return () => clearInterval(interval)
    }
  }, [accessToken])

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const d = await res.json()
      if (d.success) {
        setNotifications(d.data)
        setUnreadCount(d.data.filter((n: any) => !n.read).length)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  async function markAsRead(notificationIds: string[]) {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}` 
        },
        body: JSON.stringify({ notificationIds }),
      })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
    }
  }

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.jpeg" alt="Village Express" className="w-8 h-8 rounded-lg" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  if (!accessToken || !user) return null

  const visibleNavSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.some((r) => hasRole(r))),
  })).filter((section) => section.items.length > 0)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    clearAuth()
    router.replace('/login')
  }

  const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-5">
        <img src="/logo.jpeg" alt="Village Express" className="w-8 h-8 rounded-lg" />
        <span className="font-semibold text-sm">Village Express</span>
      </div>

      <Separator />

      <nav className="flex-1 px-2 py-4 space-y-4 overflow-y-auto">
        {visibleNavSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 text-xs font-semibold text-muted-foreground mb-2">{section.title}</p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                    {active && <ChevronRight className="h-3 w-3 ml-auto" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <Separator />

      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.displayId}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r bg-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-60 flex flex-col bg-sidebar border-r z-50">
            <Button variant="ghost" size="icon" className="absolute top-3 right-3" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b bg-background">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-sm">Village Express</span>
          <div className="ml-auto relative">
            <Button variant="ghost" size="icon" onClick={() => setNotificationsOpen(!notificationsOpen)}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
            {notificationsOpen && (
              <Card className="absolute right-0 top-full mt-2 w-80 z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notifications.filter((n) => !n.read).map((n) => n.id))}>
                        Mark all read
                      </Button>
                    )}
                  </div>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 hover:bg-accent cursor-pointer ${!notification.read ? 'bg-accent/50' : ''}`}
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead([notification.id])
                          }
                          if (notification.bookingId) {
                            router.push(`/bookings/${notification.bookingId}`)
                          }
                          setNotificationsOpen(false)
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${!notification.read ? 'bg-blue-500' : 'bg-gray-300'}`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.createdAt).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
