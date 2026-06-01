'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Trash2, Edit, Shield, Key, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'

type Role = { id: string; name: string; description: string; level: number; isActive: boolean; _count: { userRoles: number } }
type Permission = { id: string; name: string; description: string; resource: string; action: string; _count: { rolePermissions: number } }
type RolePermission = { id: string; roleId: string; permissionId: string; scope: string; permission: Permission }

export default function RolesPermissionsPage() {
  const { accessToken } = useAuth()
  const [tab, setTab] = useState<'roles' | 'permissions'>('roles')
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [rolePerms, setRolePerms] = useState<Record<string, RolePermission[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [roleDialog, setRoleDialog] = useState(false)
  const [permDialog, setPermDialog] = useState(false)
  const [assignDialog, setAssignDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const [roleForm, setRoleForm] = useState({ name: '', description: '', level: 50, isActive: true })
  const [permForm, setPermForm] = useState({ name: '', description: '', resource: '', action: '' })
  const [assignForm, setAssignForm] = useState({ permissionId: '', scope: 'GLOBAL' })

  useEffect(() => {
    Promise.all([
      fetch('/api/roles', { headers: { Authorization: `Bearer ${accessToken}` } }).then((r: Response) => r.json()),
      fetch('/api/permissions', { headers: { Authorization: `Bearer ${accessToken}` } }).then((r: Response) => r.json()),
    ]).then(([r, p]) => {
      if (r.success) setRoles(r.data)
      if (p.success) setPermissions(p.data)
      setLoading(false)
    })
  }, [accessToken])

  async function loadRolePerms(roleId: string) {
    const res = await fetch(`/api/roles/${roleId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
    const data = await res.json()
    if (data.success) setRolePerms((prev) => ({ ...prev, [roleId]: data.data.rolePermissions }))
  }

  async function saveRole() {
    setSaving(true)
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(roleForm),
    })
    const data = await res.json()
    if (data.success) {
      setRoles((prev) => [...prev, data.data])
      setRoleDialog(false)
      setRoleForm({ name: '', description: '', level: 50, isActive: true })
    }
    setSaving(false)
  }

  async function savePermission() {
    setSaving(true)
    const res = await fetch('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(permForm),
    })
    const data = await res.json()
    if (data.success) {
      setPermissions((prev) => [...prev, data.data])
      setPermDialog(false)
      setPermForm({ name: '', description: '', resource: '', action: '' })
    }
    setSaving(false)
  }

  async function assignPermission() {
    if (!selectedRole) return
    setSaving(true)
    const res = await fetch(`/api/roles/${selectedRole.id}/permissions/${assignForm.permissionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ scope: assignForm.scope }),
    })
    const data = await res.json()
    if (data.success) {
      await loadRolePerms(selectedRole.id)
      setAssignDialog(false)
      setAssignForm({ permissionId: '', scope: 'GLOBAL' })
    }
    setSaving(false)
  }

  async function removePermission(roleId: string, permissionId: string, scope: string) {
    await fetch(`/api/roles/${roleId}/permissions/${permissionId}?scope=${scope}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    await loadRolePerms(roleId)
  }

  async function deleteRole(id: string) {
    if (!confirm('Delete this role?')) return
    await fetch(`/api/roles/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } })
    setRoles((prev) => prev.filter((r) => r.id !== id))
  }

  async function deletePermission(id: string) {
    if (!confirm('Delete this permission?')) return
    await fetch(`/api/permissions/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } })
    setPermissions((prev) => prev.filter((p) => p.id !== id))
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>

      <div className="flex gap-2 mb-4">
        <Button variant={tab === 'roles' ? 'default' : 'outline'} onClick={() => setTab('roles')}>Roles</Button>
        <Button variant={tab === 'permissions' ? 'default' : 'outline'} onClick={() => setTab('permissions')}>Permissions</Button>
      </div>

      {tab === 'roles' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={roleDialog} onOpenChange={setRoleDialog}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" />New Role</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Role</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label>Name (UPPERCASE)</Label><Input value={roleForm.name} onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value.toUpperCase() }))} placeholder="e.g. FRANCHISE_OWNER" /></div>
                  <div className="space-y-1.5"><Label>Description</Label><Input value={roleForm.description} onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>Level (1-100)</Label><Input type="number" value={roleForm.level} onChange={(e) => setRoleForm((f) => ({ ...f, level: Number(e.target.value) }))} /></div>
                </div>
                <DialogFooter>
                  <Button onClick={saveRole} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {roles.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{r.name}</span>
                        <Badge variant={r.isActive ? 'default' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>
                        <Badge variant="outline" className="text-xs">Level {r.level}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{r._count.userRoles} users assigned</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedRole(r); loadRolePerms(r.id); setAssignDialog(true) }}><Shield className="h-4 w-4 mr-2" />Permissions</Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteRole(r.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'permissions' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={permDialog} onOpenChange={setPermDialog}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" />New Permission</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Permission</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label>Name (resource:action)</Label><Input value={permForm.name} onChange={(e) => setPermForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. booking:create" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Resource</Label><Input value={permForm.resource} onChange={(e) => setPermForm((f) => ({ ...f, resource: e.target.value }))} placeholder="booking" /></div>
                    <div className="space-y-1.5"><Label>Action</Label><Input value={permForm.action} onChange={(e) => setPermForm((f) => ({ ...f, action: e.target.value }))} placeholder="create" /></div>
                  </div>
                  <div className="space-y-1.5"><Label>Description</Label><Input value={permForm.description} onChange={(e) => setPermForm((f) => ({ ...f, description: e.target.value }))} /></div>
                </div>
                <DialogFooter>
                  <Button onClick={savePermission} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {permissions.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{p.name}</span>
                        <Badge variant="outline" className="text-xs">{p._count.rolePermissions} roles</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deletePermission(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Assign Permission Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Permission to {selectedRole?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Permission</Label>
              <Select value={assignForm.permissionId} onValueChange={(v) => setAssignForm((f) => ({ ...f, permissionId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {permissions.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Scope</Label>
              <Select value={assignForm.scope} onValueChange={(v) => setAssignForm((f) => ({ ...f, scope: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['GLOBAL', 'REGION', 'DISTRICT', 'LOCATION'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedRole && rolePerms[selectedRole.id]?.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Current permissions:</p>
                <div className="flex flex-wrap gap-1">
                  {rolePerms[selectedRole.id].map((rp) => (
                    <Badge key={rp.id} variant="secondary" className="text-xs flex items-center gap-1">
                      {rp.permission.name} ({rp.scope})
                      <button onClick={() => removePermission(selectedRole.id, rp.permissionId, rp.scope)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={assignPermission} disabled={saving || !assignForm.permissionId}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
