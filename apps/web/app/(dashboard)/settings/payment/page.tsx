'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save, QrCode, Banknote, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { FileUpload } from '@/components/file-upload'

type PaymentSettings = {
  id: string
  bankName: string | null
  accountNumber: string | null
  ifscCode: string | null
  accountHolderName: string | null
  upiId: string | null
  qrCodeUrl: string | null
  isActive: boolean
}

export default function PaymentSettingsPage() {
  const { accessToken, handleAuthError } = useAuth()
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    upiId: '',
    qrCodeUrl: '',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    const res = await fetch('/api/admin/payment-settings', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (res.status === 401) {
      handleAuthError()
      setLoading(false)
      return
    }
    const data = await res.json()
    if (data.success && data.data) {
      setSettings(data.data)
      setFormData({
        bankName: data.data.bankName || '',
        accountNumber: data.data.accountNumber || '',
        ifscCode: data.data.ifscCode || '',
        accountHolderName: data.data.accountHolderName || '',
        upiId: data.data.upiId || '',
        qrCodeUrl: data.data.qrCodeUrl || '',
      })
    }
    setLoading(false)
  }

  async function saveSettings() {
    setSaving(true)
    const res = await fetch('/api/admin/payment-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(formData),
    })
    if (res.status === 401) {
      handleAuthError()
      setSaving(false)
      return
    }
    const data = await res.json()
    if (data.success) {
      setSettings(data.data)
      alert('Payment settings saved successfully')
    } else {
      alert(data.error || 'Failed to save settings')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="payment-settings-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="page-title">Payment Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5" data-testid="page-description">
          Configure payment details for COD settlements from point managers
        </p>
      </div>

      <Card data-testid="bank-details-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Bank Account Details
          </CardTitle>
          <CardDescription>
            Point managers will use these details to remit collected COD amounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                data-testid="bank-name-input"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="e.g., State Bank of India"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                data-testid="account-number-input"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="Enter account number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <Input
                id="ifscCode"
                data-testid="ifsc-code-input"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                placeholder="e.g., SBIN0001234"
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Account Holder Name</Label>
              <Input
                id="accountHolderName"
                data-testid="account-holder-name-input"
                value={formData.accountHolderName}
                onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                placeholder="Enter account holder name"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="upi-details-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            UPI Details
          </CardTitle>
          <CardDescription>
            UPI ID for instant payments from point managers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="upiId">UPI ID</Label>
            <Input
              id="upiId"
              data-testid="upi-id-input"
              value={formData.upiId}
              onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
              placeholder="e.g., yourname@upi"
            />
          </div>
        </CardContent>
      </Card>

      <Card data-testid="qr-code-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code
          </CardTitle>
          <CardDescription>
            Upload QR code image for point managers to scan and pay
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUpload
            folder="qr-code"
            accept="image/jpeg,image/png,image/webp"
            label="Upload QR Code Image"
            currentUrl={formData.qrCodeUrl || undefined}
            onUploadComplete={(url) => setFormData({ ...formData, qrCodeUrl: url })}
          />
          <div className="space-y-2">
            <Label htmlFor="qrCodeUrl">Or enter QR Code URL manually</Label>
            <Input
              id="qrCodeUrl"
              data-testid="qr-code-url-input"
              value={formData.qrCodeUrl}
              onChange={(e) => setFormData({ ...formData, qrCodeUrl: e.target.value })}
              placeholder="https://example.com/qr-code.png"
            />
          </div>
          {formData.qrCodeUrl && (
            <div className="mt-4" data-testid="qr-preview">
              <Label>Preview</Label>
              <div className="mt-2 border rounded-lg p-4 inline-block">
                <img
                  src={formData.qrCodeUrl}
                  alt="QR Code Preview"
                  className="w-48 h-48 object-contain"
                  onError={() => alert('Failed to load QR code image')}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={fetchSettings} data-testid="cancel-button" disabled={loading}>
          Reset
        </Button>
        <Button onClick={saveSettings} disabled={saving} data-testid="save-button">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
