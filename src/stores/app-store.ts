import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  currentMonth: number
  currentYear: number
  setMonth: (month: number, year: number) => void
}

const now = new Date()

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  currentMonth: now.getMonth() + 1,
  currentYear: now.getFullYear(),
  setMonth: (month, year) => set({ currentMonth: month, currentYear: year }),
}))
