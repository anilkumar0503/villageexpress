import Link from 'next/link'
import { Target, Users, Award, Heart } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">About Village Express</h1>
          <p className="text-xl text-primary-foreground/90">Connecting villages, delivering happiness</p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <p className="text-muted-foreground mb-4">
              Village Express was founded with a simple mission: to bridge the gap between urban and rural India through reliable parcel delivery services. We understand the challenges of sending parcels to remote villages and have built a network that ensures your packages reach their destination safely and on time.
            </p>
            <p className="text-muted-foreground mb-4">
              Starting from a single district, we have expanded our network across multiple states, serving thousands of customers daily. Our team of dedicated captains and point managers work tirelessly to ensure every parcel is handled with care.
            </p>
            <p className="text-muted-foreground">
              We believe that distance should never be a barrier to staying connected with your loved ones or conducting business. That's why we've made village parcel delivery our priority.
            </p>
          </div>
        </div>
      </section>

      {/* Our Mission & Vision */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground">
                To provide affordable, reliable, and fast parcel delivery services to every village in India, empowering rural communities and connecting them with the rest of the world.
              </p>
            </div>
            <div>
              <div className="bg-secondary w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
              <p className="text-muted-foreground">
                To become India's most trusted village delivery network, known for our commitment to customer satisfaction, innovation in logistics, and contribution to rural development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Customer First</h3>
              <p className="text-muted-foreground text-sm">Your satisfaction is our top priority</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Community Focus</h3>
              <p className="text-muted-foreground text-sm">Building trust in every village we serve</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Reliability</h3>
              <p className="text-muted-foreground text-sm">Delivering on our promises, every time</p>
            </div>
            <div className="text-center">
              <div className="bg-secondary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Innovation</h3>
              <p className="text-muted-foreground text-sm">Continuously improving our services</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-primary-foreground/90">Parcels Delivered</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-primary-foreground/90">Villages Served</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-primary-foreground/90">Districts Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-primary-foreground/90">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Journey</h2>
          <p className="text-muted-foreground mb-8">Be part of our mission to connect every village in India</p>
          <Link
            href="/login"
            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition inline-block"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-muted-foreground py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-foreground font-semibold mb-4">Village Express</h3>
              <p className="text-sm">Connecting villages with reliable parcel delivery services.</p>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-foreground">Home</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="/testimonials" className="hover:text-foreground">Testimonials</Link></li>
                <li><Link href="/blogs" className="hover:text-foreground">Blogs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="hover:text-foreground">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/refund" className="hover:text-foreground">Refund Policy</Link></li>
                <li><Link href="/cookies" className="hover:text-foreground">Cookies Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>support@villageexpress.com</li>
                <li>+91 1234567890</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 Village Express. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
