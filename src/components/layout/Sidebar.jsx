import { NavLink, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import {
  FileBadge,
  Gauge,
  History,
  Layers,
  LogOut,
  PlaySquare,
  Settings,
  Table2,
  User,
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
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('certificate_studio_token')
    window.dispatchEvent(new Event('certificate-studio-auth'))
    onClose?.()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <NavLink
            className="brand"
            to="/dashboard"
            onClick={onClose}
          >
            <img
              className="brand-mark"
              alt="Certificate Studio logo"
              src={`${import.meta.env.BASE_URL}assets/certificate-studio-logo.png`}
            />

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
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? 'active' : ''
              }
              onClick={onClose}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Account section */}
        <div className="sidebar-account">
          <div className="sidebar-account-user">
            <User size={18} />
            <span>Signed in</span>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <div
        className={`sidebar-backdrop ${
          isOpen ? 'backdrop-visible' : ''
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
    </>
  )
}