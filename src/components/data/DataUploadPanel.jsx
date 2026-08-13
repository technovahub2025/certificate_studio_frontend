import { UploadCloud } from 'lucide-react'

export default function DataUploadPanel({ status = '', onChooseFile }) {
  return (
    <div className="upload-panel">
      <UploadCloud size={28} />
      <h2>Upload recipient data</h2>
      <p>Use CSV or Excel files with any custom columns needed by your template fields.</p>
      <button type="button" className="btn btn-secondary" onClick={onChooseFile}>
        {status || 'Choose file'}
      </button>
    </div>
  )
}
