import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-shell">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="page-shell">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
