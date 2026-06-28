'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Loader2, MapPin, Pencil, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'

type Location = {
  id: string
  state: string
  district: string
  mandal: string | null
  village: string
  pointName: string
  pincode: string
  locationType: string
  latitude: number
  longitude: number
  isActive: boolean
}

const STATES = ['Telangana', 'Andhra Pradesh']

const DISTRICTS: Record<string, string[]> = {
  'Telangana': [
    'Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagtial', 'Jangaon', 'Jayashankar Bhupalpally',
    'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 'Khammam', 'Kumuram Bheem Asifabad', 'Mahabubabad',
    'Mahabubnagar', 'Mancherial', 'Medak', 'Medchal Malkajgiri', 'Mulugu', 'Nagarkurnool', 'Nalgonda',
    'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 'Ranga Reddy', 'Sangareddy',
    'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal Rural', 'Warangal Urban', 'Yadadri Bhongir'
  ],
  'Andhra Pradesh': [
    'Alluri Sitharama Raju', 'Anakapalli', 'Ananthapur', 'Annamayya', 'Bapatla', 'Chittoor', 'Dr. B.R. Ambedkar Konaseema',
    'East Godavari', 'Eluru', 'Guntur', 'Kakinada', 'Krishna', 'Kurnool', 'NTR', 'Nandyal', 'Palnadu', 'Parvathipuram Manyam',
    'Prakasam', 'Srikakulam', 'Tirupati', 'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'Y.S.R. Kadapa'
  ]
}

const EMPTY_FORM = {
  state: '', district: '', mandal: '', village: '',
  pointName: '', pincode: '', latitude: '', longitude: '',
  locationType: 'POINT',
}

export default function LocationsPage() {
  const { accessToken } = useAuth()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 50
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function fetchLocations() {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page), isActive: 'true' })
    if (search) params.set('search', search)
    const res = await fetch(`/api/locations?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    if (data.success) { setLocations(data.data.items); setTotal(data.data.total) }
    setLoading(false)
  }

  useEffect(() => { fetchLocations() }, [page, search])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setDialogOpen(true)
  }

  function handleStateChange(state: string) {
    setForm((f) => ({ ...f, state, district: '' }))
  }

  function openEdit(loc: Location) {
    setEditing(loc)
    setForm({
      state: loc.state, district: loc.district, mandal: loc.mandal ?? '',
      village: loc.village, pointName: loc.pointName, pincode: loc.pincode,
      latitude: String(loc.latitude), longitude: String(loc.longitude),
      locationType: loc.locationType,
    })
    setError('')
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true); setError('')
    const payload = {
      ...form,
      mandal: form.mandal || undefined,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    }
    try {
      const res = await fetch(editing ? `/api/locations/${editing.id}` : '/api/locations', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.success) return setError(data.error ?? 'Failed to save')
      setDialogOpen(false)
      fetchLocations()
    } catch {
      setError('Network error. Try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(loc: Location) {
    await fetch(`/api/locations/${loc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ isActive: !loc.isActive }),
    })
    fetchLocations()
  }

  const filtered = locations.filter((l) =>
    !search ||
    l.pointName.toLowerCase().includes(search.toLowerCase()) ||
    l.village.toLowerCase().includes(search.toLowerCase()) ||
    l.district.toLowerCase().includes(search.toLowerCase()) ||
    l.state.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Locations</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total location{total !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />Add Location
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search locations..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        {loading ? (
          <CardContent className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No locations found</p>
            <Button size="sm" className="mt-4" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add first location</Button>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Point Name</TableHead>
                <TableHead>Village / District</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Pincode</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium">{loc.pointName}</TableCell>
                  <TableCell>
                    <p>{loc.village}</p>
                    <p className="text-xs text-muted-foreground">{loc.district}</p>
                  </TableCell>
                  <TableCell className="text-sm">{loc.state}</TableCell>
                  <TableCell className="font-mono text-sm">{loc.pincode}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{loc.locationType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={loc.isActive ? 'default' : 'secondary'} className="text-xs">
                      {loc.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(loc)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(loc)}>
                        <PowerOff className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Location' : 'Add Location'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>State</Label>
              <Select value={form.state} onValueChange={handleStateChange}>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>
                  {STATES.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>District</Label>
              <Select
                value={form.district}
                onValueChange={(v) => setForm((f) => ({ ...f, district: v }))}
                disabled={!form.state}
              >
                <SelectTrigger><SelectValue placeholder={form.state ? 'Select district' : 'Select state first'} /></SelectTrigger>
                <SelectContent>
                  {form.state && DISTRICTS[form.state]?.map((district) => (
                    <SelectItem key={district} value={district}>{district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {([
              ['mandal', 'Mandal (optional)', 'e.g. Narasaraopet'],
              ['village', 'Village', 'e.g. Chilakaluripet'],
              ['pointName', 'Point Name', 'e.g. VE Chilakaluripet Hub'],
              ['pincode', 'Pincode', '6-digit'],
              ['latitude', 'Latitude', 'e.g. 16.0900'],
              ['longitude', 'Longitude', 'e.g. 80.1667'],
            ] as [string, string, string][]).map(([key, label, placeholder]) => (
              <div key={key} className={`space-y-1.5 ${key === 'pointName' ? 'col-span-2' : ''}`}>
                <Label>{label}</Label>
                <Input
                  placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  type={['latitude', 'longitude'].includes(key) ? 'number' : 'text'}
                />
              </div>
            ))}
            <div className="space-y-1.5 col-span-2">
              <Label>Location Type</Label>
              <Select value={form.locationType} onValueChange={(v) => setForm((f) => ({ ...f, locationType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="POINT">POINT</SelectItem>
                  <SelectItem value="HUB">HUB</SelectItem>
                  <SelectItem value="WAREHOUSE">WAREHOUSE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={saving} onClick={handleSave}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? 'Save Changes' : 'Add Location'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} locations
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))}
              disabled={page === Math.ceil(total / pageSize)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
