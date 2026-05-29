import Link from 'next/link'

export default function CookiesPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-block text-primary-foreground/90 hover:text-primary-foreground mb-4">
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-4">Cookies Policy</h1>
          <p className="text-xl text-primary-foreground/90">Last updated: January 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto prose prose-lg">
            <h2>1. What Are Cookies</h2>
            <p>
              Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our services.
            </p>

            <h2>2. How We Use Cookies</h2>
            <p>We use cookies for the following purposes:</p>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for the website to function properly (authentication, security, navigation)</li>
              <li><strong>Performance Cookies:</strong> Help us understand how visitors use our website (analytics, page views, session duration)</li>
              <li><strong>Functionality Cookies:</strong> Remember your preferences (language, location, settings)</li>
              <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements and track marketing campaigns</li>
            </ul>

            <h2>3. Types of Cookies We Use</h2>
            <h3>Session Cookies</h3>
            <p>
              Temporary cookies that expire when you close your browser. They help maintain your session and track your activity during a single visit.
            </p>

            <h3>Persistent Cookies</h3>
            <p>
              Cookies that remain on your device for a set period or until you delete them. They help remember your preferences across multiple visits.
            </p>

            <h3>First-Party Cookies</h3>
            <p>
              Cookies set by Village Express directly. These are essential for our website to function properly.
            </p>

            <h3>Third-Party Cookies</h3>
            <p>
              Cookies set by third-party services we use, such as analytics tools, payment processors, and advertising networks.
            </p>

            <h2>4. Managing Cookies</h2>
            <p>You can control and manage cookies in various ways:</p>
            <ul>
              <li><strong>Browser Settings:</strong> Most browsers allow you to accept, reject, or delete cookies through their settings</li>
              <li><strong>Cookie Banner:</strong> Our website displays a cookie banner where you can accept or reject non-essential cookies</li>
              <li><strong>Opt-Out Links:</strong> Some third-party services provide opt-out links for their cookies</li>
            </ul>

            <h2>5. Disabling Cookies</h2>
            <p>
              Please note that disabling cookies may affect your experience on our website. Some features may not work properly, and you may not be able to access certain services. Essential cookies are required for the website to function.
            </p>

            <h2>6. Third-Party Services</h2>
            <p>We use the following third-party services that may set cookies:</p>
            <ul>
              <li><strong>Google Analytics:</strong> For website analytics and performance tracking</li>
              <li><strong>Payment Gateways:</strong> For secure payment processing</li>
              <li><strong>Social Media:</strong> For social sharing features (if you choose to use them)</li>
            </ul>
            <p>
              Each third-party service has its own privacy policy and cookie policy. We encourage you to review these policies for more information on how they use cookies.
            </p>

            <h2>7. Updates to This Policy</h2>
            <p>
              We may update this Cookies Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of significant changes by posting the new policy on our website.
            </p>

            <h2>8. Contact Us</h2>
            <p>
              If you have any questions about our use of cookies, please contact us at privacy@villageexpress.com or call +91 1234567890.
            </p>

            <h2>9. Your Consent</h2>
            <p>
              By using our website, you consent to the use of cookies as described in this policy. You can withdraw your consent at any time by changing your browser settings or using our cookie preference manager.
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
                <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/refund" className="hover:text-foreground">Refund Policy</Link></li>
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
