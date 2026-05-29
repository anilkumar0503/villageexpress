'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode, Camera, Loader2, X, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Html5Qrcode } from 'html5-qrcode'

export default function ScanPage() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const readerRef = useRef<HTMLDivElement>(null)

  const startScan = async () => {
    setLoading(true)
    setError('')

    // Wait for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 100))

    const readerElement = readerRef.current
    if (!readerElement) {
      setError('Scanner element not ready. Please try again.')
      setLoading(false)
      return
    }

    try {
      // Check if running on HTTPS or localhost
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      
      if (!isSecure) {
        throw new Error('Camera access requires HTTPS or localhost')
      }

      const html5QrCode = new Html5Qrcode(readerElement.id)
      scannerRef.current = html5QrCode

      const config = { fps: 10, qrbox: { width: 250, height: 250 } }
      
      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          html5QrCode.stop().then(() => {
            setScanning(false)
            setLoading(false)
            handleScanResult(decodedText)
          })
        },
        (errorMessage) => {
          // Ignore scan errors
        }
      )
      setScanning(true)
      setLoading(false)
    } catch (err: any) {
      console.error('Scanner error:', err)
      const errorMsg = err?.message || String(err)
      setError(`Camera error: ${errorMsg}. Try uploading a QR code image instead.`)
      setScanning(false)
      setLoading(false)
    }
  }

  const stopScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
    setScanning(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')

    try {
      const html5QrCode = new Html5Qrcode('reader')
      scannerRef.current = html5QrCode

      await html5QrCode.scanFile(file, true)
        .then((decodedText) => {
          handleScanResult(decodedText)
        })
        .catch((err) => {
          setError('Failed to read QR code from image. Please try a clearer image.')
        })
        .finally(() => {
          setLoading(false)
        })
    } catch (err) {
      setError('Failed to process image.')
      setLoading(false)
    }
  }

  const handleScanResult = (decodedText: string) => {
    const match = decodedText.match(/\/bookings\/([a-f0-9-]+)/i)
    if (match && match[1]) {
      router.push(`/bookings/${match[1]}`)
    } else {
      router.push(`/bookings/${decodedText}`)
    }
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [])

  return (
    <div className="max-w-md mx-auto space-y-6 py-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <X className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quick Scan</h1>
          <p className="text-sm text-muted-foreground">Scan booking QR code for quick access</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scanner element always rendered */}
          <div 
            ref={readerRef} 
            id="reader" 
            className="w-full rounded-lg overflow-hidden" 
            style={{ minHeight: scanning ? '300px' : '0px', display: scanning ? 'block' : 'none' }} 
          />

          {!scanning ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-48 h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                <Camera className="h-16 w-16 text-muted-foreground" />
              </div>
              <div className="flex gap-2">
                <Button onClick={startScan} className="flex-1" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
                  {loading ? 'Starting...' : 'Camera'}
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <Button onClick={stopScan} variant="outline" className="w-full">
                <X className="h-4 w-4 mr-2" />
                Stop Scanning
              </Button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            Use camera or upload a QR code image to quickly access booking details.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
