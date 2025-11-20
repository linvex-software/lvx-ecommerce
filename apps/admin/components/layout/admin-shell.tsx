'use client'

import type { ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'

interface AdminShellProps {
  children: ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="flex min-h-screen w-full bg-gray-50 text-gray-900">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

