export default function EditorCanvas({ canvasRef, width = 1600, height = 1100, zoom = 0.55, previewMode = false }) {
  return (
    <section className="editor-canvas" aria-label="Certificate editor canvas">
      <div className="canvas-ruler horizontal" />
      <div className="canvas-ruler vertical" />
      <div className="canvas-stage fabric-stage" style={{ width: width * zoom, height: height * zoom }}>
        <div ref={canvasRef} className="fabric-canvas-host" />
        {previewMode && <span className="preview-mode-chip">Preview</span>}
      </div>
    </section>
  )
}
