import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import Button from '../components/common/Button'
import PageHeader from '../components/common/PageHeader'
import TemplateCard from '../components/templates/TemplateCard'
import { templateService } from '../services/api'

const SELECTED_TEMPLATE_KEY = 'certificate_studio_selected_template_id'

export default function Templates() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => localStorage.getItem(SELECTED_TEMPLATE_KEY) || '')
  const [openMenuId, setOpenMenuId] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [uploadStatus, setUploadStatus] = useState('')

  function loadTemplates() {
    return templateService.list().then((result) => {
      const rows = result.data?.data || []
      setTemplates(rows)
      setError('')
      return rows
    }).catch((apiError) => {
      if (apiError.response?.status === 401) {
        setError('Sign in to load saved templates.')
        return []
      }
      setError('Unable to load templates.')
      return []
    })
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  async function handleTemplateUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    const token = localStorage.getItem('certificate_studio_token')
    if (!token) {
      setError('Sign in before uploading templates.')
      return
    }

    const formData = new FormData()
    formData.append('template', file)
    formData.append('name', file.name.replace(/\.[^.]+$/, '') || 'Untitled template')

    setUploadStatus('Uploading...')
    setError('')

    try {
      const result = await templateService.upload(formData)
      const uploadedTemplate = result.data?.data
      setUploadStatus('Uploaded')
      if (uploadedTemplate?._id) {
        localStorage.setItem(SELECTED_TEMPLATE_KEY, uploadedTemplate._id)
        setSelectedTemplateId(uploadedTemplate._id)
        setTemplates((current) => [
          uploadedTemplate,
          ...current.filter((template) => template._id),
        ])
        navigate(`/templates/${uploadedTemplate._id}/editor`)
      } else {
        await loadTemplates()
      }
    } catch (uploadError) {
      if (uploadError.response?.status === 401) {
        setError('Your session expired. Sign in again before uploading templates.')
      } else {
        setError(uploadError.response?.data?.message || 'Unable to upload template.')
      }
      setUploadStatus('Upload failed')
    } finally {
      setTimeout(() => setUploadStatus(''), 2200)
    }
  }

  function rememberTemplate(templateId) {
    if (!templateId) return
    localStorage.setItem(SELECTED_TEMPLATE_KEY, templateId)
    setSelectedTemplateId(templateId)
  }

  async function handleDeleteTemplate(template) {
    const templateId = template?._id
    if (!templateId) return
    const confirmed = window.confirm(`Delete "${template.name}"? This cannot be undone.`)
    if (!confirmed) return

    setDeletingId(templateId)
    setError('')
    try {
      await templateService.remove(templateId)
      setTemplates((current) => current.filter((item) => item._id !== templateId))
      setOpenMenuId('')
      if (selectedTemplateId === templateId) {
        localStorage.removeItem(SELECTED_TEMPLATE_KEY)
        setSelectedTemplateId('')
      }
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Unable to delete template.')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Template library"
        title="Templates"
        description="Create and manage reusable certificate designs."
        actions={(
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg,.pdf"
              className="visually-hidden"
              onChange={handleTemplateUpload}
            />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              {uploadStatus || 'Upload template'}
            </Button>
            <Button as={Link} to={selectedTemplateId ? `/templates/${selectedTemplateId}/editor` : '/templates/editor'}>Open editor</Button>
          </>
        )}
      />
      {error && <p className="form-message">{error}</p>}
      <section className="template-grid">
        {templates.length ? templates.map((template) => (
          template._id ? (
            <Link
              key={template._id}
              className="template-card-link"
              to={`/templates/${template._id}/editor`}
              onClick={() => rememberTemplate(template._id)}
            >
              <TemplateCard template={{
                ...template,
                id: template._id,
                name: template.name,
                updated: new Date(template.updatedAt || template.createdAt).toLocaleDateString(),
                status: template.design?.elements?.length ? 'Published' : 'Draft',
              }}
              menuOpen={openMenuId === template._id}
              deleting={deletingId === template._id}
              onToggleMenu={() => setOpenMenuId((current) => (current === template._id ? '' : template._id))}
              onDelete={() => handleDeleteTemplate(template)}
              />
            </Link>
          ) : (
            <Link key={template.id} className="template-card-link" to="/templates/editor">
              <TemplateCard template={template} />
            </Link>
          )
        )) : <p className="panel-muted">No templates uploaded yet.</p>}
      </section>
    </>
  )
}
