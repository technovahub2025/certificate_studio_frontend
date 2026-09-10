import { Menu } from 'lucide-react'

export default function Topbar({ onMenuClick }) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="hamburger"
        aria-label="Open navigation"
        onClick={onMenuClick}
      >
        <Menu size={20} />
      </button>
    </header>
  )
}