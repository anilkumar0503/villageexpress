'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bike, CheckCircle2, Clock, TrendingUp, Shield, MapPin, IndianRupee, Users, ArrowRight, Truck, Phone, Mail, FileText, Fuel } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function CaptainRegistrationPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    address: '',
    village: '',
    district: '',
    state: '',
    pincode: '',
    vehicleType: '',
    vehicleNumber: '',
    drivingLicense: '',
    experience: '',
    preferredRoutes: '',
    availability: '',
    whyJoin: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
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
      title: 'Per Delivery Earnings',
      description: 'Get paid for every delivery completed, plus distance-based bonuses'
    },
    {
      icon: Clock,
      title: 'Flexible Schedule',
      description: 'Choose your working hours. Work part-time or full-time as per your convenience'
    },
    {
      icon: TrendingUp,
      title: 'Growth Opportunities',
      description: 'Grow with us - become a team lead or area manager with performance'
    },
    {
      icon: Fuel,
      title: 'Fuel Allowance',
      description: 'Get fuel allowance for long-distance deliveries and daily routes'
    },
    {
      icon: Shield,
      title: 'Insurance Coverage',
      description: 'Accident insurance coverage for captains during delivery hours'
    },
    {
      icon: MapPin,
      title: 'Local Routes',
      description: 'Get routes in and around your area - no need to travel far'
    }
  ]

  const process = [
    {
      step: 1,
      title: 'Apply Online',
      description: 'Fill out the registration form with your personal and vehicle details'
    },
    {
      step: 2,
      title: 'Document Verification',
      description: 'Submit your driving license and vehicle documents for verification'
    },
    {
      step: 3,
      title: 'Training & Onboarding',
      description: 'Complete training on delivery process, app usage, and safety protocols'
    },
    {
      step: 4,
      title: 'Start Delivering',
      description: 'Begin receiving delivery assignments and start earning'
    }
  ]

  const requirements = [
    'Valid driving license (2-wheeler or 4-wheeler)',
    'Own vehicle (bike, scooter, or small commercial vehicle)',
    'Smartphone with internet access',
    'Basic knowledge of local routes and areas',
    'Good physical health and fitness',
    'Valid government ID proof (Aadhaar/PAN)',
    'Bank account for earnings transfer',
    'Minimum age: 18 years'
  ]

  const faqs = [
    {
      question: 'How much can I earn as a Captain?',
      answer: 'Earnings vary based on number of deliveries and distance. On average, captains earn ₹300-800 per day working 6-8 hours. High-performing captains can earn ₹15,000-25,000 per month.'
    },
    {
      question: 'What type of vehicle do I need?',
      answer: 'You can use any 2-wheeler (bike/scooter) or small 4-wheeler for deliveries. The vehicle should be in good condition and have valid insurance.'
    },
    {
      question: 'Do I get fuel allowance?',
      answer: 'Yes, we provide fuel allowance for deliveries based on distance. Long-distance routes have higher fuel compensation.'
    },
    {
      question: 'What are the working hours?',
      answer: 'Working hours are flexible. You can choose to work morning, evening, or full-day shifts based on your availability and delivery demand in your area.'
    },
    {
      question: 'How do I receive delivery assignments?',
      answer: 'Assignments are sent through our mobile app. You can accept or reject based on your availability. The app shows delivery details, route, and payment information.'
    },
    {
      question: 'Is there any dress code or uniform?',
      answer: 'Yes, we provide a branded T-shirt and ID card that must be worn during deliveries for identification and brand visibility.'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/partner-with-us" className="flex items-center gap-2">
              <Truck className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Village Express</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/partner-with-us" className="text-sm font-medium hover:text-primary transition">Back</Link>
              <Link
                href="/login"
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition text-sm"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full mb-4">
              <Bike className="h-4 w-4" />
              <span className="text-sm font-medium">Captain Partnership</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Become a Captain
            </h1>
            <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
              Deliver parcels, earn money, and be your own boss. Join our delivery fleet today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register/captain">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                  <ArrowRight className="h-5 w-5 mr-2" />
                  Apply Now
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}>
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Benefits of Being a Captain</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Why delivery partners choose to work with us</p>
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
            <p className="text-muted-foreground max-w-2xl mx-auto">Simple 4-step process to become a Captain</p>
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
              <p className="text-muted-foreground">What you need to become a Captain</p>
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
              <p className="text-muted-foreground">Common questions about Captain partnership</p>
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
          <Link href="/register/captain">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              <ArrowRight className="h-5 w-5 mr-2" />
              Register as Captain
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
