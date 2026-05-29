'use client'

import Link from 'next/link'
import { Truck, MapPin, Users, TrendingUp, Shield, Clock, ArrowRight, CheckCircle2, Store, Bike } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PublicHeader } from '@/components/public-header'

export default function PartnerWithUsPage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground py-20 md:py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Partner with Village Express
            </h1>
            <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
              Join our growing network of Point Managers and Captains. Earn income while connecting villages across India.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register/point-manager">
                <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90">
                  <Store className="h-5 w-5 mr-2" />
                  Become a Point Manager
                </Button>
              </Link>
              <Link href="/register/captain">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-primary hover:bg-white/10">
                  <Bike className="h-5 w-5 mr-2" />
                  Become a Captain
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Partner Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Partner With Us?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Join a trusted network with proven benefits and growth opportunities</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-border hover:shadow-lg transition">
              <CardHeader>
                <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-7 h-7 text-primary" />
                </div>
                <CardTitle>Earn Good Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Competitive commissions on every delivery and COD collection processed through your point.</p>
              </CardContent>
            </Card>
            <Card className="border-border hover:shadow-lg transition">
              <CardHeader>
                <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="w-7 h-7 text-primary" />
                </div>
                <CardTitle>Flexible Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Work on your own schedule. Be your own boss and manage your time efficiently.</p>
              </CardContent>
            </Card>
            <Card className="border-border hover:shadow-lg transition">
              <CardHeader>
                <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <CardTitle>Community Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Connect your village to the broader network and enable essential services for your community.</p>
              </CardContent>
            </Card>
            <Card className="border-border hover:shadow-lg transition">
              <CardHeader>
                <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <CardTitle>Full Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Training, tools, and ongoing support to help you succeed in your role.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Role Comparison */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Choose Your Role</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Select the partnership that fits your skills and resources</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="border-2 border-primary bg-primary/5">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary w-12 h-12 rounded-xl flex items-center justify-center">
                    <Store className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl">Point Manager</CardTitle>
                </div>
                <CardDescription className="text-base">Manage a delivery point in your village or shop</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">Receive and handover parcels at your location</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">Collect COD payments from customers</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">Earn commission on every transaction</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">No vehicle required - operate from your shop</p>
                  </div>
                </div>
                <Link href="/register/point-manager">
                  <Button className="w-full">
                    Apply as Point Manager
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-border hover:border-primary transition">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary w-12 h-12 rounded-xl flex items-center justify-center">
                    <Bike className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl">Captain</CardTitle>
                </div>
                <CardDescription className="text-base">Deliver parcels between points using your vehicle</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">Pick up and deliver parcels on assigned routes</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">Use your own bike or vehicle for deliveries</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">Get paid per delivery plus distance bonus</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">Flexible working hours and routes</p>
                  </div>
                </div>
                <Link href="/register/captain">
                  <Button className="w-full" variant="outline">
                    Apply as Captain
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Active Partners</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">200+</div>
              <div className="text-muted-foreground">Villages Covered</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">₹50L+</div>
              <div className="text-muted-foreground">Paid to Partners</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">4.8★</div>
              <div className="text-muted-foreground">Partner Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Join our network today and become part of India's village delivery revolution
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register/point-manager">
              <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90">
                <Store className="h-5 w-5 mr-2" />
                Join as Point Manager
              </Button>
            </Link>
            <Link href="/register/captain">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                <Bike className="h-5 w-5 mr-2" />
                Join as Captain
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 Village Express. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
