'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Store, CheckCircle2, Clock, TrendingUp, Shield, MapPin, IndianRupee, Users, ArrowRight, Truck, Phone, Mail, Building2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PublicHeader } from '@/components/public-header'

export default function PointManagerRegistrationPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    shopName: '',
    shopAddress: '',
    village: '',
    district: '',
    state: '',
    pincode: '',
    shopType: '',
    operatingHours: '',
    hasStorage: '',
    storageCapacity: '',
    experience: '',
    whyJoin: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    // TODO: Implement form submission
    setTimeout(() => {
      setSubmitting(false)
      alert('Application submitted successfully! We will contact you shortly.')
    }, 2000)
  }

  const benefits = [
    {
      icon: IndianRupee,
      title: 'Earn Commission',
      description: 'Get commission on every parcel received, handed over, and COD collected at your point'
    },
    {
      icon: Clock,
      title: 'Flexible Hours',
      description: 'Operate during your shop hours. No fixed timings required'
    },
    {
      icon: TrendingUp,
      title: 'Growing Network',
      description: 'Be part of an expanding network with increasing parcel volumes'
    },
    {
      icon: Shield,
      title: 'Risk-Free',
      description: 'No investment required. Use your existing shop infrastructure'
    },
    {
      icon: Users,
      title: 'Community Impact',
      description: 'Enable your village to send and receive parcels easily'
    },
    {
      icon: MapPin,
      title: 'Prime Location',
      description: 'Your shop becomes a recognized delivery point in the area'
    }
  ]

  const process = [
    {
      step: 1,
      title: 'Apply Online',
      description: 'Fill out the registration form with your shop and contact details'
    },
    {
      step: 2,
      title: 'Verification',
      description: 'Our team will verify your location and shop details'
    },
    {
      step: 3,
      title: 'Training',
      description: 'Receive training on our system and processes'
    },
    {
      step: 4,
      title: 'Go Live',
      description: 'Start receiving parcels and earning commissions'
    }
  ]

  const requirements = [
    'Must have a physical shop or commercial space',
    'Shop should be open for at least 8 hours daily',
    'Adequate storage space for parcels',
    'Valid government ID proof',
    'Active bank account for commission payouts',
    'Basic smartphone with internet access',
    'Good reputation in the local community'
  ]

  const faqs = [
    {
      question: 'What is the commission structure?',
      answer: 'Point managers earn commission on every transaction - receiving parcels (₹5-10 per parcel), handing over parcels (₹5-10 per parcel), and COD collections (1-2% of COD amount).'
    },
    {
      question: 'Do I need to invest anything?',
      answer: 'No investment is required. You can use your existing shop infrastructure. We provide the training and system access.'
    },
    {
      question: 'How do I receive payments?',
      answer: 'Commissions are credited directly to your registered bank account on a weekly basis.'
    },
    {
      question: 'What if I\'m not available for a day?',
      answer: 'You can mark your availability in our app. We\'ll route parcels to alternative points when you\'re unavailable.'
    },
    {
      question: 'Can I have multiple delivery points?',
      answer: 'Initially, you can register one location. After establishing a good track record, you can apply for additional points.'
    }
  ]

  return (
    <div className="min-h-screen">
      <PublicHeader />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full mb-4">
              <Store className="h-4 w-4" />
              <span className="text-sm font-medium">Point Manager Partnership</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Become a Point Manager
            </h1>
            <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
              Turn your shop into a delivery hub. Earn commissions while serving your community.
            </p>
            <Link href="/register/point-manager">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                <ArrowRight className="h-5 w-5 mr-2" />
                Apply Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Benefits of Being a Point Manager</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Why shop owners choose to partner with us</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition">
                <CardHeader>
                  <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                    <benefit.icon className="w-7 h-7 text-primary" />
                  </div>
                  <CardTitle>{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Simple 4-step process to become a Point Manager</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {process.map((item) => (
              <div key={item.step} className="text-center">
                <div className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Requirements</h2>
              <p className="text-muted-foreground">What you need to become a Point Manager</p>
            </div>
            <Card>
              <CardContent className="p-8">
                <ul className="space-y-4">
                  {requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">Common questions about Point Manager partnership</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
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
          <Link href="/register/point-manager">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              <ArrowRight className="h-5 w-5 mr-2" />
              Register as Point Manager
            </Button>
          </Link>
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
