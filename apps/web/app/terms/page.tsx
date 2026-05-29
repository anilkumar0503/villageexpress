import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-block text-primary-foreground/90 hover:text-primary-foreground mb-4">
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-xl text-primary-foreground/90">Last updated: January 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto prose prose-lg">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Village Express services, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use our service.
            </p>

            <h2>2. Services</h2>
            <p>
              Village Express provides parcel delivery services connecting villages across India. We reserve the right to modify, suspend, or discontinue any aspect of our services at any time without prior notice.
            </p>

            <h2>3. User Responsibilities</h2>
            <p>As a user of our services, you agree to:</p>
            <ul>
              <li>Provide accurate and complete information when booking parcels</li>
              <li>Ensure that all parcels comply with our prohibited items policy</li>
              <li>Pay all applicable fees and charges in a timely manner</li>
              <li>Not use our services for any illegal or unauthorized purpose</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>

            <h2>4. Prohibited Items</h2>
            <p>The following items are strictly prohibited from being shipped through Village Express:</p>
            <ul>
              <li>Illegal substances and controlled drugs</li>
              <li>Weapons, firearms, and explosives</li>
              <li>Hazardous materials and chemicals</li>
              <li>Counterfeit goods</li>
              <li>Live animals</li>
              <li>Perishable items (unless specifically authorized)</li>
              <li>Any item prohibited by local, state, or national law</li>
            </ul>

            <h2>5. Pricing and Payment</h2>
            <p>
              All prices are quoted in Indian Rupees (INR) and are subject to change without notice. Payment must be made before or at the time of pickup. We accept various payment methods including UPI, cards, net banking, and cash on delivery (where applicable).
            </p>

            <h2>6. Delivery Terms</h2>
            <p>
              Delivery times are estimates and not guaranteed. We are not liable for delays caused by circumstances beyond our control, including but not limited to weather conditions, natural disasters, strikes, or government restrictions.
            </p>

            <h2>7. Liability and Limitation</h2>
            <p>
              Village Express shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of our services. Our liability is limited to the declared value of the parcel, subject to our insurance terms.
            </p>

            <h2>8. Claims and Disputes</h2>
            <p>
              Any claims for lost, damaged, or delayed parcels must be made within 7 days of the scheduled delivery date. All claims must be submitted in writing with supporting documentation.
            </p>

            <h2>9. Privacy Policy</h2>
            <p>
              Your use of our services is also governed by our Privacy Policy. Please review our Privacy Policy, which also governs our services and describes how we collect, use, and protect your personal information.
            </p>

            <h2>10. Modification of Terms</h2>
            <p>
              Village Express reserves the right to modify these terms at any time. Your continued use of our services after such modifications constitutes your acceptance of the new terms.
            </p>

            <h2>11. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts in Hyderabad, India.
            </p>

            <h2>12. Contact Information</h2>
            <p>
              For any questions regarding these terms, please contact us at support@villageexpress.com or call +91 1234567890.
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
