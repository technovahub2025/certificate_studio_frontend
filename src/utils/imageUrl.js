const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function getApiOrigin() {
  return API_BASE.replace(/\/api\/?$/, '')
}

export function getImageUrl(value) {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return ''
  }

  const trimmed = value.trim()

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    return trimmed
  }

  const origin = getApiOrigin()

  if (trimmed.startsWith('/')) {
    return `${origin}${trimmed}`
  }

  return `${origin}/${trimmed}`
}
