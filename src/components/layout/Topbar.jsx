import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, LogOut, Search, UserRound } from 'lucide-react'

export default function Topbar() {
  const navigate = useNavigate()
  const [hasToken, setHasToken] = useState(() => Boolean(localStorage.getItem('certificate_studio_token')))

  useEffect(() => {
    function updateAuthState() {
      setHasToken(Boolean(localStorage.getItem('certificate_studio_token')))
    }

    window.addEventListener('storage', updateAuthState)
    window.addEventListener('certificate-studio-auth', updateAuthState)
    return () => {
      window.removeEventListener('storage', updateAuthState)
      window.removeEventListener('certificate-studio-auth', updateAuthState)
    }
  }, [])

  function handleLogout() {
    localStorage.removeItem('certificate_studio_token')
    window.dispatchEvent(new Event('certificate-studio-auth'))
    navigate('/login')
  }

  return (
    <header className="topbar">
      <label className="search-box">
        <Search size={17} />
        <input type="search" placeholder="Search templates, data files, batches" />
      </label>

      <div className="topbar-actions">
        <button className="icon-button" type="button" aria-label="Notifications">
          <Bell size={18} />
        </button>
        {hasToken ? (
          <>
            <button className="profile-chip" type="button">
              <UserRound size={17} />
              <span>Signed in</span>
            </button>
            <button className="icon-button" type="button" aria-label="Sign out" onClick={handleLogout}>
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <Link className="profile-chip" to="/login">
            <UserRound size={17} />
            <span>Sign in</span>
          </Link>
        )}
      </div>
    </header>
  )
}
