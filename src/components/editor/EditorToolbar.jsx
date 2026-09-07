import { Eye, Redo2, RotateCcw, Save, Wand2, ZoomIn, ZoomOut } from 'lucide-react'
import Button from '../common/Button'

export default function EditorToolbar({
  previewMode,
  saveStatus,
  generateStatus,
  onSave,
  onGenerate,
  canGenerate,
  mode = 'single',
  onTogglePreview,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) {
  const generateTitle = mode === 'single'
    ? (canGenerate ? 'Generate one certificate' : 'Open a saved template first')
    : (canGenerate ? 'Save and continue to generation' : 'Select a saved template and data file first')
  return (
    <div className="editor-toolbar">
      <button type="button" onClick={onUndo} title="Undo"><RotateCcw size={16} /></button>
      <button type="button" onClick={onRedo} title="Redo"><Redo2 size={16} /></button>
      <button type="button" onClick={onZoomOut} title="Zoom out"><ZoomOut size={16} /></button>
      <button type="button" onClick={onZoomIn} title="Zoom in"><ZoomIn size={16} /></button>
      <button type="button" onClick={onResetZoom} title="Reset zoom">100%</button>
      <Button variant="secondary" onClick={onTogglePreview}><Eye size={16} />{previewMode ? 'Design' : 'Preview'}</Button>
      <Button
        variant="secondary"
        onClick={onGenerate}
        disabled={!canGenerate}
        title={generateTitle}
      >
        <Wand2 size={16} />{generateStatus || 'Generate'}
      </Button>
      <Button onClick={onSave}><Save size={16} />{saveStatus || 'Save'}</Button>
    </div>
  )
}
