import React from 'react'
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar'
import AppSidebar from '../components/AppSidebar'
import DesktopTopBar from '../components/DesktopTopBar'

export default function DesktopSidebarLayout({ children }) {
  return (
    <SidebarProvider defaultOpen={true} style={{ height: '100svh', overflow: 'hidden' }}>
      <AppSidebar />
      <SidebarInset style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', flex: 1 }}>
        <DesktopTopBar />
        <main style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          background: 'hsl(var(--background))',
          willChange: 'scroll-position'
        }}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
