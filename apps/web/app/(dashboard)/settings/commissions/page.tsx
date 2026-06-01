'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, Plus, Trash2, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const VEHICLE_LABELS: Record<string, string> = {
  BIKE: '🏍 Bike',
  AUTO: '🛺 Auto',
  MINI_VAN: '🚐 Mini Van',
  VAN: '🚚 Van',
}

type CommissionRule = {
  id: string
  vehicleType: string | null
  captainCommissionPct: number
  pmCommissionPct: number
  isActive: boolean
  routeSegment?: {
    id: string
    sequenceOrder: number
    fromLocation: { pointName: string }
    toLocation: { pointName: string }
  }
}

type RouteSegment = {
  id: string
  sequenceOrder: number
  fromLocation: { pointName: string }
  toLocation: { pointName: string }
  routeId: string
}

type Route = {
  id: string
  name: string
  segments: RouteSegment[]
}

export default function CommissionsSettingsPage() {
  const { accessToken } = useAuth()
  const [routes, setRoutes] = useState<Route[]>([])
  const [rules, setRules] = useState<CommissionRule[]>([])
  const [selectedRouteId, setSelectedRouteId] = useState<string>('')
  const [isGlobal, setIsGlobal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<{
    routeSegmentId: string
    vehicleType: string
    captainCommissionPct: string
    pmCommissionPct: string
    editingId?: string
  } | null>(null)

  async function fetchRoutes() {
    const res = await fetch('/api/routes', { headers: { Authorization: `Bearer ${accessToken}` } })
    const d = await res.json()
    if (d.success) setRoutes(d.data?.items ?? d.data ?? [])
  }

  async function fetchRules(routeId: string) {
    setLoading(true)
    if (isGlobal) {
      const res = await fetch('/api/commission-rules?global=true', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const d = await res.json()
      if (d.success) setRules(d.data)
    } else {
      const res = await fetch(`/api/commission-rules?routeId=${routeId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const d = await res.json()
      if (d.success) setRules(d.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!accessToken) return
    fetchRoutes()
  }, [accessToken])

  useEffect(() => {
    if (isGlobal) {
      fetchRules('')
    } else if (selectedRouteId && accessToken) {
      fetchRules(selectedRouteId)
    }
  }, [selectedRouteId, isGlobal, accessToken])

  async function saveRule() {
    if (!editForm) return
    setSaving(true)
    try {
      const payload = {
        ...(isGlobal ? {} : { routeSegmentId: editForm.routeSegmentId }),
        vehicleType: editForm.vehicleType === 'ALL' ? null : editForm.vehicleType,
        captainCommissionPct: Number(editForm.captainCommissionPct),
        pmCommissionPct: Number(editForm.pmCommissionPct),
        isActive: true,
      }

      const url = editForm.editingId ? `/api/commission-rules/${editForm.editingId}` : '/api/commission-rules'
      const method = editForm.editingId ? 'PUT' : 'POST'

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      })

      setEditForm(null)
      if (isGlobal) {
        fetchRules('')
      } else if (selectedRouteId) {
        fetchRules(selectedRouteId)
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteRule(id: string) {
    await fetch(`/api/commission-rules/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (isGlobal) {
      fetchRules('')
    } else if (selectedRouteId) {
      fetchRules(selectedRouteId)
    }
  }

  const selectedRoute = routes.find((r) => r.id === selectedRouteId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Commission Rules</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure captain and point manager commission rates per route segment and vehicle type.</p>
      </div>

      {/* Toggle for Global vs Route-specific */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isGlobal}
            onChange={(e) => {
              setIsGlobal(e.target.checked)
              setSelectedRouteId('')
              setRules([])
            }}
            className="h-4 w-4"
          />
          <span className="text-sm font-medium">Global Rules (Fallback)</span>
        </label>
      </div>

      {/* Route selector */}
      {!isGlobal && (
        <div className="flex items-center gap-3">
          <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Select a route..." />
            </SelectTrigger>
            <SelectContent>
              {routes.map((r: any) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {(isGlobal || selectedRouteId) && (
        <>
          {/* Add rule form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {editForm?.editingId ? 'Edit Rule' : 'Add Commission Rule'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {!isGlobal && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Route Segment</label>
                    <Select
                      value={editForm?.routeSegmentId ?? ''}
                      onValueChange={(v) => setEditForm((f) => f ? { ...f, routeSegmentId: v } : { routeSegmentId: v, vehicleType: 'ALL', captainCommissionPct: '10', pmCommissionPct: '5' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Segment..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedRoute?.segments.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>
                            Seg {s.sequenceOrder}: {s.fromLocation.pointName} → {s.toLocation.pointName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Vehicle Type</label>
                  <Select
                    value={editForm?.vehicleType ?? 'ALL'}
                    onValueChange={(v) => setEditForm((f) => f ? { ...f, vehicleType: v } : { routeSegmentId: '', vehicleType: v, captainCommissionPct: '10', pmCommissionPct: '5' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Vehicles</SelectItem>
                      {Object.entries(VEHICLE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Captain Commission %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={editForm?.captainCommissionPct ?? '10'}
                    onChange={(e) => setEditForm((f) => f ? { ...f, captainCommissionPct: e.target.value } : null)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">PM Commission %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={editForm?.pmCommissionPct ?? '5'}
                    onChange={(e) => setEditForm((f) => f ? { ...f, pmCommissionPct: e.target.value } : null)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={(!isGlobal && !editForm?.routeSegmentId) || saving} onClick={saveRule}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {editForm?.editingId ? 'Update' : 'Save Rule'}
                </Button>
                {editForm && (
                  <Button size="sm" variant="ghost" onClick={() => setEditForm(null)}>Cancel</Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rules list */}
          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : rules.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                No commission rules configured for this route yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <Card key={rule.id} className={!rule.isActive ? 'opacity-50' : ''}>
                  <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {rule.routeSegment ? (
                          <span>Seg {rule.routeSegment.sequenceOrder}: {rule.routeSegment.fromLocation.pointName} → {rule.routeSegment.toLocation.pointName}</span>
                        ) : (
                          <span>Global Rule (Fallback)</span>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {rule.vehicleType ? VEHICLE_LABELS[rule.vehicleType] : 'All Vehicles'}
                        </Badge>
                        {!rule.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Captain: <span className="font-semibold text-foreground">{Number(rule.captainCommissionPct)}%</span></span>
                        <span>Point Manager: <span className="font-semibold text-foreground">{Number(rule.pmCommissionPct)}%</span></span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditForm({
                          editingId: rule.id,
                          routeSegmentId: rule.routeSegment?.id ?? '',
                          vehicleType: rule.vehicleType ?? 'ALL',
                          captainCommissionPct: String(rule.captainCommissionPct),
                          pmCommissionPct: String(rule.pmCommissionPct),
                        })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteRule(rule.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
