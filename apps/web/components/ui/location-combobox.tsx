'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export type LocationOption = {
  id: string
  pointName: string
  village: string
  district: string
  state: string
}

interface LocationComboboxProps {
  locations: LocationOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  triggerClassName?: string
}

export function LocationCombobox({
  locations,
  value,
  onValueChange,
  placeholder = 'Select location',
  className,
  triggerClassName,
}: LocationComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = locations.find((l) => l.id === value)

  const filtered = locations.filter((l) => {
    const q = search.toLowerCase()
    return (
      (l.pointName ?? '').toLowerCase().includes(q) ||
      (l.village ?? '').toLowerCase().includes(q) ||
      (l.district ?? '').toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0)
    }
  }, [open])

  function handleSelect(id: string) {
    onValueChange(id)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          !selected && 'text-muted-foreground',
          triggerClassName
        )}
      >
        <span className="line-clamp-1 flex-1 text-left">
          {selected
            ? `${selected.pointName ?? ''}${selected.village ? ` (${selected.village})` : ''}${selected.district ? ` — ${selected.district}` : ''}`
            : placeholder}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={searchRef}
              placeholder="Search locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-[220px] overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No locations found.</p>
            ) : (
              filtered.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleSelect(l.id)}
                  className={cn(
                    'relative flex w-full cursor-pointer items-center rounded-sm py-1.5 pl-8 pr-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                    value === l.id && 'bg-accent text-accent-foreground'
                  )}
                >
                  {value === l.id && (
                    <span className="absolute left-2 flex items-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                  {l.pointName ?? ''}{l.village ? ` (${l.village})` : ''}{l.district ? ` — ${l.district}` : ''}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
