import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import PageHeader from '../components/common/PageHeader'
import Table from '../components/common/Table'
import { generationService } from '../services/api'

function statusIcon(status) {
  if (status === 'completed') return <CheckCircle2 size={42} />
  if (status === 'failed') return <XCircle size={42} />
  return <Clock3 size={42} />
}

export default function GenerationResult() {
  const { id } = useParams()
  const [generation, setGeneration] = useState(null)
  const [downloadStatus, setDownloadStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let mounted = true
    let timer

    async function loadGeneration() {
      try {
        const result = await generationService.get(id)
        if (!mounted) return
        const nextGeneration = result.data?.data || null
        setGeneration(nextGeneration)
        setError('')
        if (nextGeneration?.status === 'pending' || nextGeneration?.status === 'processing') {
          timer = window.setTimeout(loadGeneration, 1500)
        }
      } catch (loadError) {
        if (mounted) setError(loadError.response?.data?.message || 'Unable to load generation result.')
      }
    }

    loadGeneration()
    return () => {
      mounted = false
      if (timer) window.clearTimeout(timer)
    }
  }, [id])

  const files = generation?.generatedFiles || []
  const generatedFormat = generation?.outputFormat || files[0]?.format || 'pdf'

  async function handleDownloadAll() {
    if (!generation?._id) return
    setDownloadStatus('Preparing...')
    setError('')
    try {
      const response = await generationService.downloadArchive(generation._id, generatedFormat)
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `certificates-${generation._id}-${generatedFormat}.zip`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setDownloadStatus('Downloaded')
    } catch (downloadError) {
      setError(downloadError.response?.data?.message || 'Unable to download certificates.')
      setDownloadStatus('Download failed')
    } finally {
      setTimeout(() => setDownloadStatus(''), 2200)
    }
  }

  async function handleDownloadFile(file) {
    if (!generation?._id) return
    setError('')
    try {
      const response = await generationService.downloadSingle(generation._id, file.recordIndex || 0, generatedFormat)
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `certificate-${(file.recordIndex || 0) + 1}.${generatedFormat}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Unable to download this certificate.')
    }
  }

  async function handleOpenFile(file) {
    if (!generation?._id) return
    setError('')
    try {
      const response = await generationService.downloadSingle(generation._id, file.recordIndex || 0, generatedFormat)
      const url = window.URL.createObjectURL(response.data)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => window.URL.revokeObjectURL(url), 10000)
    } catch {
      setError('Unable to open this certificate.')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Generation result"
        title={generation ? `Batch ${generation.status}` : 'Batch Result'}
        description={generation ? `${generation.successfulRecords || 0} of ${generation.totalRecords || 0} certificates generated.` : 'Generated files will appear here.'}
        actions={(
          <>
            <Button onClick={handleDownloadAll} disabled={!files.length}>{downloadStatus || 'Download all'}</Button>
            <Button as={Link} to="/generate" variant="secondary">Generate again</Button>
          </>
        )}
      />
      {error && <p className="form-message">{error}</p>}
      <Card className="result-card">
        {statusIcon(generation?.status)}
        <h2>{generation?.status === 'completed' ? 'Certificates ready' : generation?.status || 'Loading result'}</h2>
        {generation?.errorMessage ? <p className="form-message">{generation.errorMessage}</p> : null}
        <div className="page-actions">
          {files[0]?.filePath ? (
            <Button onClick={() => handleDownloadFile(files[0])}>Download first certificate</Button>
          ) : null}
          <Button as={Link} to="/history" variant="secondary">View history</Button>
        </div>
      </Card>

      {files.length ? (
        <Card>
          <div className="section-heading">
            <h2>Generated files</h2>
            <Badge tone="success">{files.length} files</Badge>
          </div>
          <Table
            columns={[
              { key: 'fileName', label: 'Certificate', render: (row) => `Certificate ${(row.recordIndex || 0) + 1}` },
              { key: 'format', label: 'Generated output', render: () => generatedFormat.toUpperCase() },
              { key: 'recordIndex', label: 'Row', render: (row) => `Row ${(row.recordIndex || 0) + 1}` },
              {
                key: 'action',
                label: '',
                render: (row) => (
                  <div className="table-actions">
                    <button type="button" className="table-action" onClick={() => handleOpenFile(row)}>
                      Open
                    </button>
                    <button type="button" className="table-action" onClick={() => handleDownloadFile(row)}>
                      Download
                    </button>
                  </div>
                ),
              },
            ]}
            rows={files}
          />
        </Card>
      ) : null}
    </>
  )
}
