import { useEffect, useState } from 'react'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import PageHeader from '../components/common/PageHeader'
import Table from '../components/common/Table'
import { historyService } from '../services/api'

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

function statusTone(status) {
  if (status === 'completed') return 'success'
  return 'warning'
}

export default function History() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [clearStatus, setClearStatus] = useState('')

  async function loadHistory() {
    try {
      const result = await historyService.list()
      setRows(result.data?.data?.records || [])
      setError('')
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Unable to load generation history.')
    }
  }

  useEffect(() => {
    let mounted = true

    historyService.list().then((result) => {
      if (!mounted) return
      setRows(result.data?.data?.records || [])
      setError('')
    }).catch((loadError) => {
      if (mounted) setError(loadError.response?.data?.message || 'Unable to load generation history.')
    })

    return () => {
      mounted = false
    }
  }, [])

  async function handleClearHistory() {
    const confirmed = window.confirm('Clear history? This will remove your generated certificates from the History view. Your records will remain securely stored.')
    if (!confirmed) return

    setClearStatus('Clearing...')
    setError('')
    setMessage('')
    try {
      await historyService.clear()
      await loadHistory()
      setMessage('History cleared successfully.')
      setClearStatus('')
    } catch (clearError) {
      setError(clearError.response?.data?.message || 'Unable to clear history.')
      setClearStatus('')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Audit trail"
        title="History"
        description="Track generated batches, formats, and completion status."
        actions={<Button variant="secondary" onClick={handleClearHistory} disabled={!rows.length || Boolean(clearStatus)}>{clearStatus || 'Clear History'}</Button>}
      />
      {error && <p className="form-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}
      <Card>
        {rows.length ? (
          <Table
            columns={[
              { key: '_id', label: 'Batch', render: (row) => row._id?.slice(-8) || '-' },
              { key: 'templateId', label: 'Template', render: (row) => row.templateName || row.templateId?.name || '-' },
              { key: 'successfulRecords', label: 'Certificates', render: (row) => `${row.successfulRecords || 0}/${row.totalRecords || 0}` },
              { key: 'outputFormat', label: 'Format', render: (row) => (row.generatedFormat || row.outputFormat || 'pdf').toUpperCase() },
              { key: 'createdAt', label: 'Date', render: (row) => formatDate(row.createdAt) },
              { key: 'status', label: 'Status', render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> },
            ]}
            rows={rows}
          />
        ) : <p className="panel-muted">Your certificate generation history will appear here.</p>}
      </Card>
    </>
  )
}
