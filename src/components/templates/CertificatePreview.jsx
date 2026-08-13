function getApiAssetUrl(src) {
  if (!src) return ''
  if (/^https?:\/\//i.test(src) || src.startsWith('data:')) return src
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  return `${apiBase.replace(/\/api\/?$/, '')}${src.startsWith('/') ? src : `/${src}`}`
}

export default function CertificatePreview({ ratio = 'landscape', compact = false, template = null }) {
  const background = template?.design?.background

  return (
    <div className={`certificate-preview ${ratio} ${compact ? 'compact' : ''}`.trim()}>
      {background?.type === 'image' && background.src ? (
        <img className="certificate-preview-media" src={getApiAssetUrl(background.src)} alt={template?.name || 'Template preview'} />
      ) : background?.type === 'pdf' && background.src ? (
        <object
          className="certificate-preview-media"
          data={`${getApiAssetUrl(background.src)}#toolbar=0&navpanes=0&scrollbar=0&view=Fit&zoom=page-fit`}
          type="application/pdf"
          aria-label={template?.name || 'PDF template preview'}
        >
          <span>PDF template</span>
        </object>
      ) : (
        <div className="cert-border">
          <p>Certificate of Completion</p>
          <strong>{'{{ Student Name }}'}</strong>
          <span>{'{{ Course }}'}</span>
          <small>Certificate No. {'{{ Certificate Number }}'}</small>
        </div>
      )}
    </div>
  )
}
