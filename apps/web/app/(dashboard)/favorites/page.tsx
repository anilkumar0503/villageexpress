'use client'

import { useEffect, useState } from 'react'
import { MapPin, Trash2, Edit2, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'

type FavoriteLocation = {
  id: string
  label: string
  locationType: string
  createdAt: string
  location: {
    id: string
    pointName: string
    village: string
    district: string
    state: string
    pincode: string
  }
}

export default function FavoritesPage() {
  const { accessToken } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([])
  const [loading, setLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingFavorite, setEditingFavorite] = useState<FavoriteLocation | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editType, setEditType] = useState<'PICKUP' | 'DROP' | 'BOTH'>('BOTH')

  useEffect(() => {
    fetchFavorites()
  }, [accessToken])

  async function fetchFavorites() {
    setLoading(true)
    try {
      const res = await fetch('/api/favorite-locations', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const d = await res.json()
      if (d.success) setFavorites(d.data)
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(locationId: string) {
    if (!confirm('Are you sure you want to remove this favorite location?')) return
    
    try {
      const res = await fetch(`/api/favorite-locations?locationId=${locationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const d = await res.json()
      if (d.success) {
        fetchFavorites()
      }
    } catch (error) {
      console.error('Failed to delete favorite:', error)
    }
  }

  function handleEdit(favorite: FavoriteLocation) {
    setEditingFavorite(favorite)
    setEditLabel(favorite.label)
    setEditType(favorite.locationType as any)
    setShowEditModal(true)
  }

  async function handleSaveEdit() {
    if (!editingFavorite || !editLabel) return

    try {
      // Delete old favorite
      await fetch(`/api/favorite-locations?locationId=${editingFavorite.location.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      // Create new favorite with updated details
      const res = await fetch('/api/favorite-locations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}` 
        },
        body: JSON.stringify({ 
          locationId: editingFavorite.location.id, 
          label: editLabel, 
          locationType: editType 
        }),
      })
      const d = await res.json()
      if (d.success) {
        fetchFavorites()
        setShowEditModal(false)
        setEditingFavorite(null)
        setEditLabel('')
      }
    } catch (error) {
      console.error('Failed to update favorite:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Favorite Locations</h1>
        <p className="text-muted-foreground">Manage your saved locations for quick booking</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : favorites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No favorite locations yet</h3>
            <p className="text-muted-foreground mb-4">Add locations as favorites to quickly select them during booking</p>
            <Button onClick={() => window.location.href = '/bookings/new'}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Favorite
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {favorites.map((favorite) => (
            <Card key={favorite.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{favorite.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {favorite.location.pointName}, {favorite.location.village}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {favorite.location.district}, {favorite.location.state} - {favorite.location.pincode}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                          {favorite.locationType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(favorite)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(favorite.location.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingFavorite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Favorite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Label</Label>
                <Input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="Enter label (e.g., Home, Office)"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Use for</Label>
                <Select value={editType} onValueChange={(v: any) => setEditType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PICKUP">Pickup Only</SelectItem>
                    <SelectItem value="DROP">Drop Only</SelectItem>
                    <SelectItem value="BOTH">Both Pickup & Drop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowEditModal(false)} variant="outline" className="flex-1">Cancel</Button>
                <Button onClick={handleSaveEdit} disabled={!editLabel} className="flex-1">Save</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
