'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Save, X, Bike, Car } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useFetchWithAuth } from '@/hooks/use-auth'

interface VehicleConfiguration {
  id: string
  vehicleType: string
  displayName: string
  description: string | null
  defaultWeight: number
  maxWeight: number
  icon: string | null
  isActive: boolean
  sortOrder: number
  distanceTiers: DistancePricingTier[]
}

interface DistancePricingTier {
  id: string
  vehicleConfigId: string
  minDistance: number
  maxDistance: number
  pricePerKm: number
  sortOrder: number
  isActive: boolean
}

export default function VehicleConfigurationsPage() {
  const { isAuthenticated } = useAuth()
  const fetchWithAuth = useFetchWithAuth()
  const [configurations, setConfigurations] = useState<VehicleConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<VehicleConfiguration>>({})
  const [isCreating, setIsCreating] = useState(false)
  const [editingTiers, setEditingTiers] = useState<string | null>(null)
  const [tierFormData, setTierFormData] = useState<Partial<DistancePricingTier>>({})
  const [isCreatingTier, setIsCreatingTier] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) return
    fetchConfigurations()
  }, [isAuthenticated])

  const fetchConfigurations = async () => {
    try {
      const response = await fetchWithAuth('/api/vehicle-configurations')
      const data = await response.json()
      if (data.success) {
        setConfigurations(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch configurations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setIsCreating(true)
    setFormData({
      vehicleType: 'BIKE',
      displayName: '',
      description: '',
      defaultWeight: 5,
      maxWeight: 5,
      icon: 'bike',
      isActive: true,
      sortOrder: 0,
    })
  }

  const handleEdit = (config: VehicleConfiguration) => {
    setEditing(config.id)
    setFormData({ ...config })
  }

  const handleSave = async () => {
    try {
      const response = await fetchWithAuth('/api/vehicle-configurations', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (data.success) {
        await fetchConfigurations()
        setIsCreating(false)
        setEditing(null)
        setFormData({})
      }
    } catch (error) {
      console.error('Failed to save configuration:', error)
    }
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditing(null)
    setFormData({})
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return
    // TODO: Implement delete API
  }

  const handleCreateTier = (configId: string) => {
    setIsCreatingTier(true)
    setEditingTiers(configId)
    setTierFormData({
      vehicleConfigId: configId,
      minDistance: 0,
      maxDistance: 2,
      pricePerKm: 10,
      sortOrder: 0,
      isActive: true,
    })
  }

  const handleEditTier = (tier: DistancePricingTier) => {
    setEditingTiers(tier.id)
    setTierFormData({ ...tier })
  }

  const handleSaveTier = async (configId: string) => {
    try {
      const url = tierFormData.id
        ? `/api/vehicle-configurations/tiers/${tierFormData.id}`
        : '/api/vehicle-configurations/tiers'
      const method = tierFormData.id ? 'PUT' : 'POST'
      
      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(tierFormData),
      })
      const data = await response.json()
      if (data.success) {
        await fetchConfigurations()
        setIsCreatingTier(false)
        setEditingTiers(null)
        setTierFormData({})
      }
    } catch (error) {
      console.error('Failed to save tier:', error)
    }
  }

  const handleCancelTier = () => {
    setIsCreatingTier(false)
    setEditingTiers(null)
    setTierFormData({})
  }

  const handleDeleteTier = async (tierId: string) => {
    if (!confirm('Are you sure you want to delete this pricing tier?')) return
    try {
      const response = await fetchWithAuth(`/api/vehicle-configurations/tiers/${tierId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        await fetchConfigurations()
      }
    } catch (error) {
      console.error('Failed to delete tier:', error)
    }
  }

  const getIcon = (icon: string | null) => {
    switch (icon) {
      case 'bike':
        return <Bike className="h-5 w-5" />
      case 'car':
      case 'auto':
      case 'van':
        return <Car className="h-5 w-5" />
      default:
        return <Bike className="h-5 w-5" />
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Configurations</h1>
          <p className="text-muted-foreground mt-2">Manage vehicle types, weight limits, and distance-based pricing tiers</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition"
        >
          <Plus className="h-4 w-4" />
          Add Configuration
        </button>
      </div>

      <div className="space-y-6">
        {configurations.map((config) => (
          <div key={config.id} className="bg-card rounded-lg border border-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getIcon(config.icon)}
                  <div>
                    <h3 className="text-lg font-semibold">{config.displayName}</h3>
                    <p className="text-sm text-muted-foreground">{config.vehicleType} • {config.defaultWeight}-{config.maxWeight}kg</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(config)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(config.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {editing === config.id ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-1">Vehicle Type</label>
                    <select
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    >
                      <option value="BIKE">BIKE</option>
                      <option value="AUTO">AUTO</option>
                      <option value="MINI_VAN">MINI_VAN</option>
                      <option value="VAN">VAN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Display Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Default Weight</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                      value={formData.defaultWeight}
                      onChange={(e) => setFormData({ ...formData, defaultWeight: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Weight</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                      value={formData.maxWeight}
                      onChange={(e) => setFormData({ ...formData, maxWeight: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Icon</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                      value={formData.icon || ''}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="bike, auto, van"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sort Order</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Active</label>
                    <label className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      <span className="text-sm">Active</span>
                    </label>
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      <Save className="h-4 w-4 inline mr-1" /> Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                      <X className="h-4 w-4 inline mr-1" /> Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Distance Pricing Tiers Section */}
            <div className="border-t border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold">Distance Pricing Tiers</h4>
                <button
                  onClick={() => handleCreateTier(config.id)}
                  className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-primary/90 transition"
                >
                  <Plus className="h-3 w-3" /> Add Tier
                </button>
              </div>

              {config.distanceTiers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No distance pricing tiers configured</p>
              ) : (
                <div className="space-y-2">
                  {config.distanceTiers.map((tier) => (
                    <div key={tier.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      {editingTiers === tier.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex flex-col">
                            <label className="text-xs text-muted-foreground">Min (km)</label>
                            <input
                              type="number"
                              className="w-20 px-2 py-1 border border-input rounded bg-background text-sm"
                              placeholder="Min"
                              value={tierFormData.minDistance}
                              onChange={(e) => setTierFormData({ ...tierFormData, minDistance: Number(e.target.value) })}
                            />
                          </div>
                          <span className="text-sm mt-4">-</span>
                          <div className="flex flex-col">
                            <label className="text-xs text-muted-foreground">Max (km)</label>
                            <input
                              type="number"
                              className="w-20 px-2 py-1 border border-input rounded bg-background text-sm"
                              placeholder="Max"
                              value={tierFormData.maxDistance}
                              onChange={(e) => setTierFormData({ ...tierFormData, maxDistance: Number(e.target.value) })}
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-xs text-muted-foreground">Rate (₹/km)</label>
                            <input
                              type="number"
                              className="w-24 px-2 py-1 border border-input rounded bg-background text-sm"
                              placeholder="Price/km"
                              value={tierFormData.pricePerKm}
                              onChange={(e) => setTierFormData({ ...tierFormData, pricePerKm: Number(e.target.value) })}
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-xs text-muted-foreground">Order</label>
                            <input
                              type="number"
                              className="w-16 px-2 py-1 border border-input rounded bg-background text-sm"
                              placeholder="Order"
                              value={tierFormData.sortOrder}
                              onChange={(e) => setTierFormData({ ...tierFormData, sortOrder: Number(e.target.value) })}
                            />
                          </div>
                          <div className="flex items-end gap-1 mt-2">
                            <button
                              onClick={() => handleSaveTier(config.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelTier}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{tier.minDistance}-{tier.maxDistance}km</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm">₹{tier.pricePerKm}/km</span>
                            {!tier.isActive && (
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">Inactive</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditTier(tier)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteTier(tier.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isCreatingTier && editingTiers === config.id && (
                <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <label className="text-xs text-muted-foreground">Min (km)</label>
                      <input
                        type="number"
                        className="w-20 px-2 py-1 border border-input rounded bg-background text-sm"
                        placeholder="Min km"
                        value={tierFormData.minDistance}
                        onChange={(e) => setTierFormData({ ...tierFormData, minDistance: Number(e.target.value) })}
                      />
                    </div>
                    <span className="text-sm mt-4">-</span>
                    <div className="flex flex-col">
                      <label className="text-xs text-muted-foreground">Max (km)</label>
                      <input
                        type="number"
                        className="w-20 px-2 py-1 border border-input rounded bg-background text-sm"
                        placeholder="Max km"
                        value={tierFormData.maxDistance}
                        onChange={(e) => setTierFormData({ ...tierFormData, maxDistance: Number(e.target.value) })}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs text-muted-foreground">Rate (₹/km)</label>
                      <input
                        type="number"
                        className="w-24 px-2 py-1 border border-input rounded bg-background text-sm"
                        placeholder="Price/km"
                        value={tierFormData.pricePerKm}
                        onChange={(e) => setTierFormData({ ...tierFormData, pricePerKm: Number(e.target.value) })}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs text-muted-foreground">Order</label>
                      <input
                        type="number"
                        className="w-16 px-2 py-1 border border-input rounded bg-background text-sm"
                        placeholder="Order"
                        value={tierFormData.sortOrder}
                        onChange={(e) => setTierFormData({ ...tierFormData, sortOrder: Number(e.target.value) })}
                      />
                    </div>
                    <div className="flex items-end gap-1 mt-2">
                      <button
                        onClick={() => handleSaveTier(config.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancelTier}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isCreating && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">New Vehicle Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle Type</label>
                <select
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                >
                  <option value="BIKE">BIKE</option>
                  <option value="AUTO">AUTO</option>
                  <option value="MINI_VAN">MINI_VAN</option>
                  <option value="VAN">VAN</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Display Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Display name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Default Weight</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                  value={formData.defaultWeight}
                  onChange={(e) => setFormData({ ...formData, defaultWeight: Number(e.target.value) })}
                  placeholder="Default weight"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Weight</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                  value={formData.maxWeight}
                  onChange={(e) => setFormData({ ...formData, maxWeight: Number(e.target.value) })}
                  placeholder="Max weight"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icon</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                  value={formData.icon || ''}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="bike, auto, van"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sort Order</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Active</label>
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <Save className="h-4 w-4 inline mr-1" /> Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  <X className="h-4 w-4 inline mr-1" /> Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
