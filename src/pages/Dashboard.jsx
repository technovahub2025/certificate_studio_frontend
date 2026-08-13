import { Award, FileText, Layers, Table2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import PageHeader from '../components/common/PageHeader'
import Table from '../components/common/Table'
import MetricCard from '../components/dashboard/MetricCard'
import TemplateCard from '../components/templates/TemplateCard'
import { dataFileService, generationService, templateService } from '../services/api'

export default function Dashboard() {
  const [templates, setTemplates] = useState([])
  const [dataFiles, setDataFiles] = useState([])
  const [generations, setGenerations] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    Promise.all([
      templateService.list(),
      dataFileService.list(),
      generationService.list(),
    ]).then(([templateResult, dataResult, generationResult]) => {
      if (!mounted) return
      setTemplates(templateResult.data?.data || [])
      setDataFiles(dataResult.data?.data || [])
      setGenerations(generationResult.data?.data || [])
      setError('')
    }).catch((loadError) => {
      if (!mounted) return
      setError(loadError.response?.data?.message || 'Unable to load dashboard data.')
    })

    return () => {
      mounted = false
    }
  }, [])

  const generatedCount = useMemo(
    () => generations.reduce((total, generation) => total + (generation.successfulRecords || 0), 0),
    [generations],
  )
  const draftCount = templates.filter((template) => !(template.design?.elements?.length || template.design?.fabricJson?.objects?.length)).length

  return (
    <>
      <PageHeader
        eyebrow="Workspace overview"
        title="Dashboard"
        description="Monitor templates, data files, and recent certificate batches."
        actions={<Button as={Link} to="/templates">Create template</Button>}
      />
      {error && <p className="form-message">{error}</p>}

      <section className="metrics-grid">
        <MetricCard icon={Layers} label="Templates" value={templates.length} note={`${templates.length - draftCount} published`} />
        <MetricCard icon={Table2} label="Data files" value={dataFiles.length} note={`${dataFiles.reduce((total, file) => total + (file.recordCount || 0), 0)} rows`} />
        <MetricCard icon={Award} label="Generated" value={generatedCount} note="All time" />
        <MetricCard icon={FileText} label="Draft templates" value={draftCount} note="Need design fields" />
      </section>

      <section className="content-grid two-col">
        <Card>
          <div className="section-heading">
            <h2>Recent Templates</h2>
            <Link to="/templates">View all</Link>
          </div>
          <div className="template-list compact-list">
            {templates.slice(0, 2).map((template) => (
              <Link key={template._id} className="template-card-link" to={`/templates/${template._id}/editor`}>
                <TemplateCard template={{
                  ...template,
                  id: template._id,
                  updated: new Date(template.updatedAt || template.createdAt).toLocaleDateString(),
                  status: template.design?.elements?.length || template.design?.fabricJson?.objects?.length ? 'Published' : 'Draft',
                }} />
              </Link>
            ))}
            {!templates.length ? <p className="panel-muted">No templates uploaded yet.</p> : null}
          </div>
        </Card>

        <Card>
          <div className="section-heading">
            <h2>Generation History</h2>
            <Link to="/history">Open history</Link>
          </div>
          {generations.length ? (
            <Table
              columns={[
                { key: '_id', label: 'Batch', render: (row) => row._id?.slice(-8) || '-' },
                { key: 'successfulRecords', label: 'Count', render: (row) => row.successfulRecords || 0 },
                { key: 'status', label: 'Status', render: (row) => <Badge tone={row.status === 'completed' ? 'success' : 'warning'}>{row.status}</Badge> },
              ]}
              rows={generations.slice(0, 3)}
            />
          ) : <p className="panel-muted">No generated batches yet.</p>}
        </Card>
      </section>
    </>
  )
}
