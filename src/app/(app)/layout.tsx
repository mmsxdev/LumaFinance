'use client'

import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sidebarOpen } = useAppStore()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div
        className="flex flex-1 flex-col min-w-0 transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarOpen ? '260px' : '68px' }}
      >
        <Header />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
