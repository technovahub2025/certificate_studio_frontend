import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import PageHeader from '../components/common/PageHeader'
import Table from '../components/common/Table'
import DataUploadPanel from '../components/data/DataUploadPanel'
import { dataFileService } from '../services/api'

const SELECTED_TEMPLATE_KEY = 'certificate_studio_selected_template_id'
const SELECTED_DATA_FILE_KEY = 'certificate_studio_selected_data_file_id'
const HIDDEN_DATA_FILES_KEY = 'certificate_studio_hidden_data_file_ids'

function getHiddenDataFileIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(HIDDEN_DATA_FILES_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function saveHiddenDataFileIds(ids) {
  localStorage.setItem(HIDDEN_DATA_FILES_KEY, JSON.stringify([...ids]))
}

export default function DataFiles() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [files, setFiles] = useState([])
  const [selectedTemplateId] = useState(() => localStorage.getItem(SELECTED_TEMPLATE_KEY) || '')
  const [error, setError] = useState('')
  const [uploadStatus, setUploadStatus] = useState('')

  function normalizeFiles(rows) {
    return rows.map((file) => ({
      id: file._id,
      name: file.originalName,
      rows: file.recordCount,
      fields: file.columns?.length || 0,
      status: file.parserWarnings?.length ? 'Needs review' : 'Ready',
    }))
  }

  function loadFiles() {
    return dataFileService.list().then((result) => {
      const rows = result.data?.data || []
      const hiddenIds = getHiddenDataFileIds()
      setFiles(normalizeFiles(rows).filter((file) => !hiddenIds.has(file.id)))
      setError('')
      return rows
    }).catch((apiError) => {
      if (apiError.response?.status === 401) {
        setError('Sign in to upload and view recipient data files.')
        return []
      }
      setError('Unable to load uploaded data files.')
      return []
    })
  }

  useEffect(() => {
    loadFiles()
  }, [])

  async function handleDataUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    const token = localStorage.getItem('certificate_studio_token')
    if (!token) {
      setError('Sign in before uploading data files.')
      return
    }

    const formData = new FormData()
    formData.append('dataFile', file)

    setUploadStatus('Uploading...')
    setError('')

    try {
      const result = await dataFileService.upload(formData)
      const uploadedFile = result.data?.data
      setUploadStatus('Uploaded')
      if (uploadedFile?._id) {
        localStorage.setItem(SELECTED_DATA_FILE_KEY, uploadedFile._id)
        setFiles((current) => [
          ...normalizeFiles([uploadedFile]),
          ...current.filter((item) => item.id !== uploadedFile._id && !Number.isInteger(item.id)),
        ])
        if (selectedTemplateId) navigate(`/templates/${selectedTemplateId}/editor`)
      } else {
        await loadFiles()
      }
    } catch (uploadError) {
      if (uploadError.response?.status === 401) {
        setError('Your session expired. Sign in again before uploading data files.')
      } else {
        setError(uploadError.response?.data?.message || 'Unable to upload data file.')
      }
      setUploadStatus('Upload failed')
    } finally {
      setTimeout(() => setUploadStatus(''), 2200)
    }
  }

  function handleUseDataFile(fileId) {
    if (!fileId || Number.isInteger(fileId)) return
    localStorage.setItem(SELECTED_DATA_FILE_KEY, fileId)
    if (selectedTemplateId) {
      navigate(`/templates/${selectedTemplateId}/editor`)
    } else {
      navigate('/templates')
    }
  }

  function handleRemoveFromList(fileId) {
    const hiddenIds = getHiddenDataFileIds()
    hiddenIds.add(fileId)
    saveHiddenDataFileIds(hiddenIds)
    setFiles((current) => current.filter((file) => file.id !== fileId))
    if (localStorage.getItem(SELECTED_DATA_FILE_KEY) === fileId) {
      localStorage.removeItem(SELECTED_DATA_FILE_KEY)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Recipient data"
        title="Data Files"
        description="Upload CSV or Excel files and prepare custom dynamic fields for templates."
        actions={selectedTemplateId ? (
          <Button as={Link} to={`/templates/${selectedTemplateId}/editor`} variant="secondary">Continue editor</Button>
        ) : null}
      />
      {error && <p className="form-message">{error}</p>}
      <section className="content-grid two-col data-layout">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.txt,.pdf"
          className="visually-hidden"
          onChange={handleDataUpload}
        />
        <DataUploadPanel status={uploadStatus} onChooseFile={() => fileInputRef.current?.click()} />
        <Card>
          <div className="section-heading">
            <h2>Uploaded files</h2>
            <Link to={files[0]?.id ? `/data/preview?file=${files[0].id}` : '/data/preview'}>
              Preview latest
            </Link>
          </div>
          {files.length ? (
            <Table
              columns={[
                { key: 'name', label: 'File' },
                { key: 'rows', label: 'Rows' },
                { key: 'fields', label: 'Fields' },
                {
                  key: 'status',
                  label: 'Status',
                  render: (row) => <Badge tone={row.status === 'Ready' ? 'success' : 'warning'}>{row.status}</Badge>,
                },
                {
                key: 'action',
                label: '',
                render: (row) => (
                  <div className="table-actions">
                    <button type="button" className="table-action" onClick={() => handleUseDataFile(row.id)}>
                      Use data
                    </button>
                    <button type="button" className="table-action danger" onClick={() => handleRemoveFromList(row.id)}>
                      Delete
                    </button>
                  </div>
                ),
              },
              ]}
              rows={files}
            />
          ) : <p className="panel-muted">No data files uploaded yet.</p>}
        </Card>
      </section>
    </>
  )
}
