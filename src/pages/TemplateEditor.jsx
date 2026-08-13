import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DynamicFieldDialog from '../components/editor/DynamicFieldDialog'
import EditorCanvas from '../components/editor/EditorCanvas'
import EditorToolbar from '../components/editor/EditorToolbar'
import PropertiesPanel from '../components/editor/PropertiesPanel'
import ToolPanel from '../components/editor/ToolPanel'
import useCertificateEditor from '../hooks/useCertificateEditor'
import { dataFileService, templateService } from '../services/api'

const fallbackDesign = {
  width: 1600,
  height: 1100,
  background: null,
  elements: [],
}

const SELECTED_TEMPLATE_KEY = 'certificate_studio_selected_template_id'
const SELECTED_DATA_FILE_KEY = 'certificate_studio_selected_data_file_id'

export default function TemplateEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [template, setTemplate] = useState(null)
  const [initialDesign, setInitialDesign] = useState(fallbackDesign)
  const [dataFiles, setDataFiles] = useState([])
  const [selectedDataFileId, setSelectedDataFileId] = useState(() => localStorage.getItem(SELECTED_DATA_FILE_KEY) || '')
  const [previewData, setPreviewData] = useState({ columns: [], rows: [], recordCount: 0 })
  const [selectedRowIndex, setSelectedRowIndex] = useState(0)
  const [fieldMapping, setFieldMapping] = useState({})
  const [previewMode, setPreviewMode] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [generateStatus, setGenerateStatus] = useState('')
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const selectedRow = previewData.rows[selectedRowIndex] || null
  const editor = useCertificateEditor({ initialDesign, previewRow: selectedRow, fieldMapping, previewMode })

  useEffect(() => {
    if (id) {
      localStorage.setItem(SELECTED_TEMPLATE_KEY, id)
      return
    }

    const rememberedTemplateId = localStorage.getItem(SELECTED_TEMPLATE_KEY)
    if (rememberedTemplateId) navigate(`/templates/${rememberedTemplateId}/editor`, { replace: true })
  }, [id, navigate])

  useEffect(() => {
    let mounted = true
    async function load() {
      setError('')
      try {
        const [dataResult, templateResult] = await Promise.all([
          dataFileService.list(),
          id ? templateService.get(id) : Promise.resolve(null),
        ])
        if (!mounted) return
        const files = dataResult.data?.data || []
        setDataFiles(files)
        const rememberedDataFileId = localStorage.getItem(SELECTED_DATA_FILE_KEY)
        if (rememberedDataFileId && files.some((file) => file._id === rememberedDataFileId)) {
          setSelectedDataFileId(rememberedDataFileId)
        }
        if (templateResult) {
          const loaded = templateResult.data?.data
          setTemplate(loaded)
          setInitialDesign(loaded?.design?.width ? loaded.design : fallbackDesign)
          setFieldMapping(loaded?.fieldMapping || {})
        }
      } catch (loadError) {
        if (loadError.response?.status === 401) {
          setError('Sign in to load saved templates and data files.')
          return
        }
        setError(loadError.response?.data?.message || 'Unable to load editor data')
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [id])

  useEffect(() => {
    if (!selectedDataFileId) {
      setPreviewData({ columns: [], rows: [], recordCount: 0 })
      return
    }
    let mounted = true
    dataFileService.preview(selectedDataFileId, { limit: 50 }).then((result) => {
      if (!mounted) return
      setPreviewData({
        columns: result.data?.data?.columns || [],
        rows: result.data?.data?.rows || [],
        recordCount: result.data?.data?.recordCount || 0,
      })
      setSelectedRowIndex(0)
    }).catch(() => {
      if (mounted) setError('Unable to load data preview')
    })
    return () => {
      mounted = false
    }
  }, [selectedDataFileId])

  function selectDataFile(fileId) {
    setSelectedDataFileId(fileId)
    if (fileId) {
      localStorage.setItem(SELECTED_DATA_FILE_KEY, fileId)
    } else {
      localStorage.removeItem(SELECTED_DATA_FILE_KEY)
    }
  }

  const title = template?.name || 'Untitled Template'

  const mergedFields = useMemo(() => editor.templateFields, [editor.templateFields])

  async function handleSave() {
    if (!id) {
      setSaveStatus('Open a saved template first')
      setTimeout(() => setSaveStatus(''), 2200)
      return
    }
    setSaveStatus('Saving...')
    setError('')
    try {
      const design = editor.serialize()
      const [templateResult] = await Promise.all([
        templateService.update(id, { design }),
        templateService.saveMapping(id, fieldMapping),
      ])
      setTemplate(templateResult.data?.data)
      setSaveStatus('Saved')
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Unable to save design')
      setSaveStatus('Save failed')
    } finally {
      setTimeout(() => setSaveStatus(''), 2200)
    }
  }

  async function saveCurrentTemplate() {
    if (!id) throw new Error('Open a saved template first')
    const design = editor.serialize()
    const [templateResult] = await Promise.all([
      templateService.update(id, { design }),
      templateService.saveMapping(id, fieldMapping),
    ])
    setTemplate(templateResult.data?.data)
    return templateResult.data?.data
  }

  async function handleGenerate() {
    if (!id) {
      setError('Open a saved template before generating.')
      return
    }
    if (!selectedDataFileId) {
      setError('Select a data file before generating.')
      return
    }

    setGenerateStatus('Preparing...')
    setSaveStatus('Saving...')
    setError('')
    try {
      await saveCurrentTemplate()
      localStorage.setItem(SELECTED_TEMPLATE_KEY, id)
      localStorage.setItem(SELECTED_DATA_FILE_KEY, selectedDataFileId)
      setSaveStatus('Saved')
      navigate('/generate')
    } catch (generateError) {
      setError(generateError.response?.data?.message || generateError.message || 'Unable to prepare generation.')
      setSaveStatus('Save failed')
      setGenerateStatus('Generate failed')
      setTimeout(() => setGenerateStatus(''), 2200)
      setTimeout(() => setSaveStatus(''), 2200)
    }
  }

  return (
    <div className="editor-page">
      <header className="editor-top">
        <div>
          <p className="eyebrow">Template editor</p>
          <h1>{title}</h1>
          {error && <p className="form-message">{error}</p>}
        </div>
        <EditorToolbar
          previewMode={previewMode}
          saveStatus={saveStatus}
          generateStatus={generateStatus}
          onSave={handleSave}
          onGenerate={handleGenerate}
          canGenerate={Boolean(id && selectedDataFileId)}
          onTogglePreview={() => setPreviewMode((value) => !value)}
          onUndo={editor.undo}
          onRedo={editor.redo}
          onZoomIn={() => editor.setZoom((value) => Math.min(value + 0.1, 1.4))}
          onZoomOut={() => editor.setZoom((value) => Math.max(value - 0.1, 0.25))}
          onResetZoom={() => editor.setZoom(0.45)}
        />
      </header>
      <div className="editor-workspace">
        <ToolPanel
          onAddElement={editor.addElement}
          onOpenDynamicField={() => setDialogOpen(true)}
          dataFiles={dataFiles}
          selectedDataFileId={selectedDataFileId}
          onSelectDataFile={selectDataFile}
          selectedRowIndex={selectedRowIndex}
          onSelectRow={setSelectedRowIndex}
          previewRows={previewData.rows}
          columns={previewData.columns}
          mapping={fieldMapping}
          templateFields={mergedFields}
          onMappingChange={(field, column) => setFieldMapping((mapping) => ({ ...mapping, [field]: column }))}
        />
        <EditorCanvas
          canvasRef={editor.canvasRef}
          width={editor.design.width}
          height={editor.design.height}
          zoom={editor.zoom}
          previewMode={previewMode}
          background={editor.design.background}
        />
        <PropertiesPanel
          design={editor.design}
          selectedElement={editor.selectedElement}
          layers={editor.layers}
          onUpdate={editor.updateSelected}
          onDuplicate={editor.duplicateSelected}
          onDelete={editor.deleteSelected}
          onSelectLayer={editor.selectLayer}
          onMoveLayer={editor.moveLayer}
        />
      </div>
      <DynamicFieldDialog
        open={dialogOpen}
        columns={previewData.columns}
        onClose={() => setDialogOpen(false)}
        onCreate={({ field }) => {
          editor.addElement('dynamic-text', { field })
          setDialogOpen(false)
        }}
      />
    </div>
  )
}
