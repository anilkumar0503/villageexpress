'use client'

import Link from 'next/link'
import { Store, Truck, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/logo.jpeg" alt="Village Express" className="w-12 h-12 rounded-xl" />
          <h1 className="text-2xl font-bold tracking-tight">Join Village Express</h1>
          <p className="text-sm text-muted-foreground">Select your role to get started</p>
        </div>

        <div className="grid gap-4">
          <Link href="/login">
            <Card className="cursor-pointer hover:border-primary/60 hover:bg-accent transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-base">Customer</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Send parcels to anyone. Sign up instantly with email OTP - no password required.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/register/point-manager">
            <Card className="cursor-pointer hover:border-primary/60 hover:bg-accent transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-base">Point Manager</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Run a collection point in your area. Accept parcels from customers and hand off to captains.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/register/captain">
            <Card className="cursor-pointer hover:border-primary/60 hover:bg-accent transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-base">Captain (Delivery Partner)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Pick up and deliver parcels in your district. Earn per delivery with flexible hours.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already registered?{' '}
          <Link href="/login" className="text-primary underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
