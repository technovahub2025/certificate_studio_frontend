import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
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

export default function Sidebar({ isOpen = false, onClose }) {
  return (
    <>
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <NavLink className="brand" to="/dashboard" onClick={onClose}>
            <img className="brand-mark" alt="Certificate Studio logo" src="assets/certificate-studio-logo.png" />
            <span>
              <strong>Certificate Studio</strong>
              <small>Generation workspace</small>
            </span>
          </NavLink>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="side-nav" aria-label="Primary navigation">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')} onClick={onClose}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className={`sidebar-backdrop ${isOpen ? 'backdrop-visible' : ''}`} onClick={onClose} aria-hidden="true" />
    </>
  )
}
