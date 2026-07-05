'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import {
  DAYS_OF_WEEK,
  DAY_LABELS,
  DEFAULT_WORKING_HOURS,
  type WorkingHours,
  type DayOfWeek,
  isPointOpen,
  formatTime,
} from '@/lib/working-hours'

export default function WorkingHoursPage() {
  const { accessToken } = useAuth()
  const [hours, setHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [profileExists, setProfileExists] = useState(true)

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/profile/working-hours', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setHours(d.data)
          setProfileExists(d.profileExists ?? true)
        }
      })
      .finally(() => setLoading(false))
  }, [accessToken])

  async function handleSave() {
    if (!accessToken) return
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const res = await fetch('/api/profile/working-hours', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(hours),
      })
      const d = await res.json()
      if (d.success) {
        setHours(d.data)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(d.error ?? 'Failed to save')
      }
    } catch {
      setError('Failed to save working hours')
    } finally {
      setSaving(false)
    }
  }

  function updateDay(day: DayOfWeek, field: 'isOpen' | 'openTime' | 'closeTime', value: boolean | string) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  const currentStatus = isPointOpen(hours)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Working Hours</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Orders can only be placed at your point during these hours.
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${
          currentStatus.open
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {currentStatus.open ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {currentStatus.open ? 'Currently Open' : `Closed — ${currentStatus.reason}`}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Weekly Schedule
          </CardTitle>
          <CardDescription>
            Set the hours for each day. Customers cannot book from your point outside these hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {DAYS_OF_WEEK.map((day) => {
            const schedule = hours[day]
            return (
              <div
                key={day}
                className={`flex flex-wrap items-center gap-3 py-3 px-2 rounded-lg transition-colors ${
                  schedule.isOpen ? 'hover:bg-muted/30' : 'opacity-60 hover:bg-muted/30'
                }`}
              >
                {/* Day toggle */}
                <button
                  type="button"
                  onClick={() => updateDay(day, 'isOpen', !schedule.isOpen)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                    schedule.isOpen ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  aria-label={`Toggle ${DAY_LABELS[day]}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      schedule.isOpen ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>

                {/* Day label */}
                <span className="w-28 text-sm font-medium">{DAY_LABELS[day]}</span>

                {schedule.isOpen ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-muted-foreground w-8">Open</Label>
                      <input
                        type="time"
                        value={schedule.openTime}
                        onChange={(e) => updateDay(day, 'openTime', e.target.value)}
                        className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <span className="text-muted-foreground text-sm">—</span>
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-muted-foreground w-10">Close</Label>
                      <input
                        type="time"
                        value={schedule.closeTime}
                        onChange={(e) => updateDay(day, 'closeTime', e.target.value)}
                        className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(schedule.openTime)} – {formatTime(schedule.closeTime)}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Closed</span>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {!profileExists && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            Your point manager profile is not fully set up yet.{' '}
            <Link href="/profile" className="font-medium underline underline-offset-2 hover:text-amber-900">
              Complete your profile
            </Link>{' '}
            before configuring working hours.
          </span>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving || !profileExists}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Working Hours
        </Button>
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Saved successfully
          </span>
        )}
      </div>
    </div>
  )
}
