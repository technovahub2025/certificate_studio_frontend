import { Image, QrCode, Square, SquarePen, Type } from 'lucide-react'

const tools = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'dynamic-text', label: 'Dynamic field', icon: SquarePen },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'shape', label: 'Shape', icon: Square },
  { type: 'qr-code', label: 'QR code', icon: QrCode },
]

function fieldKey(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

export default function ToolPanel({
  onAddElement,
  onOpenDynamicField,
  dataFiles = [],
  selectedDataFileId = '',
  onSelectDataFile,
  selectedRowIndex = 0,
  onSelectRow,
  previewRows = [],
  columns = [],
  mapping = {},
  templateFields = [],
  onMappingChange,
}) {
  return (
    <aside className="editor-panel">
      <h2>Elements</h2>
      <div className="tool-grid">
        {tools.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              if (type === 'dynamic-text') return onOpenDynamicField()
              if (type === 'image') {
                const src = window.prompt('Image URL')
                if (src) onAddElement('image', { src })
                return undefined
              }
              return onAddElement(type)
            }}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <h2>Dynamic Fields</h2>
      <div className="field-pills">
        {columns.length ? columns.map((field) => (
          <button key={field} type="button" onClick={() => onAddElement('dynamic-text', { field: fieldKey(field) })}>
            {field}
          </button>
        )) : <p className="panel-muted">Select a data file to use its columns as dynamic fields.</p>}
      </div>

      <h2>Data Preview</h2>
      <div className="editor-form-stack">
        <label>
          Data file
          <select value={selectedDataFileId} onChange={(event) => onSelectDataFile(event.target.value)}>
            <option value="">Select data</option>
            {dataFiles.map((file) => (
              <option key={file._id || file.id} value={file._id || file.id}>
                {file.originalName || file.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Preview row
          <select value={selectedRowIndex} onChange={(event) => onSelectRow(Number(event.target.value))} disabled={!previewRows.length}>
            {previewRows.length ? previewRows.map((row, index) => (
              <option key={row._id || index} value={index}>
                Row {index + 1}
              </option>
            )) : <option value="0">No rows</option>}
          </select>
        </label>
      </div>

      <h2>Field Mapping</h2>
      <div className="mapping-list">
        {templateFields.length ? templateFields.map((field) => (
          <label key={field}>
            <span>{field}</span>
            <select value={mapping[field] || ''} onChange={(event) => onMappingChange(field, event.target.value)}>
              <option value="">Match by same name</option>
              {columns.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </label>
        )) : <p className="panel-muted">Add dynamic fields to map data columns.</p>}
      </div>
    </aside>
  )
}
