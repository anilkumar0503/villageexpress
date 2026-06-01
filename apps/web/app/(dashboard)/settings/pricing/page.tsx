'use client'

import { useEffect, useState } from 'react'
import { Plus, Loader2, Trash2, Globe, MapPin, Pencil, Search, Route as RouteIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'

type PricingRule = {
  id: string
  basePrice: number
  pricePerKm: number
  minWeight: number
  maxWeight: number
  estimatedDeliveryDays: number
  vehicleType: 'BIKE' | 'AUTO' | 'MINI_VAN' | 'VAN' | null
  deliveryPriority: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT'
  sourceLocation: { pointName: string; village: string; district: string } | null
  destinationLocation: { pointName: string; village: string; district: string } | null
}

type LocationOption = { id: string; pointName: string; village: string; district: string; state: string }

type Route = {
  id: string
  name: string
  sourceLocation: { pointName: string; district: string }
  destinationLocation: { pointName: string; district: string }
  isActive: boolean
  segments: { id: string; fromLocation: { pointName: string }; toLocation: { pointName: string } }[]
  pricingRules: RoutePricingRule[]
}

type RoutePricingRule = {
  id: string
  routeId: string
  vehicleType: 'BIKE' | 'AUTO' | 'MINI_VAN' | 'VAN' | null
  minWeight: number
  maxWeight: number
  basePrice: number
  pricePerKm: number
  priority: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT'
  isActive: boolean
}

const EMPTY_FORM = {
  basePrice: '', pricePerKm: '', weightSurcharge: '0', estimatedDeliveryDays: '3',
  sourceLocationId: '', destinationLocationId: '', vehicleType: '', deliveryPriority: 'STANDARD',
}

type EditForm = { basePrice: string; pricePerKm: string; weightSurcharge: string; estimatedDeliveryDays: string; vehicleType: string; deliveryPriority: string }

type RoutePricingForm = {
  basePrice: string
  pricePerKm: string
  weightSurcharge: string
  priority: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT'
  vehicleType: string
}

const EMPTY_ROUTE_PRICING: RoutePricingForm = {
  basePrice: '',
  pricePerKm: '',
  weightSurcharge: '0',
  priority: 'STANDARD',
  vehicleType: '',
}

export default function PricingRulesPage() {
  const { accessToken } = useAuth()
  const [rules, setRules] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [allLocations, setAllLocations] = useState<LocationOption[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ basePrice: '', pricePerKm: '', weightSurcharge: '0', estimatedDeliveryDays: '', vehicleType: '', deliveryPriority: 'STANDARD' })
  const [editError, setEditError] = useState('')

  // Route-specific pricing state
  const [routes, setRoutes] = useState<Route[]>([])
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [routeSearch, setRouteSearch] = useState('')
  const [routeLoading, setRouteLoading] = useState(false)
  const [addRouteRuleDialogOpen, setAddRouteRuleDialogOpen] = useState(false)
  const [addRouteRuleForm, setAddRouteRuleForm] = useState(EMPTY_ROUTE_PRICING)
  const [addRouteRuleError, setAddRouteRuleError] = useState('')
  const [editRouteRuleDialogOpen, setEditRouteRuleDialogOpen] = useState(false)
  const [editingRouteRule, setEditingRouteRule] = useState<RoutePricingRule | null>(null)
  const [editRouteRuleForm, setEditRouteRuleForm] = useState(EMPTY_ROUTE_PRICING)
  const [editRouteRuleError, setEditRouteRuleError] = useState('')
  const [deleteRuleDialogOpen, setDeleteRuleDialogOpen] = useState(false)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)
  const [deleteRouteRuleDialogOpen, setDeleteRouteRuleDialogOpen] = useState(false)
  const [deletingRouteRuleId, setDeletingRouteRuleId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/locations?pageSize=200&isActive=true', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r: Response) => r.json())
      .then((d) => { if (d.success) setAllLocations(d.data.items) })
  }, [accessToken])

  async function fetchRules() {
    setLoading(true)
    try {
      const res = await fetch('/api/pricing-rules', { headers: { Authorization: `Bearer ${accessToken}` } })
      const text = await res.text()
      console.log('[PRICING] Response text:', text)
      const data = JSON.parse(text)
      if (data.success) setRules(data.data)
    } catch (err) {
      console.error('[PRICING] fetchRules error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchRoutes() {
    setRouteLoading(true)
    const res = await fetch('/api/routes', { headers: { Authorization: `Bearer ${accessToken}` } })
    const data = await res.json()
    console.log('[PRICING] Routes data:', data)
    if (data.success) setRoutes(data.data)
    setRouteLoading(false)
  }

  async function fetchSelectedRoute() {
    if (!selectedRouteId) return
    setRouteLoading(true)
    const res = await fetch(`/api/routes/${selectedRouteId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
    const data = await res.json()
    if (data.success) {
      setRoutes((prev) => prev.map((r) => (r.id === selectedRouteId ? data.data : r)))
    }
    setRouteLoading(false)
  }

  useEffect(() => { fetchRules(); fetchRoutes() }, [])

  async function handleSave() {
    if (!form.basePrice || !form.pricePerKm) return setError('Base price and price per km are required')
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          basePrice: Number(form.basePrice),
          pricePerKm: Number(form.pricePerKm),
          weightSurcharge: Number(form.weightSurcharge),
          estimatedDeliveryDays: Number(form.estimatedDeliveryDays),
          sourceLocationId: form.sourceLocationId || null,
          destinationLocationId: form.destinationLocationId || null,
          vehicleType: form.vehicleType || null,
          deliveryPriority: form.deliveryPriority,
        }),
      })
      const data = await res.json()
      if (!data.success) return setError(data.error)
      setDialogOpen(false)
      setForm(EMPTY_FORM)
      fetchRules()
    } catch {
      setError('Failed to save rule')
    } finally {
      setSaving(false)
    }
  }

  function openEdit(rule: PricingRule) {
    setEditingRule(rule)
    setEditForm({
      basePrice: String(Number(rule.basePrice)),
      pricePerKm: String(Number(rule.pricePerKm)),
      weightSurcharge: String((rule as any).weightSurcharge ?? 0),
      estimatedDeliveryDays: String(rule.estimatedDeliveryDays),
      vehicleType: rule.vehicleType || '',
      deliveryPriority: rule.deliveryPriority || 'STANDARD',
    })
    setEditError('')
    setEditDialogOpen(true)
  }

  async function handleUpdate() {
    if (!editForm.basePrice || !editForm.pricePerKm) return setEditError('Base price and price per km are required')
    setSaving(true); setEditError('')
    try {
      const res = await fetch(`/api/pricing-rules/${editingRule!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          basePrice: Number(editForm.basePrice),
          pricePerKm: Number(editForm.pricePerKm),
          weightSurcharge: Number(editForm.weightSurcharge),
          estimatedDeliveryDays: Number(editForm.estimatedDeliveryDays),
          vehicleType: editForm.vehicleType || null,
          deliveryPriority: editForm.deliveryPriority,
        }),
      })
      const data = await res.json()
      if (!data.success) return setEditError(data.error || 'Failed to update rule')
      setEditDialogOpen(false)
      fetchRules()
    } catch {
      setEditError('Failed to update rule')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this pricing rule?')) return
    await fetch(`/api/pricing-rules/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    fetchRules()
  }

  function openDeleteRuleDialog(id: string) {
    setDeletingRuleId(id)
    setDeleteRuleDialogOpen(true)
  }

  async function confirmDeleteRule() {
    if (!deletingRuleId) return
    await fetch(`/api/pricing-rules/${deletingRuleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    setDeleteRuleDialogOpen(false)
    setDeletingRuleId(null)
    fetchRules()
  }

  // Route pricing rule functions
  function openAddRouteRuleDialog() {
    if (!selectedRouteId) return
    setAddRouteRuleForm(EMPTY_ROUTE_PRICING)
    setAddRouteRuleError('')
    setAddRouteRuleDialogOpen(true)
  }

  function handleAddRouteRuleChange(field: string, value: string) {
    const newForm = { ...addRouteRuleForm, [field]: value }
    setAddRouteRuleForm(newForm)

    if (selectedRouteId) {
      const route = routes.find((r) => r.id === selectedRouteId)
      if (route) {
        const existingRule = route.pricingRules.find(
          (r) => r.priority === newForm.priority && r.vehicleType === (newForm.vehicleType || null)
        )
        if (existingRule) {
          setAddRouteRuleError(`A rule with priority "${newForm.priority}" and vehicle "${newForm.vehicleType || 'Any'}" already exists.`)
        } else {
          setAddRouteRuleError('')
        }
      }
    }
  }

  async function handleAddRouteRule() {
    if (!selectedRouteId || !addRouteRuleForm.basePrice || !addRouteRuleForm.pricePerKm) {
      return setAddRouteRuleError('Base price and per km are required')
    }
    setSaving(true); setAddRouteRuleError('')
    try {
      const res = await fetch('/api/route-pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          routeId: selectedRouteId,
          basePrice: Number(addRouteRuleForm.basePrice),
          pricePerKm: Number(addRouteRuleForm.pricePerKm),
          weightSurcharge: Number(addRouteRuleForm.weightSurcharge),
          priority: addRouteRuleForm.priority,
          vehicleType: addRouteRuleForm.vehicleType || null,
          isActive: true,
        }),
      })
      const data = await res.json()
      if (!data.success) return setAddRouteRuleError(data.error || 'Failed to add rule')
      setAddRouteRuleDialogOpen(false)
      fetchSelectedRoute()
    } catch {
      setAddRouteRuleError('Failed to add rule')
    } finally {
      setSaving(false)
    }
  }

  function openEditRouteRuleDialog(rule: RoutePricingRule) {
    setEditingRouteRule(rule)
    setEditRouteRuleForm({
      basePrice: String(rule.basePrice),
      pricePerKm: String(rule.pricePerKm),
      weightSurcharge: String((rule as any).weightSurcharge ?? 0),
      priority: rule.priority,
      vehicleType: rule.vehicleType || '',
    })
    setEditRouteRuleError('')
    setEditRouteRuleDialogOpen(true)
  }

  async function handleUpdateRouteRule() {
    if (!editRouteRuleForm.basePrice || !editRouteRuleForm.pricePerKm) {
      return setEditRouteRuleError('Base price and per km are required')
    }
    setSaving(true); setEditRouteRuleError('')
    try {
      const res = await fetch(`/api/route-pricing-rules/${editingRouteRule!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          basePrice: Number(editRouteRuleForm.basePrice),
          pricePerKm: Number(editRouteRuleForm.pricePerKm),
          weightSurcharge: Number(editRouteRuleForm.weightSurcharge),
          vehicleType: editRouteRuleForm.vehicleType || null,
        }),
      })
      const data = await res.json()
      if (!data.success) return setEditRouteRuleError(data.error || 'Failed to update rule')
      setEditRouteRuleDialogOpen(false)
      fetchSelectedRoute()
    } catch {
      setEditRouteRuleError('Failed to update rule')
    } finally {
      setSaving(false)
    }
  }

  function openDeleteRouteRuleDialog(ruleId: string) {
    setDeletingRouteRuleId(ruleId)
    setDeleteRouteRuleDialogOpen(true)
  }

  async function confirmDeleteRouteRule() {
    if (!deletingRouteRuleId) return
    await fetch(`/api/route-pricing-rules/${deletingRouteRuleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    setDeleteRouteRuleDialogOpen(false)
    setDeletingRouteRuleId(null)
    fetchSelectedRoute()
  }

  const filteredRoutes = routes.filter((r) =>
    r.name.toLowerCase().includes(routeSearch.toLowerCase()) ||
    r.sourceLocation.pointName.toLowerCase().includes(routeSearch.toLowerCase()) ||
    r.destinationLocation.pointName.toLowerCase().includes(routeSearch.toLowerCase())
  )
  const selectedRoute = routes.find((r) => r.id === selectedRouteId)

  const globalRules = rules.filter((r) => !r.sourceLocation && !r.destinationLocation)
  const routeRules = rules.filter((r) => r.sourceLocation || r.destinationLocation)

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pricing Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure global fallback rules and route-specific pricing with vehicle types.
        </p>
      </div>

      <Tabs defaultValue="global" className="w-full">
        <TabsList>
          <TabsTrigger value="global">Global Rules</TabsTrigger>
          <TabsTrigger value="route">Route-Specific Rules</TabsTrigger>
        </TabsList>

        {/* Global Rules Tab */}
        <TabsContent value="global" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Global fallback rules apply when no route-specific rule matches</p>
            </div>
            <Button onClick={() => { setDialogOpen(true); setError('') }}>
              <Plus className="h-4 w-4 mr-2" />Add Global Rule
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : globalRules.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No global rule set. Add one as fallback for all routes.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {globalRules.map((rule) => <RuleCard key={rule.id} rule={rule} onDelete={openDeleteRuleDialog} onEdit={openEdit} />)}
            </div>
          )}
        </TabsContent>

        {/* Route-Specific Rules Tab */}
        <TabsContent value="route" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search routes by name, source, or destination..."
                value={routeSearch}
                onChange={(e) => setRouteSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/routes'}>
              <Plus className="h-4 w-4 mr-2" />Create New Route
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Route List */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Routes</p>
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {routeLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredRoutes.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No routes found</div>
                ) : (
                  filteredRoutes.map((route) => (
                    <button
                      key={route.id}
                      onClick={() => { setSelectedRouteId(route.id); fetchSelectedRoute() }}
                      className={`w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-muted/50 transition-colors ${
                        selectedRouteId === route.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <RouteIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">{route.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {route.sourceLocation.pointName} → {route.destinationLocation.pointName}
                      </div>
                      <Badge variant={route.isActive ? 'default' : 'secondary'} className="text-xs mt-1">
                        {route.pricingRules.length} rules
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Route Pricing Rules */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {selectedRoute ? `${selectedRoute.name} Pricing Rules` : 'Select a route'}
                </p>
                {selectedRoute && (
                  <Button size="sm" onClick={openAddRouteRuleDialog}>
                    <Plus className="h-3 w-3 mr-1" />Add Rule
                  </Button>
                )}
              </div>

              {!selectedRoute ? (
                <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Select a route to view and manage its pricing rules</CardContent></Card>
              ) : (
                <>
                  {/* Route Segments */}
                  <Card>
                    <CardHeader className="pb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Route Segments</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedRoute.segments.map((seg: any) => (
                          <div key={seg.id} className="flex items-center gap-2 text-sm bg-muted/40 rounded-lg p-2">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium w-5 text-center">{seg.fromLocation.pointName[0]}</span>
                            <span className="flex-1">{seg.fromLocation.pointName} → {seg.toLocation.pointName}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pricing Rules */}
                  {selectedRoute.pricingRules.length === 0 ? (
                    <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No pricing rules for this route yet</CardContent></Card>
                  ) : (
                    <div className="space-y-2">
                      {selectedRoute.pricingRules.map((rule) => (
                        <RoutePricingRuleCard
                          key={rule.id}
                          rule={rule}
                          onEdit={openEditRouteRuleDialog}
                          onDelete={openDeleteRouteRuleDialog}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Pricing Rule</DialogTitle></DialogHeader>
          {editingRule && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
              {editingRule.sourceLocation
                ? `${editingRule.sourceLocation.pointName} → ${editingRule.destinationLocation?.pointName ?? 'Any'}`
                : 'Global Rule'}
              <span className="ml-1 text-muted-foreground/60">(source/destination cannot be changed)</span>
            </p>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Vehicle Type</Label>
            <Select value={editForm.vehicleType} onValueChange={(v) => setEditForm((f) => ({ ...f, vehicleType: v === 'ANY' ? '' : v }))}>
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
          <div className="space-y-1.5">
            <Label className="text-xs">Delivery Priority</Label>
            <Select value={editForm.deliveryPriority} onValueChange={(v) => setEditForm((f) => ({ ...f, deliveryPriority: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="EXPRESS">Express (+50%)</SelectItem>
                <SelectItem value="OVERNIGHT">Overnight (+100%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {([
              ['basePrice', 'Base Price (₹)'],
              ['pricePerKm', 'Price per km (₹)'],
              ['weightSurcharge', 'Weight Surcharge (₹)'],
              ['estimatedDeliveryDays', 'Est. Delivery Days'],
            ] as [keyof EditForm, string][]).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Input
                  type="number"
                  value={editForm[key]}
                  onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Pricing Rule</DialogTitle></DialogHeader>
          <div className="space-y-1 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <p>Leave source/destination blank to create a <strong>global fallback</strong> rule.</p>
            <p>Formula: <code>Base + (distance km x Per Km) + weight surcharge</code></p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Source Location (optional)</Label>
              <Select value={form.sourceLocationId} onValueChange={(v) => setForm((f) => ({ ...f, sourceLocationId: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Any location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any (global)</SelectItem>
                  {allLocations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.pointName} — {l.district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Destination Location (optional)</Label>
              <Select value={form.destinationLocationId} onValueChange={(v) => setForm((f) => ({ ...f, destinationLocationId: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Any location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any (global)</SelectItem>
                  {allLocations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.pointName} — {l.district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Vehicle Type (optional)</Label>
            <Select value={form.vehicleType} onValueChange={(v) => setForm((f) => ({ ...f, vehicleType: v === 'ANY' ? '' : v }))}>
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
          <div className="space-y-1.5">
            <Label className="text-xs">Delivery Priority</Label>
            <Select value={form.deliveryPriority} onValueChange={(v) => setForm((f) => ({ ...f, deliveryPriority: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="EXPRESS">Express (+50%)</SelectItem>
                <SelectItem value="OVERNIGHT">Overnight (+100%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {([
              ['basePrice', 'Base Price (₹)', 'e.g. 50'],
              ['pricePerKm', 'Price per km (₹)', 'e.g. 5'],
              ['weightSurcharge', 'Weight Surcharge (₹)', '0'],
              ['estimatedDeliveryDays', 'Est. Delivery Days', '3'],
            ] as [string, string, string][]).map(([key, label, placeholder]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Input
                  type="number"
                  placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={saving} onClick={handleSave}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Route Pricing Rule Dialog */}
      <Dialog open={addRouteRuleDialogOpen} onOpenChange={setAddRouteRuleDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Pricing Rule</DialogTitle></DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs">Priority</Label>
            <Select value={addRouteRuleForm.priority} onValueChange={(v) => handleAddRouteRuleChange('priority', v)}>
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
            <Select value={addRouteRuleForm.vehicleType} onValueChange={(v) => handleAddRouteRuleChange('vehicleType', v === 'ANY' ? '' : v)}>
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
            ] as [keyof typeof addRouteRuleForm, string][]).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Input type="number" value={addRouteRuleForm[key]} onChange={(e) => setAddRouteRuleForm((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          {addRouteRuleError && <p className="text-sm text-destructive">{addRouteRuleError}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setAddRouteRuleDialogOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={saving || !!addRouteRuleError} onClick={handleAddRouteRule}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Route Pricing Rule Dialog */}
      <Dialog open={editRouteRuleDialogOpen} onOpenChange={setEditRouteRuleDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Pricing Rule</DialogTitle></DialogHeader>
          {editingRouteRule && (
            <p className="text-xs bg-muted/50 rounded-lg p-2.5 text-muted-foreground">
              Priority: <span className="font-medium text-foreground">{editingRouteRule.priority}</span>
              <span className="ml-1 text-muted-foreground/60">(priority cannot be changed)</span>
            </p>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Vehicle Type</Label>
            <Select value={editRouteRuleForm.vehicleType} onValueChange={(v) => setEditRouteRuleForm((f) => ({ ...f, vehicleType: v === 'ANY' ? '' : v }))}>
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
            ] as [keyof typeof editRouteRuleForm, string][]).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Input type="number" value={editRouteRuleForm[key]} onChange={(e) => setEditRouteRuleForm((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          {editRouteRuleError && <p className="text-sm text-destructive">{editRouteRuleError}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditRouteRuleDialogOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={saving} onClick={handleUpdateRouteRule}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Global Rule Confirmation Dialog */}
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
              <Button variant="destructive" onClick={confirmDeleteRule}>
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Route Pricing Rule Confirmation Dialog */}
      <AlertDialog open={deleteRouteRuleDialogOpen} onOpenChange={setDeleteRouteRuleDialogOpen}>
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
              <Button variant="destructive" onClick={confirmDeleteRouteRule}>
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function RuleCard({ rule, onDelete, onEdit }: { rule: PricingRule; onDelete: (id: string) => void; onEdit: (rule: PricingRule) => void }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {rule.sourceLocation
              ? `${rule.sourceLocation.pointName} → ${rule.destinationLocation?.pointName ?? 'Any'}`
              : 'Global Rule'}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => onEdit(rule)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(rule.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><p className="text-xs text-muted-foreground">Base Price</p><p className="font-semibold">&#8377;{Number(rule.basePrice).toFixed(2)}</p></div>
          <div><p className="text-xs text-muted-foreground">Per Km</p><p className="font-semibold">&#8377;{Number(rule.pricePerKm).toFixed(2)}</p></div>
          <div><p className="text-xs text-muted-foreground">Est. Days</p><p className="font-semibold">{rule.estimatedDeliveryDays}d</p></div>
          <div><p className="text-xs text-muted-foreground">Vehicle</p><p className="font-semibold">{rule.vehicleType ?? 'Any'}</p></div>
        </div>
      </CardContent>
    </Card>
  )
}

function RoutePricingRuleCard({ rule, onEdit, onDelete }: { rule: RoutePricingRule; onEdit: (rule: RoutePricingRule) => void; onDelete: (id: string) => void }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-6 gap-3 flex-1 text-xs">
            <div><p className="text-muted-foreground">Priority</p><p className="font-medium">{rule.priority}</p></div>
            <div><p className="text-muted-foreground">Vehicle</p><p className="font-medium">{rule.vehicleType ?? 'Any'}</p></div>
            <div><p className="text-muted-foreground">Base Price</p><p className="font-medium">₹{Number(rule.basePrice)}</p></div>
            <div><p className="text-muted-foreground">Per Km</p><p className="font-medium">₹{Number(rule.pricePerKm)}</p></div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground" onClick={() => onEdit(rule)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-destructive" onClick={() => onDelete(rule.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
