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
    <div className="flex min-h-screen w-full bg-background text-text-primary transition-colors duration-200">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden bg-background lg:ml-0">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-4 py-4 sm:px-6 sm:py-6">{children}</div>
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
