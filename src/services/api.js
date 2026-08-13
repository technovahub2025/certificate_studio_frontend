import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('certificate_studio_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export const authService = {
  register(payload) {
    return api.post('/auth/register', payload)
  },
  login(credentials) {
    return api.post('/auth/login', credentials)
  },
  me() {
    return api.get('/auth/me')
  },
  logout() {
    return api.post('/auth/logout')
  },
}

export const templateService = {
  list() {
    return api.get('/templates')
  },
  create(payload) {
    return api.post('/templates', payload)
  },
  upload(formData) {
    return api.post('/templates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  get(id) {
    return api.get(`/templates/${id}`)
  },
  update(id, payload) {
    return api.put(`/templates/${id}`, payload)
  },
  remove(id) {
    return api.delete(`/templates/${id}`)
  },
  duplicate(id) {
    return api.post(`/templates/${id}/duplicate`)
  },
  saveMapping(id, mapping) {
    return api.post(`/templates/${id}/mapping`, { mapping })
  },
}

export const dataFileService = {
  list() {
    return api.get('/data')
  },
  upload(formData) {
    return api.post('/data/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  get(id) {
    return api.get(`/data/${id}`)
  },
  preview(id, params) {
    return api.get(`/data/${id}/preview`, { params })
  },
  remove(id) {
    return api.delete(`/data/${id}`)
  },
}

export const generationService = {
  create(payload) {
    return api.post('/generations', payload)
  },
  list() {
    return api.get('/generations')
  },
  get(id) {
    return api.get(`/generations/${id}`)
  },
  download(id) {
    return api.post(`/generations/${id}/download`)
  },
  downloadArchive(id, format = 'pdf') {
    return api.get(`/generations/${id}/download`, {
      params: { format },
      responseType: 'blob',
    })
  },
  downloadSingle(id, recordIndex, format = 'pdf') {
    return api.get(`/generations/${id}/download/${recordIndex}`, {
      params: { format },
      responseType: 'blob',
    })
  },
}

export const historyService = {
  list(params) {
    return api.get('/history', { params })
  },
  clear() {
    return api.post('/history/clear')
  },
  archive(id) {
    return api.delete(`/history/${id}`)
  },
}

export default api
