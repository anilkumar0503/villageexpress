'use client'

import { useEffect, useState } from 'react'
import { Plus, Loader2, Trash2, ChevronDown, ChevronRight, Route, ToggleLeft, ToggleRight, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'

type LocationOption = { id: string; pointName: string; village: string; district: string; state: string }

type Segment = {
  fromLocationId: string
  toLocationId: string
  distanceKm: string
  estimatedHours: string
}

type PricingRuleForm = {
  basePrice: string
  pricePerKm: string
  weightSurcharge: string
  priority: string
  vehicleType: string
}

type RouteRecord = {
  id: string
  name: string
  estimatedDays: number
  isActive: boolean
  sourceLocationId: string
  destinationLocationId: string
  sourceLocation: { pointName: string; village: string; district: string }
  destinationLocation: { pointName: string; village: string; district: string }
  segments: Array<{
    id: string
    sequenceOrder: number
    distanceKm: number
    estimatedHours: number
    fromLocationId: string
    toLocationId: string
    fromLocation: { id: string; pointName: string; village: string }
    toLocation: { id: string; pointName: string; village: string }
  }>
  pricingRules: Array<{
    id: string
    basePrice: number
    pricePerKm: number
    weightSurcharge: number
    priority: string
    vehicleType: string | null
    isActive: boolean
  }>
}

const EMPTY_SEGMENT: Segment = { fromLocationId: '', toLocationId: '', distanceKm: '', estimatedHours: '' }
const EMPTY_PRICING: PricingRuleForm = { basePrice: '', pricePerKm: '', weightSurcharge: '0', priority: 'STANDARD', vehicleType: '' }

export default function RoutesPage() {
  const { accessToken } = useAuth()
  const [routes, setRoutes] = useState<RouteRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [allLocations, setAllLocations] = useState<LocationOption[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<RouteRecord | null>(null)
  const [editName, setEditName] = useState('')
  const [editSourceId, setEditSourceId] = useState('')
  const [editDestId, setEditDestId] = useState('')
  const [editDays, setEditDays] = useState('')
  const [editSegments, setEditSegments] = useState<Segment[]>([{ ...EMPTY_SEGMENT }])
  const [editError, setEditError] = useState('')
  const [editRuleDialogOpen, setEditRuleDialogOpen] = useState(false)
  const [editingPricingRule, setEditingPricingRule] = useState<RouteRecord['pricingRules'][0] | null>(null)
  const [editRuleForm, setEditRuleForm] = useState({ basePrice: '', pricePerKm: '', weightSurcharge: '', vehicleType: '' })
  const [editRuleError, setEditRuleError] = useState('')
  const [addRuleDialogOpen, setAddRuleDialogOpen] = useState(false)
  const [addingRuleToRouteId, setAddingRuleToRouteId] = useState<string | null>(null)
  const [addRuleForm, setAddRuleForm] = useState({ basePrice: '', pricePerKm: '', weightSurcharge: '0', priority: 'STANDARD', vehicleType: '' })
  const [addRuleError, setAddRuleError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteRuleDialogOpen, setDeleteRuleDialogOpen] = useState(false)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)
  const [deleteRouteDialogOpen, setDeleteRouteDialogOpen] = useState(false)
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [sourceLocationId, setSourceLocationId] = useState('')
  const [destLocationId, setDestLocationId] = useState('')
  const [estimatedDays, setEstimatedDays] = useState('2')
  const [segments, setSegments] = useState<Segment[]>([{ ...EMPTY_SEGMENT }])
  const [pricingRules, setPricingRules] = useState<PricingRuleForm[]>([{ ...EMPTY_PRICING }])

  useEffect(() => {
    fetch('/api/locations?pageSize=200&isActive=true', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setAllLocations(d.data.items) })
  }, [accessToken])

  async function fetchRoutes() {
    setLoading(true)
    const res = await fetch('/api/routes', { headers: { Authorization: `Bearer ${accessToken}` } })
    const data = await res.json()
    if (data.success) setRoutes(data.data)
    setLoading(false)
  }

  useEffect(() => { fetchRoutes() }, [])

  function resetForm() {
    setName(''); setSourceLocationId(''); setDestLocationId(''); setEstimatedDays('2')
    setSegments([{ ...EMPTY_SEGMENT }])
    setPricingRules([{ ...EMPTY_PRICING }])
    setError('')
  }

  function generateDefaultRules() {
    const priorities = ['STANDARD', 'EXPRESS', 'OVERNIGHT'] as const
    const vehicleTypes = ['BIKE', 'AUTO', 'MINI_VAN', 'VAN'] as const
    const defaults: PricingRuleForm[] = []
    for (const priority of priorities) {
      for (const vehicleType of vehicleTypes) {
        defaults.push({
          basePrice: '',
          pricePerKm: '',
          weightSurcharge: '0',
          priority,
          vehicleType,
        })
      }
    }
    setPricingRules(defaults)
  }

  async function handleSave() {
    if (!name.trim()) return setError('Route name is required')
    if (!sourceLocationId || !destLocationId) return setError('Source and destination locations are required')
    if (segments.some((s) => !s.fromLocationId || !s.toLocationId || !s.distanceKm || !s.estimatedHours))
      return setError('All segment fields are required')
    if (pricingRules.some((r) => !r.basePrice || !r.pricePerKm))
      return setError('Base price and price per km are required for all pricing rules')

    setSaving(true); setError('')
    try {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          name: name.trim(),
          sourceLocationId,
          destinationLocationId: destLocationId,
          estimatedDays: Number(estimatedDays),
          isActive: true,
          segments: segments.map((s) => ({
            fromLocationId: s.fromLocationId,
            toLocationId: s.toLocationId,
            distanceKm: Number(s.distanceKm),
            estimatedHours: Number(s.estimatedHours),
          })),
          pricingRules: pricingRules.map((r) => ({
            basePrice: Number(r.basePrice),
            pricePerKm: Number(r.pricePerKm),
            weightSurcharge: Number(r.weightSurcharge),
            priority: r.priority,
            vehicleType: r.vehicleType || null,
            isActive: true,
          })),
        }),
      })
      const data = await res.json()
      if (!data.success) return setError(data.error || 'Failed to create route')
      setDialogOpen(false)
      resetForm()
      fetchRoutes()
    } catch {
      setError('Failed to create route')
    } finally {
      setSaving(false)
    }
  }

  function openEdit(route: RouteRecord) {
    setEditingRoute(route)
    setEditName(route.name)
    setEditSourceId(route.sourceLocationId)
    setEditDestId(route.destinationLocationId)
    setEditDays(String(route.estimatedDays))
    setEditSegments(
      route.segments.map((seg) => ({
        fromLocationId: seg.fromLocation.id,
        toLocationId: seg.toLocation.id,
        distanceKm: String(seg.distanceKm),
        estimatedHours: String(seg.estimatedHours),
      }))
    )
    setEditError('')
    setEditDialogOpen(true)
  }

  async function handleUpdate() {
    if (!editName.trim()) return setEditError('Route name is required')
    if (!editDays || Number(editDays) < 1) return setEditError('Estimated days must be at least 1')
    if (editSegments.some((s) => !s.fromLocationId || !s.toLocationId || !s.distanceKm || !s.estimatedHours))
      return setEditError('All segment fields are required')
    setSaving(true); setEditError('')
    try {
      const body: Record<string, unknown> = {
        name: editName.trim(),
        estimatedDays: Number(editDays),
        segments: editSegments.map((s) => ({
          fromLocationId: s.fromLocationId,
          toLocationId: s.toLocationId,
          distanceKm: Number(s.distanceKm),
          estimatedHours: Number(s.estimatedHours),
        })),
      }
      if (editSourceId) body.sourceLocationId = editSourceId
      if (editDestId) body.destinationLocationId = editDestId
      const res = await fetch(`/api/routes/${editingRoute!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.success) return setEditError(data.error || 'Failed to update route')
      setEditDialogOpen(false)
      fetchRoutes()
    } catch {
      setEditError('Failed to update route')
    } finally {
      setSaving(false)
    }
  }

  function openEditRule(rule: RouteRecord['pricingRules'][0]) {
    setEditingPricingRule(rule)
    setEditRuleForm({
      basePrice: String(Number(rule.basePrice)),
      pricePerKm: String(Number(rule.pricePerKm)),
      weightSurcharge: String((rule as any).weightSurcharge ?? 0),
      vehicleType: rule.vehicleType ?? '',
    })
    setEditRuleError('')
    setEditRuleDialogOpen(true)
  }

  async function handleUpdateRule() {
    if (!editRuleForm.basePrice || !editRuleForm.pricePerKm) return setEditRuleError('Base price and per km are required')
    setSaving(true); setEditRuleError('')
    try {
      const res = await fetch(`/api/route-pricing-rules/${editingPricingRule!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          basePrice: Number(editRuleForm.basePrice),
          pricePerKm: Number(editRuleForm.pricePerKm),
          weightSurcharge: Number(editRuleForm.weightSurcharge),
          vehicleType: editRuleForm.vehicleType || null,
        }),
      })
      const data = await res.json()
      if (!data.success) return setEditRuleError(data.error || 'Failed to update rule')
      setEditRuleDialogOpen(false)
      fetchRoutes()
    } catch {
      setEditRuleError('Failed to update rule')
    } finally {
      setSaving(false)
    }
  }

  function openAddRuleDialog(routeId: string) {
    setAddingRuleToRouteId(routeId)
    setAddRuleForm({ basePrice: '', pricePerKm: '', weightSurcharge: '0', priority: 'STANDARD', vehicleType: '' })
    setAddRuleError('')
    setAddRuleDialogOpen(true)
  }

  function handleAddRuleChange(field: string, value: string) {
    const newForm = { ...addRuleForm, [field]: value }
    setAddRuleForm(newForm)

    // Check for duplicate priority + vehicleType combination
    if (addingRuleToRouteId) {
      const route = routes.find((r) => r.id === addingRuleToRouteId)
      if (route) {
        const existingRule = route.pricingRules.find(
          (r) => r.priority === newForm.priority && r.vehicleType === (newForm.vehicleType || null)
        )
        if (existingRule) {
          setAddRuleError(`A rule with priority "${newForm.priority}" and vehicle "${newForm.vehicleType || 'Any'}" already exists for this route.`)
        } else {
          setAddRuleError('')
        }
      }
    }
  }

  async function handleAddRule() {
    if (!addRuleForm.basePrice || !addRuleForm.pricePerKm) return setAddRuleError('Base price and per km are required')
    setSaving(true); setAddRuleError('')
    try {
      const res = await fetch('/api/route-pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          routeId: addingRuleToRouteId,
          basePrice: Number(addRuleForm.basePrice),
          pricePerKm: Number(addRuleForm.pricePerKm),
          weightSurcharge: Number(addRuleForm.weightSurcharge),
          priority: addRuleForm.priority,
          vehicleType: addRuleForm.vehicleType || null,
          isActive: true,
        }),
      })
      const data = await res.json()
      if (!data.success) return setAddRuleError(data.error || 'Failed to add rule')
      setAddRuleDialogOpen(false)
      fetchRoutes()
    } catch {
      setAddRuleError('Failed to add rule')
    } finally {
      setSaving(false)
    }
  }

  function openDeleteRuleDialog(ruleId: string) {
    setDeletingRuleId(ruleId)
    setDeleteRuleDialogOpen(true)
  }

  async function confirmDeletePricingRule() {
    if (!deletingRuleId) return
    await fetch(`/api/route-pricing-rules/${deletingRuleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    setDeleteRuleDialogOpen(false)
    setDeletingRuleId(null)
    fetchRoutes()
  }

  async function handleToggle(route: RouteRecord) {
    await fetch(`/api/routes/${route.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ isActive: !route.isActive }),
    })
    fetchRoutes()
  }

  function openDeleteRouteDialog(id: string) {
    setDeletingRouteId(id)
    setDeleteRouteDialogOpen(true)
  }

  async function confirmDeleteRoute() {
    if (!deletingRouteId) return
    await fetch(`/api/routes/${deletingRouteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    setDeleteRouteDialogOpen(false)
    setDeletingRouteId(null)
    fetchRoutes()
  }

  const locLabel = (id: string) => {
    const l = allLocations.find((x) => x.id === id)
    return l ? `${l.pointName} — ${l.district}` : id
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Routes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure delivery routes with segments and pricing rules.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />Add Route
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : routes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No routes configured yet. Click "Add Route" to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {routes.map((route) => {
            const totalDist = route.segments.reduce((s, seg) => s + Number(seg.distanceKm), 0)
            const expanded = expandedId === route.id
            return (
              <Card key={route.id} className={route.isActive ? '' : 'opacity-60'}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      className="flex items-center gap-2 text-left flex-1 min-w-0"
                      onClick={() => setExpandedId(expanded ? null : route.id)}
                    >
                      {expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-semibold">{route.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {route.sourceLocation.pointName} → {route.destinationLocation.pointName}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">{totalDist}km</Badge>
                      <Badge variant="outline" className="text-xs">{route.estimatedDays}d</Badge>
                      <Badge variant="outline" className="text-xs">{route.segments.length} segs</Badge>
                      <Badge variant={route.isActive ? 'default' : 'secondary'} className="text-xs">
                        {route.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => openEdit(route)} title="Edit route">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => handleToggle(route)} title={route.isActive ? 'Deactivate' : 'Activate'}>
                        {route.isActive ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => openDeleteRouteDialog(route.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {expanded && (
                  <CardContent className="pt-0 space-y-4">
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Segments</p>
                      <div className="space-y-1.5">
                        {route.segments.map((seg) => (
                          <div key={seg.id} className="flex items-center gap-2 text-sm">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium w-5 text-center">{seg.sequenceOrder}</span>
                            <span className="flex-1">{seg.fromLocation.pointName} → {seg.toLocation.pointName}</span>
                            <span className="text-xs text-muted-foreground">{Number(seg.distanceKm)}km</span>
                            <span className="text-xs text-muted-foreground">{seg.estimatedHours}h</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pricing Rules</p>
                        <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => openAddRuleDialog(route.id)}>
                          <Plus className="h-3 w-3 mr-1" />Add Rule
                        </Button>
                      </div>
                      {route.pricingRules.length > 0 ? (
                        <div className="grid gap-2">
                          {route.pricingRules.map((rule) => (
                            <div key={rule.id} className="flex items-center gap-2 text-xs bg-muted/40 rounded-lg p-2.5">
                              <div className="grid grid-cols-6 gap-3 flex-1">
                                <div><p className="text-muted-foreground">Priority</p><p className="font-medium">{rule.priority}</p></div>
                                <div><p className="text-muted-foreground">Vehicle</p><p className="font-medium">{rule.vehicleType ?? 'Any'}</p></div>
                                <div><p className="text-muted-foreground">Base Price</p><p className="font-medium">₹{Number(rule.basePrice)}</p></div>
                                <div><p className="text-muted-foreground">Per Km</p><p className="font-medium">₹{Number(rule.pricePerKm)}</p></div>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground" onClick={() => openEditRule(rule)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-destructive" onClick={() => openDeleteRuleDialog(rule.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No pricing rules yet. Click "Add Rule" to create one.</p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={editRuleDialogOpen} onOpenChange={setEditRuleDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Pricing Rule</DialogTitle></DialogHeader>
          {editingPricingRule && (
            <p className="text-xs bg-muted/50 rounded-lg p-2.5 text-muted-foreground">
              Priority: <span className="font-medium text-foreground">{editingPricingRule.priority}</span>
              <span className="ml-2 opacity-60">(cannot be changed)</span>
            </p>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Vehicle Type</Label>
            <Select value={editRuleForm.vehicleType} onValueChange={(v) => setEditRuleForm((f) => ({ ...f, vehicleType: v === 'ANY' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder="Any vehicle" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ANY">Any vehicle</SelectItem>
                <SelectItem value="BIKE">🏍 Bike</SelectItem>
                <SelectItem value="AUTO">🛺 Auto</SelectItem>
                <SelectItem value="MINI_VAN">🚐 Mini Van</SelectItem>
                <SelectItem value="VAN">🚚 Van</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([
              ['basePrice', 'Base Price (₹)'],
              ['pricePerKm', 'Per Km (₹)'],
              ['weightSurcharge', 'Weight Surcharge (₹)'],
            ] as [keyof typeof editRuleForm, string][]).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Input type="number" value={editRuleForm[key]} onChange={(e) => setEditRuleForm((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          {editRuleError && <p className="text-sm text-destructive">{editRuleError}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditRuleDialogOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={saving} onClick={handleUpdateRule}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addRuleDialogOpen} onOpenChange={setAddRuleDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Pricing Rule</DialogTitle></DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs">Priority</Label>
            <Select value={addRuleForm.priority} onValueChange={(v) => handleAddRuleChange('priority', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="EXPRESS">Express</SelectItem>
                <SelectItem value="OVERNIGHT">Overnight</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Vehicle Type</Label>
            <Select value={addRuleForm.vehicleType} onValueChange={(v) => handleAddRuleChange('vehicleType', v === 'ANY' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Any vehicle" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ANY">Any vehicle</SelectItem>
                <SelectItem value="BIKE">🏍 Bike</SelectItem>
                <SelectItem value="AUTO">🛺 Auto</SelectItem>
                <SelectItem value="MINI_VAN">🚐 Mini Van</SelectItem>
                <SelectItem value="VAN">🚚 Van</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([
              ['basePrice', 'Base Price (₹)'],
              ['pricePerKm', 'Per Km (₹)'],
              ['weightSurcharge', 'Weight Surcharge (₹)'],
            ] as [keyof typeof addRuleForm, string][]).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Input type="number" value={addRuleForm[key]} onChange={(e) => setAddRuleForm((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          {addRuleError && <p className="text-sm text-destructive">{addRuleError}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setAddRuleDialogOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={saving || !!addRuleError} onClick={handleAddRule}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={(o) => { setEditDialogOpen(o) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Route</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Route Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Source Location</Label>
                <Select value={editSourceId} onValueChange={setEditSourceId}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{allLocations.map((l) => <SelectItem key={l.id} value={l.id}>{l.pointName} — {l.district}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Destination Location</Label>
                <Select value={editDestId} onValueChange={setEditDestId}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{allLocations.map((l) => <SelectItem key={l.id} value={l.id}>{l.pointName} — {l.district}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Estimated Days</Label>
                <Input type="number" min="1" value={editDays} onChange={(e) => setEditDays(e.target.value)} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Segments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Segments</p>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditSegments((s) => [...s, { ...EMPTY_SEGMENT }])}>
                <Plus className="h-3.5 w-3.5 mr-1" />Add Segment
              </Button>
            </div>
            {editSegments.map((seg, idx) => (
              <div key={idx} className="grid grid-cols-5 gap-2 items-end bg-muted/30 rounded-lg p-3">
                <div className="space-y-1">
                  <Label className="text-xs">From</Label>
                  <Select value={seg.fromLocationId} onValueChange={(v) => setEditSegments((s) => s.map((x, i) => i === idx ? { ...x, fromLocationId: v } : x))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="From" /></SelectTrigger>
                    <SelectContent>{allLocations.map((l) => <SelectItem key={l.id} value={l.id}>{l.pointName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To</Label>
                  <Select value={seg.toLocationId} onValueChange={(v) => setEditSegments((s) => s.map((x, i) => i === idx ? { ...x, toLocationId: v } : x))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="To" /></SelectTrigger>
                    <SelectContent>{allLocations.map((l) => <SelectItem key={l.id} value={l.id}>{l.pointName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Distance (km)</Label>
                  <Input type="number" min="0.1" step="0.1" placeholder="km" value={seg.distanceKm} onChange={(e) => setEditSegments((s) => s.map((x, i) => i === idx ? { ...x, distanceKm: e.target.value } : x))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Est. Hours</Label>
                  <Input type="number" min="1" placeholder="hrs" value={seg.estimatedHours} onChange={(e) => setEditSegments((s) => s.map((x, i) => i === idx ? { ...x, estimatedHours: e.target.value } : x))} />
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive self-end" disabled={editSegments.length === 1} onClick={() => setEditSegments((s) => s.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {editError && <p className="text-sm text-destructive">{editError}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={saving} onClick={handleUpdate}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm() }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Route</DialogTitle></DialogHeader>

          {/* Basic Info */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Route Name</Label>
              <Input placeholder="e.g. Jagitial to Karimnagar" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Source Location</Label>
                <Select value={sourceLocationId} onValueChange={setSourceLocationId}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{allLocations.map((l) => <SelectItem key={l.id} value={l.id}>{l.pointName} — {l.district}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Destination Location</Label>
                <Select value={destLocationId} onValueChange={setDestLocationId}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{allLocations.map((l) => <SelectItem key={l.id} value={l.id}>{l.pointName} — {l.district}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Estimated Days</Label>
                <Input type="number" min="1" value={estimatedDays} onChange={(e) => setEstimatedDays(e.target.value)} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Segments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Segments</p>
              <Button type="button" variant="outline" size="sm" onClick={() => setSegments((s) => [...s, { ...EMPTY_SEGMENT }])}>
                <Plus className="h-3.5 w-3.5 mr-1" />Add Segment
              </Button>
            </div>
            {segments.map((seg, idx) => (
              <div key={idx} className="grid grid-cols-5 gap-2 items-end bg-muted/30 rounded-lg p-3">
                <div className="space-y-1">
                  <Label className="text-xs">From</Label>
                  <Select value={seg.fromLocationId} onValueChange={(v) => setSegments((s) => s.map((x, i) => i === idx ? { ...x, fromLocationId: v } : x))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="From" /></SelectTrigger>
                    <SelectContent>{allLocations.map((l) => <SelectItem key={l.id} value={l.id}>{l.pointName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To</Label>
                  <Select value={seg.toLocationId} onValueChange={(v) => setSegments((s) => s.map((x, i) => i === idx ? { ...x, toLocationId: v } : x))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="To" /></SelectTrigger>
                    <SelectContent>{allLocations.map((l) => <SelectItem key={l.id} value={l.id}>{l.pointName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Distance (km)</Label>
                  <Input type="number" min="0.1" step="0.1" placeholder="km" value={seg.distanceKm} onChange={(e) => setSegments((s) => s.map((x, i) => i === idx ? { ...x, distanceKm: e.target.value } : x))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Est. Hours</Label>
                  <Input type="number" min="1" placeholder="hrs" value={seg.estimatedHours} onChange={(e) => setSegments((s) => s.map((x, i) => i === idx ? { ...x, estimatedHours: e.target.value } : x))} />
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive self-end" disabled={segments.length === 1} onClick={() => setSegments((s) => s.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <Separator />

          {/* Pricing Rules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Pricing Rules</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={generateDefaultRules}>
                  Generate Defaults
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setPricingRules((r) => [...r, { ...EMPTY_PRICING }])}>
                  <Plus className="h-3.5 w-3.5 mr-1" />Add Rule
                </Button>
              </div>
            </div>
            {pricingRules.map((rule, idx) => (
              <div key={idx} className="grid grid-cols-8 gap-2 items-end bg-muted/30 rounded-lg p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Priority</Label>
                  <Select value={rule.priority} onValueChange={(v) => setPricingRules((r) => r.map((x, i) => i === idx ? { ...x, priority: v } : x))}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="EXPRESS">Express</SelectItem>
                      <SelectItem value="OVERNIGHT">Overnight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Vehicle</Label>
                  <Select value={rule.vehicleType} onValueChange={(v) => setPricingRules((r) => r.map((x, i) => i === idx ? { ...x, vehicleType: v === 'ANY' ? '' : v } : x))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANY">Any</SelectItem>
                      <SelectItem value="BIKE">Bike</SelectItem>
                      <SelectItem value="AUTO">Auto</SelectItem>
                      <SelectItem value="MINI_VAN">Mini Van</SelectItem>
                      <SelectItem value="VAN">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Base (₹)</Label>
                  <Input type="number" min="0" placeholder="50" value={rule.basePrice} onChange={(e) => setPricingRules((r) => r.map((x, i) => i === idx ? { ...x, basePrice: e.target.value } : x))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Per km (₹)</Label>
                  <Input type="number" min="0" step="0.1" placeholder="5" value={rule.pricePerKm} onChange={(e) => setPricingRules((r) => r.map((x, i) => i === idx ? { ...x, pricePerKm: e.target.value } : x))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Weight Surcharge (₹)</Label>
                  <Input type="number" min="0" step="0.1" placeholder="0" value={rule.weightSurcharge} onChange={(e) => setPricingRules((r) => r.map((x, i) => i === idx ? { ...x, weightSurcharge: e.target.value } : x))} />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive self-end" disabled={pricingRules.length === 1} onClick={() => setPricingRules((r) => r.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => { setDialogOpen(false); resetForm() }}>Cancel</Button>
            <Button className="flex-1" disabled={saving} onClick={handleSave}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Route
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Pricing Rule Confirmation Dialog */}
      <AlertDialog open={deleteRuleDialogOpen} onOpenChange={setDeleteRuleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pricing Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pricing rule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={confirmDeletePricingRule}>
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Route Confirmation Dialog */}
      <AlertDialog open={deleteRouteDialogOpen} onOpenChange={setDeleteRouteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this route? This will also remove all associated segments and pricing rules. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={confirmDeleteRoute}>
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
