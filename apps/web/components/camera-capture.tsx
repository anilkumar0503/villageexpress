'use client'

import { useRef, useState, useEffect } from 'react'
import { Camera, X, RotateCw, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type CameraCaptureProps = {
  onCapture: (imageUrl: string) => void
  onCancel?: () => void
  className?: string
}

export function CameraCapture({ onCapture, onCancel, className }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    startCamera()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [facingMode])

  async function startCamera() {
    setError('')
    setLoading(true)
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
        }
      }
    } catch (err) {
      setError('Unable to access camera. Please ensure camera permissions are granted.')
      console.error('Camera error:', err)
    } finally {
      setLoading(false)
    }
  }

  function switchCamera() {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageUrl = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedImage(imageUrl)
      }
    }
  }

  function retakePhoto() {
    setCapturedImage(null)
  }

  function confirmCapture() {
    if (capturedImage) {
      onCapture(capturedImage)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
          {error}
        </div>
      ) : (
        <>
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            ) : capturedImage ? (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
            
            {onCancel && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                onClick={onCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex items-center justify-center gap-2">
            {!capturedImage ? (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={switchCamera}
                  disabled={loading}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  onClick={capturePhoto}
                  disabled={loading}
                  className="rounded-full w-16 h-16"
                >
                  <Camera className="h-6 w-6" />
                </Button>
                <div className="w-10" />
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                >
                  Retake
                </Button>
                <Button
                  onClick={confirmCapture}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Confirm
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
