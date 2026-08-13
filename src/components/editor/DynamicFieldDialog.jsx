import { useEffect, useState } from 'react'
import Button from '../common/Button'

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

export default function DynamicFieldDialog({ open, columns = [], onClose, onCreate }) {
  const [fieldName, setFieldName] = useState('')
  const [dataColumn, setDataColumn] = useState('')

  useEffect(() => {
    if (!open) return
    setFieldName('')
    setDataColumn('')
  }, [open])

  if (!open) return null

  const field = slugify(dataColumn || fieldName || 'custom_field')

  return (
    <div className="dialog-backdrop" role="presentation">
      <form
        className="dynamic-field-dialog"
        onSubmit={(event) => {
          event.preventDefault()
          onCreate({ fieldName, field })
        }}
      >
        <h2>Dynamic Field</h2>
        <label>
          Field name
          <input value={fieldName} onChange={(event) => setFieldName(event.target.value)} placeholder="Student Name" autoFocus />
        </label>
        <label>
          Data column
          <input list="data-columns" value={dataColumn} onChange={(event) => setDataColumn(event.target.value)} placeholder="student_name" />
          <datalist id="data-columns">
            {columns.map((column) => <option key={column} value={column} />)}
          </datalist>
        </label>
        <p className="panel-muted">Field key: {field}</p>
        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add field</Button>
        </div>
      </form>
    </div>
  )
}
