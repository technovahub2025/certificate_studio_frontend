import { MoreHorizontal, Trash2 } from 'lucide-react'
import Badge from '../common/Badge'
import Card from '../common/Card'
import CertificatePreview from './CertificatePreview'

export default function TemplateCard({ template, menuOpen = false, onToggleMenu, onDelete, deleting = false }) {
  function handleMenuClick(event) {
    event.preventDefault()
    event.stopPropagation()
    onToggleMenu?.()
  }

  function handleDeleteClick(event) {
    event.preventDefault()
    event.stopPropagation()
    onDelete?.()
  }

  return (
    <Card className="template-card">
      <CertificatePreview ratio={template.ratio} template={template} />
      <div className="template-meta">
        <div>
          <h3>{template.name}</h3>
          <p>Updated {template.updated}</p>
        </div>
        <div className="template-actions">
          <button className="icon-button" type="button" aria-label={`Open ${template.name} menu`} onClick={handleMenuClick}>
            <MoreHorizontal size={18} />
          </button>
          {menuOpen ? (
            <div className="template-action-menu" role="menu">
              <button type="button" role="menuitem" className="danger" onClick={handleDeleteClick} disabled={deleting}>
                <Trash2 size={15} />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <Badge tone={template.status === 'Published' ? 'success' : 'warning'}>{template.status}</Badge>
    </Card>
  )
}
