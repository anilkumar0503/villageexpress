import Link from 'next/link'

export default function RefundPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-block text-primary-foreground/90 hover:text-primary-foreground mb-4">
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
          <p className="text-xl text-primary-foreground/90">Last updated: January 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto prose prose-lg">
            <h2>1. Refund Eligibility</h2>
            <p>
              Village Express offers refunds under the following circumstances:
            </p>
            <ul>
              <li>Service cancellation before pickup (full refund)</li>
              <li>Parcel not delivered within the guaranteed timeframe (partial or full refund based on delay)</li>
              <li>Parcel lost or damaged during transit (full refund of service charges plus declared value)</li>
              <li>Double payment or billing errors (full refund of excess amount)</li>
              <li>Service not provided as described (partial or full refund)</li>
            </ul>

            <h2>2. Non-Refundable Situations</h2>
            <p>Refunds are not available in the following situations:</p>
            <ul>
              <li>Cancellation after pickup has been completed</li>
              <li>Delays caused by circumstances beyond our control (weather, natural disasters, strikes)</li>
              <li>Incorrect address provided by the customer</li>
              <li>Recipient refused to accept the parcel</li>
              <li>Prohibited items discovered during transit</li>
              <li>Force majeure events</li>
            </ul>

            <h2>3. Refund Process</h2>
            <p>To request a refund, follow these steps:</p>
            <ol>
              <li>Contact our customer support at support@villageexpress.com or call +91 1234567890</li>
              <li>Provide your booking number and reason for refund request</li>
              <li>Submit any required documentation (photos of damaged items, proof of payment, etc.)</li>
              <li>Our team will review your request within 3-5 business days</li>
              <li>Once approved, refund will be processed within 7-10 business days</li>
            </ol>

            <h2>4. Refund Methods</h2>
            <p>Refunds are processed using the original payment method:</p>
            <ul>
              <li><strong>UPI/Card/Net Banking:</strong> Refund to the original account used for payment</li>
              <li><strong>Cash:</strong> Refund via bank transfer or UPI to customer's account</li>
              <li><strong>Wallet:</strong> Refund credited to Village Express wallet</li>
            </ul>

            <h2>5. Refund Timeline</h2>
            <ul>
              <li><strong>Processing Time:</strong> 3-5 business days for review</li>
              <li><strong>Refund Initiation:</strong> 7-10 business days after approval</li>
              <li><strong>Bank Processing:</strong> Additional 3-5 business days depending on bank</li>
            </ul>

            <h2>6. Partial Refunds</h2>
            <p>
              In cases of partial service delivery or partial damage, we may offer a partial refund based on the extent of the issue. The refund amount will be determined by our support team after reviewing the case.
            </p>

            <h2>7. Cancellation Charges</h2>
            <p>
              For cancellations made before pickup, the following charges may apply:
            </p>
            <ul>
              <li>Cancellation more than 24 hours before pickup: No charge</li>
              <li>Cancellation 12-24 hours before pickup: 10% of service fee</li>
              <li>Cancellation less than 12 hours before pickup: 25% of service fee</li>
            </ul>

            <h2>8. Dispute Resolution</h2>
            <p>
              If you are not satisfied with our refund decision, you can escalate the matter to our management team within 7 days of receiving our decision. All disputes will be resolved in accordance with our Terms & Conditions.
            </p>

            <h2>9. Contact Information</h2>
            <p>
              For refund-related queries, please contact:
            </p>
            <ul>
              <li>Email: refunds@villageexpress.com</li>
              <li>Phone: +91 1234567890</li>
              <li>Address: Village Express HQ, Hyderabad, India</li>
            </ul>
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
