import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Card from '../components/common/Card'
import PageHeader from '../components/common/PageHeader'
import Table from '../components/common/Table'
import { dataFileService } from '../services/api'

export default function DataPreview() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [files, setFiles] = useState([])
  const [selectedFileId, setSelectedFileId] = useState('')
  const [preview, setPreview] = useState({
    columns: [],
    rows: [],
    recordCount: 0,
  })
  const [selectedRowIndex, setSelectedRowIndex] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    dataFileService.list().then((result) => {
      const rows = result.data?.data || []
      setFiles(rows)
      const requestedFile = searchParams.get('file')
      if (requestedFile && rows.some((file) => file._id === requestedFile)) {
        setSelectedFileId(requestedFile)
      } else if (rows[0]) {
        setSelectedFileId(rows[0]._id)
      }
    }).catch((apiError) => {
      if (apiError.response?.status === 401) {
        setError('Sign in to preview uploaded data files.')
        return
      }
      setError('Unable to load uploaded data files.')
    })
  }, [searchParams])

  useEffect(() => {
    if (!selectedFileId) {
      setPreview({ columns: [], rows: [], recordCount: 0 })
      return
    }
    dataFileService.preview(selectedFileId, { limit: 50 }).then((result) => {
      setPreview({
        columns: result.data?.data?.columns || [],
        rows: result.data?.data?.rows || [],
        recordCount: result.data?.data?.recordCount || 0,
      })
      setSelectedRowIndex(0)
      setError('')
    }).catch(() => setError('Unable to load selected data file.'))
  }, [selectedFileId])

  const columns = useMemo(() => preview.columns.map((key) => ({ key, label: key })), [preview.columns])
  const selectedRow = preview.rows[selectedRowIndex]

  return (
    <>
      <PageHeader
        eyebrow="Data preview"
        title={files.find((file) => file._id === selectedFileId)?.originalName || 'Data Preview'}
        description={`${preview.columns.length} columns, ${preview.recordCount} records detected.`}
      />
      {error && <p className="form-message">{error}</p>}
      <Card>
        <div className="data-preview-controls">
          <label>
            Data file
            <select
              value={selectedFileId}
              onChange={(event) => {
                setSelectedFileId(event.target.value)
                setSearchParams(event.target.value ? { file: event.target.value } : {})
              }}
            >
              <option value="">Select data file</option>
              {files.map((file) => (
                <option key={file._id} value={file._id}>
                  {file.originalName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Selected row
            <select value={selectedRowIndex} onChange={(event) => setSelectedRowIndex(Number(event.target.value))}>
              {preview.rows.map((row, index) => (
                <option key={row._id || index} value={index}>
                  Row {index + 1}
                </option>
              ))}
            </select>
          </label>
        </div>
        {selectedRow ? (
          <div className="selected-record">
            {preview.columns.map((column) => (
              <span key={column}><strong>{column}</strong>{String(selectedRow[column] ?? '')}</span>
            ))}
          </div>
        ) : <p className="panel-muted">No data selected.</p>}
        {preview.rows.length ? <Table columns={columns} rows={preview.rows} /> : null}
      </Card>
    </>
  )
}
