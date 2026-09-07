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

function formatExtension(format) {
  if (format === 'jpg' || format === 'jpeg') return 'jpg'
  if (format === 'png') return 'png'
  return 'pdf'
}

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = fileName

  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(() => {
    window.URL.revokeObjectURL(url)
  }, 1000)
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

        if (
          nextGeneration?.status === 'pending' ||
          nextGeneration?.status === 'processing'
        ) {
          timer = window.setTimeout(loadGeneration, 1500)
        }
      } catch (loadError) {
        if (mounted) {
          setError(
            loadError.response?.data?.message ||
              'Unable to load generation result.'
          )
        }
      }
    }

    loadGeneration()

    return () => {
      mounted = false

      if (timer) {
        window.clearTimeout(timer)
      }
    }
  }, [id])

  const files = generation?.generatedFiles || []

  /*
   * IMPORTANT:
   * The format is now taken from the actual generated file.
   * There is NO second format selection on this page.
   */
  const generatedFormat =
    generation?.outputFormat ||
    generation?.generatedFormat ||
    files[0]?.format ||
    'pdf'

  const isSingle = Boolean(
    generation &&
      (generation.mode === 'single' || !generation.dataFileId)
  )

  const templateId = generation?.templateId?._id

  async function handleDownloadAll() {
    if (!generation?._id || !files.length) return

    setDownloadStatus('Preparing...')
    setError('')

    try {
      if (isSingle) {
        /*
         * Single certificate:
         * Download the format that was actually generated.
         */
        const response = await generationService.downloadSingle(
          generation._id,
          0,
          generatedFormat
        )

        downloadBlob(
          response.data,
          `certificate-${generation._id}.${formatExtension(generatedFormat)}`
        )
      } else {
        /*
         * Bulk generation:
         * Download the generated archive.
         */
        const response = await generationService.downloadArchive(
          generation._id,
          generatedFormat
        )

        downloadBlob(
          response.data,
          `certificates-${generation._id}-${generatedFormat}.zip`
        )
      }

      setDownloadStatus('Downloaded')
    } catch (downloadError) {
      setError(
        downloadError.response?.data?.message ||
          'Unable to download certificates.'
      )

      setDownloadStatus('Download failed')
    } finally {
      setTimeout(() => setDownloadStatus(''), 2200)
    }
  }

  async function handleDownloadFile(file) {
    if (!generation?._id) return

    setError('')

    try {
      const recordIndex = file.recordIndex || 0

      /*
       * Always use the actual generated format.
       */
      const response = await generationService.downloadSingle(
        generation._id,
        recordIndex,
        generatedFormat
      )

      downloadBlob(
        response.data,
        `certificate-${recordIndex + 1}.${formatExtension(
          generatedFormat
        )}`
      )
    } catch (downloadError) {
      setError(
        downloadError.response?.data?.message ||
          'Unable to download this certificate.'
      )
    }
  }

  async function handleOpenFile(file) {
    if (!generation?._id) return

    setError('')

    try {
      const recordIndex = file.recordIndex || 0

      /*
       * Open the actual generated format.
       */
      const response = await generationService.downloadSingle(
        generation._id,
        recordIndex,
        generatedFormat
      )

      const url = window.URL.createObjectURL(response.data)

      window.open(url, '_blank', 'noopener,noreferrer')

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 10000)
    } catch (openError) {
      setError(
        openError.response?.data?.message ||
          'Unable to open this certificate.'
      )
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={isSingle ? 'Single certificate' : 'Generation result'}
        title={
          generation
            ? isSingle
              ? 'Certificate ready'
              : `Batch ${generation.status}`
            : 'Generation result'
        }
        description={
          generation
            ? `${generation.successfulRecords || 0} of ${
                generation.totalRecords || 0
              } certificates generated.`
            : 'Generated files will appear here.'
        }
        actions={
          <>
            {/* 
              FORMAT DROPDOWN REMOVED.
              
              Format is selected in the Editor before generation.
              This page only downloads the already-generated format.
            */}

            <Button
              onClick={handleDownloadAll}
              disabled={!files.length}
            >
              {downloadStatus ||
                (isSingle
                  ? 'Download certificate'
                  : 'Download all')}
            </Button>

            <Button
              as={Link}
              to={
                isSingle
                  ? `/templates/${templateId}/editor`
                  : '/generate'
              }
              variant="secondary"
            >
              Generate again
            </Button>
          </>
        }
      />

      {error && <p className="form-message">{error}</p>}

      <Card className="result-card">
        {statusIcon(generation?.status)}

        <h2>
          {generation?.status === 'completed'
            ? isSingle
              ? 'Certificate ready'
              : 'Certificates ready'
            : generation?.status || 'Loading result'}
        </h2>

        {generation?.errorMessage ? (
          <p className="form-message">
            {generation.errorMessage}
          </p>
        ) : null}

        <div className="page-actions">
          {files[0]?.filePath ? (
            <Button onClick={() => handleDownloadFile(files[0])}>
              Download first certificate
            </Button>
          ) : null}

          <Button
            as={Link}
            to="/history"
            variant="secondary"
          >
            View history
          </Button>
        </div>
      </Card>

      {files.length ? (
        <Card>
          <div className="section-heading">
            <h2>Generated files</h2>

            <Badge tone="success">
              {files.length} files
            </Badge>
          </div>

          <Table
            columns={[
              {
                key: 'fileName',
                label: 'Certificate',
                render: (row) =>
                  `Certificate ${(row.recordIndex || 0) + 1}`,
              },
              {
                key: 'format',
                label: 'Generated output',
                render: () =>
                  generatedFormat.toUpperCase(),
              },
              {
                key: 'recordIndex',
                label: 'Row',
                render: (row) =>
                  `Row ${(row.recordIndex || 0) + 1}`,
              },
              {
                key: 'action',
                label: '',
                render: (row) => (
                  <div className="table-actions">
                    <button
                      type="button"
                      className="table-action"
                      onClick={() => handleOpenFile(row)}
                    >
                      Open
                    </button>

                    <button
                      type="button"
                      className="table-action"
                      onClick={() => handleDownloadFile(row)}
                    >
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