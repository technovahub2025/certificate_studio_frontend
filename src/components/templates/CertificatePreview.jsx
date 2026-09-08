import { getImageUrl } from '../../utils/imageUrl'

export default function CertificatePreview({ ratio = 'landscape', compact = false, template = null }) {
  const background = template?.design?.background
  const thumbnailUrl = getImageUrl(template?.thumbnail)
  const backgroundUrl = getImageUrl(background?.src)
  const previewSrc = thumbnailUrl || backgroundUrl

  const renderAsPdf = !thumbnailUrl && background?.type === 'pdf' && !!backgroundUrl

  return (
    <div className={`certificate-preview ${ratio} ${compact ? 'compact' : ''}`.trim()}>
      {previewSrc ? (
        renderAsPdf ? (
          <object
            className="certificate-preview-media"
            data={`${previewSrc}#toolbar=0&navpanes=0&scrollbar=0&view=Fit&zoom=page-fit`}
            type="application/pdf"
            aria-label={template?.name || 'PDF template preview'}
          >
            <span>PDF template</span>
          </object>
        ) : (
          <img className="certificate-preview-media" src={previewSrc} alt={template?.name || 'Template preview'} />
        )
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
