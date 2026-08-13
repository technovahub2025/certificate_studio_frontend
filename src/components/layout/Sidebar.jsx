import { NavLink } from 'react-router-dom'
import {
  FileBadge,
  Gauge,
  History,
  Layers,
  PlaySquare,
  Settings,
  Table2,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/templates', label: 'Templates', icon: FileBadge },
  { to: '/templates/editor', label: 'Editor', icon: Layers },
  { to: '/data', label: 'Data Files', icon: Table2 },
  { to: '/generate', label: 'Generate', icon: PlaySquare },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <NavLink className="brand" to="/dashboard">
        <span className="brand-mark">CS</span>
        <span>
          <strong>Certificate Studio</strong>
          <small>Generation workspace</small>
        </span>
      </NavLink>

      <nav className="side-nav" aria-label="Primary navigation">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
