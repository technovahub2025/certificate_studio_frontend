import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authService } from '../services/api'

const logoUrl =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC0Yy5Cuod8tZX-y4bWRY1LkwjpzFz-Ry_5iaCGntfzV7s33Qs2sNAMnH4Ftvnea_ndWNbidSN76OCmi8pY1WHPEQMK0KTBz58Lud5Z-fj1aEXkh1Bpp_qI7Bqc0vW4ARZletLu6CppeBIDIN4Ld9sEq4A9hiA16Bi07t0xBmVLZRlf4K7Aj6YpO49hpwVzSXAMY0HNO8855kzPMPwwYIA8FhdX9A3eklQjvMma072tjmpknfobxTb5'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  function updateField(event) {
    const { name, value, checked, type } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}

    if (mode === 'register' && form.name.trim().length < 2) nextErrors.name = 'Enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.'
    if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.'

    setErrors(nextErrors)
    setMessage('')

    if (Object.keys(nextErrors).length) return

    try {
      const response = mode === 'register'
        ? await authService.register({ name: form.name, email: form.email, password: form.password })
        : await authService.login({ email: form.email, password: form.password })
      const token = response.data?.data?.token

      if (token) {
        localStorage.setItem('certificate_studio_token', token)
        window.dispatchEvent(new Event('certificate-studio-auth'))
        setMessage(mode === 'register' ? 'Account created successfully.' : 'Signed in successfully.')
        navigate(location.state?.from || '/templates', { replace: true })
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to sign in.')
    }
  }

  return (
    <main className="cert-login-page">
      <div className="cert-login-card">
        <div className="cert-login-heading">
          <img alt="CertiFlow Logo" className="cert-login-logo" src={logoUrl} />
          <h1>CertiFlow</h1>
          <p>{mode === 'register' ? 'Create your workspace account' : 'Certificate Automation Platform'}</p>
        </div>

        <form className="cert-login-form" onSubmit={handleSubmit} noValidate>
          {mode === 'register' ? (
            <div className="cert-field-group">
              <label htmlFor="name">Full Name</label>
              <div className="cert-input-wrap">
                <span className="material-symbols-outlined">person</span>
                <input
                  autoComplete="name"
                  id="name"
                  name="name"
                  placeholder="Your name"
                  required
                  type="text"
                  value={form.name}
                  onChange={updateField}
                />
              </div>
              {errors.name ? <small className="cert-field-error">{errors.name}</small> : null}
            </div>
          ) : null}

          <div className="cert-field-group">
            <label htmlFor="email">Email Address</label>
            <div className="cert-input-wrap">
              <span className="material-symbols-outlined">mail</span>
              <input
                autoComplete="email"
                id="email"
                name="email"
                placeholder="you@company.com"
                required
                type="email"
                value={form.email}
                onChange={updateField}
              />
            </div>
            {errors.email ? <small className="cert-field-error">{errors.email}</small> : null}
          </div>

          <div className="cert-field-group">
            <label htmlFor="password">Password</label>
            <div className="cert-input-wrap">
              <span className="material-symbols-outlined">lock</span>
              <input
                autoComplete="current-password"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                type="password"
                value={form.password}
                onChange={updateField}
              />
            </div>
            {errors.password ? <small className="cert-field-error">{errors.password}</small> : null}
          </div>

          <div className="cert-login-options">
            <div className="cert-check-row">
              <input
                id="remember-me"
                name="remember"
                type="checkbox"
                checked={form.remember}
                onChange={updateField}
              />
              <label htmlFor="remember-me">Remember me</label>
            </div>

            <a href="/login">Forgot password?</a>
          </div>

          <button className="cert-sign-in" type="submit">
            {mode === 'register' ? 'Create account' : 'Sign in'}
          </button>
          {message ? <p className="cert-form-message">{message}</p> : null}
        </form>

        <div className="cert-login-footer">
          {mode === 'register' ? (
            <p>
              Already have an account?{' '}
              <button className="link-button" type="button" onClick={() => setMode('login')}>Sign in</button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button className="link-button" type="button" onClick={() => setMode('register')}>Create account</button>
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
