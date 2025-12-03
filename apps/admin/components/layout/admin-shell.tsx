'use client'

import type { ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { SidebarProvider, useSidebar } from './sidebar-context'
import { cn } from '@white-label/ui'

interface AdminShellContentProps {
  children: ReactNode
}

function AdminShellContent({ children }: AdminShellContentProps) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="flex min-h-screen w-full bg-gray-50 text-gray-900">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-10 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

interface AdminShellProps {
  children: ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <SidebarProvider>
      <AdminShellContent>{children}</AdminShellContent>
    </SidebarProvider>
  )
}

