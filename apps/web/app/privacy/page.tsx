import Link from 'next/link'
import { PublicHeader } from '@/components/public-header'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />

      {/* Header */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-block text-primary-foreground/90 hover:text-primary-foreground mb-4">
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl text-primary-foreground/90">Last updated: January 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto prose prose-lg">
            <h2>1. Information We Collect</h2>
            <p>Village Express collects the following types of information:</p>
            <ul>
              <li><strong>Personal Information:</strong> Name, phone number, email address, and address details provided during registration and booking</li>
              <li><strong>Parcel Information:</strong> Details about parcels you send including weight, dimensions, and contents</li>
              <li><strong>Payment Information:</strong> Payment details processed through secure payment gateways</li>
              <li><strong>Location Data:</strong> Pickup and delivery locations for service delivery</li>
              <li><strong>Device Information:</strong> IP address, browser type, and device information for security purposes</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide and improve our parcel delivery services</li>
              <li>Process bookings and payments</li>
              <li>Communicate with you about your orders</li>
              <li>Send service updates and promotional communications (with your consent)</li>
              <li>Prevent fraud and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>We may share your information with:</p>
            <ul>
              <li><strong>Service Providers:</strong> Third parties who assist in delivering our services (payment processors, logistics partners)</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
            </ul>
            <p>We do not sell your personal information to third parties for marketing purposes.</p>

            <h2>4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security audits.
            </p>

            <h2>5. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your personal information by contacting us, subject to legal and operational requirements.
            </p>

            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of marketing communications</li>
              <li>Object to processing of your information</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>

            <h2>7. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to improve your experience, analyze usage patterns, and personalize content. You can manage cookie preferences through your browser settings. See our Cookies Policy for more details.
            </p>

            <h2>8. Children's Privacy</h2>
            <p>
              Our services are not intended for children under 18. We do not knowingly collect personal information from children. If we become aware of such collection, we will take steps to delete it.
            </p>

            <h2>9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>

            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on our website and sending you an email notification.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              For any questions regarding this Privacy Policy or your personal information, please contact us at privacy@villageexpress.com or call +91 1234567890.
            </p>
          </div>
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
                <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="/testimonials" className="hover:text-foreground">Testimonials</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="hover:text-foreground">Terms & Conditions</Link></li>
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
