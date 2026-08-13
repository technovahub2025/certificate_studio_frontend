import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import PageHeader from '../components/common/PageHeader'
import GenerationSteps from '../components/generation/GenerationSteps'
import CertificatePreview from '../components/templates/CertificatePreview'
import { dataFileService, generationService, templateService } from '../services/api'

const SELECTED_TEMPLATE_KEY = 'certificate_studio_selected_template_id'
const SELECTED_DATA_FILE_KEY = 'certificate_studio_selected_data_file_id'

export default function Generate() {
  const navigate = useNavigate()
  const [template, setTemplate] = useState(null)
  const [dataFile, setDataFile] = useState(null)
  const [outputFormat, setOutputFormat] = useState('pdf')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const templateId = localStorage.getItem(SELECTED_TEMPLATE_KEY)
  const dataFileId = localStorage.getItem(SELECTED_DATA_FILE_KEY)

  useEffect(() => {
    let mounted = true

    async function loadSelection() {
      setError('')
      try {
        const [templateResult, dataResult] = await Promise.all([
          templateId ? templateService.get(templateId) : Promise.resolve(null),
          dataFileId ? dataFileService.get(dataFileId) : Promise.resolve(null),
        ])
        if (!mounted) return
        setTemplate(templateResult?.data?.data || null)
        setDataFile(dataResult?.data?.data || null)
      } catch (loadError) {
        if (mounted) setError(loadError.response?.data?.message || 'Unable to load selected template or data file.')
      }
    }

    loadSelection()
    return () => {
      mounted = false
    }
  }, [dataFileId, templateId])

  const canGenerate = Boolean(template?._id && dataFile?._id)

  async function handleGenerate() {
    if (!canGenerate) {
      setError('Choose a template and a data file before generating.')
      return
    }

    setStatus('Generating...')
    setError('')
    try {
      const result = await generationService.create({
        templateId: template._id,
        dataFileId: dataFile._id,
        outputFormat,
        requestScope: 'all',
        fieldMapping: template.fieldMapping || {},
      })
      const generation = result.data?.data
      if (generation?._id) navigate(`/generate/result/${generation._id}`)
    } catch (generateError) {
      setError(generateError.response?.data?.message || 'Unable to generate certificates.')
      setStatus('Generate failed')
    } finally {
      setTimeout(() => setStatus(''), 2200)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Batch generation"
        title="Generate Certificates"
        description="Use the selected template and recipient data to generate one certificate for every data row."
        actions={(
          <>
            <label className="download-format">
              Format
              <select value={outputFormat} onChange={(event) => setOutputFormat(event.target.value)}>
                <option value="pdf">PDF</option>
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="jpeg">JPEG</option>
              </select>
            </label>
            <Button onClick={handleGenerate} disabled={!canGenerate}>{status || 'Start generation'}</Button>
          </>
        )}
      />
      {error && <p className="form-message">{error}</p>}
      <GenerationSteps active={canGenerate ? 3 : dataFile ? 1 : template ? 0 : -1} />
      <section className="content-grid two-col">
        <Card>
          <div className="section-heading">
            <h2>Selected template</h2>
            <Link to="/templates">Change</Link>
          </div>
          <CertificatePreview template={template} />
          <div className="settings-list">
            <strong>{template?.name || 'No template selected'}</strong>
            <span>{template ? `${template.design?.elements?.length || 0} editable fields` : 'Upload or choose a template first.'}</span>
          </div>
        </Card>
        <Card>
          <div className="section-heading">
            <h2>Recipient data</h2>
            <Link to="/data">Change</Link>
          </div>
          <div className="settings-list">
            <strong>{dataFile?.originalName || 'No data file selected'}</strong>
            <span>{dataFile ? `${dataFile.recordCount || 0} certificates will be generated` : 'Upload or choose a data file first.'}</span>
            <span>{dataFile?.columns?.length ? `Columns: ${dataFile.columns.join(', ')}` : ''}</span>
          </div>
        </Card>
        <Card>
          <h2>Generation summary</h2>
          <div className="settings-list">
            <span>Template: {template?.name || '-'}</span>
            <span>Rows: {dataFile?.recordCount || 0}</span>
            <span>Output: {outputFormat.toUpperCase()}</span>
          </div>
        </Card>
      </section>
    </>
  )
}
