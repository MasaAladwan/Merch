import { create } from 'zustand'
import type { Decal, SavedDesign } from './types'

interface DesignState {
  // Live customization state (in-session)
  activeProductId: string | null
  colorHex: string
  decals: Decal[]
  selectedDecalId: string | null

  setActiveProduct: (id: string, defaultColor: string) => void
  setColor: (hex: string) => void
  addDecal: (d: Omit<Decal, 'id'>) => string
  updateDecal: (id: string, patch: Partial<Decal>) => void
  removeDecal: (id: string) => void
  selectDecal: (id: string | null) => void
  reset: () => void

  // Saved designs (persisted in localStorage)
  savedDesigns: SavedDesign[]
  /** Returns the new design id, or null when browser storage is full. */
  saveDesign: (thumbnail?: string) => string | null
  loadDesign: (id: string) => void
  deleteDesign: (id: string) => void
}

const LS_KEY = 'merch.savedDesigns.v1'

function loadSaved(): SavedDesign[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as SavedDesign[]) : []
  } catch {
    return []
  }
}

function persist(d: SavedDesign[]): boolean {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(d))
    return true
  } catch {
    return false
  }
}

export const useDesignStore = create<DesignState>((set, get) => ({
  activeProductId: null,
  colorHex: '#0a0a0a',
  decals: [],
  selectedDecalId: null,
  savedDesigns: loadSaved(),

  setActiveProduct: (id, defaultColor) =>
    set({ activeProductId: id, colorHex: defaultColor, decals: [], selectedDecalId: null }),

  setColor: hex => set({ colorHex: hex }),

  addDecal: d => {
    const id = `decal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    set(s => ({ decals: [...s.decals, { ...d, id }], selectedDecalId: id }))
    return id
  },

  updateDecal: (id, patch) =>
    set(s => ({
      decals: s.decals.map(d => (d.id === id ? { ...d, ...patch } : d)),
    })),

  removeDecal: id =>
    set(s => ({
      decals: s.decals.filter(d => d.id !== id),
      selectedDecalId: s.selectedDecalId === id ? null : s.selectedDecalId,
    })),

  selectDecal: id => set({ selectedDecalId: id }),

  reset: () => set({ decals: [], selectedDecalId: null }),

  saveDesign: thumbnail => {
    const s = get()
    if (!s.activeProductId) return null
    const design: SavedDesign = {
      id: `design_${Date.now()}`,
      productId: s.activeProductId,
      colorHex: s.colorHex,
      decals: s.decals,
      createdAt: Date.now(),
      thumbnail,
    }
    const next = [design, ...s.savedDesigns].slice(0, 12)
    if (!persist(next)) return null
    set({ savedDesigns: next })
    return design.id
  },

  loadDesign: id => {
    const s = get()
    const d = s.savedDesigns.find(x => x.id === id)
    if (!d) return
    set({
      activeProductId: d.productId,
      colorHex: d.colorHex,
      decals: d.decals,
      selectedDecalId: null,
    })
  },

  deleteDesign: id => {
    const s = get()
    const next = s.savedDesigns.filter(x => x.id !== id)
    persist(next)
    set({ savedDesigns: next })
  },
}))
