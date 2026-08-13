import { AlignCenter, AlignLeft, AlignRight, BringToFront, ChevronDown, ChevronUp, Copy, SendToBack, Trash2 } from 'lucide-react'

function toInputValue(value, fallback = '') {
  return value ?? fallback
}

export default function PropertiesPanel({
  design,
  selectedElement,
  layers,
  onUpdate,
  onDuplicate,
  onDelete,
  onSelectLayer,
  onMoveLayer,
}) {
  const isText = selectedElement?.type === 'text' || selectedElement?.type === 'dynamic-text'
  const isShape = selectedElement?.type === 'shape'

  return (
    <aside className="editor-panel properties-panel">
      <h2>Properties</h2>
      {selectedElement ? (
        <>
          <label>
            Layer name
            <input value={selectedElement.type === 'dynamic-text' ? selectedElement.field : selectedElement.text || selectedElement.type} readOnly />
          </label>

          {isText && (
            <>
              {selectedElement.type === 'text' && (
                <label>
                  Text
                  <textarea value={toInputValue(selectedElement.text)} onChange={(event) => onUpdate({ text: event.target.value })} />
                </label>
              )}
              {selectedElement.type === 'dynamic-text' && (
                <label>
                  Data field
                  <input value={toInputValue(selectedElement.field)} onChange={(event) => onUpdate({ field: event.target.value })} />
                </label>
              )}
              <label>
                Font size
                <input type="number" min="8" value={toInputValue(selectedElement.fontSize, 42)} onChange={(event) => onUpdate({ fontSize: event.target.value })} />
              </label>
              <label>
                Font family
                <select value={toInputValue(selectedElement.fontFamily, 'Inter')} onChange={(event) => onUpdate({ fontFamily: event.target.value })}>
                  <option>Inter</option>
                  <option>Georgia</option>
                  <option>JetBrains Mono</option>
                  <option>Arial</option>
                  <option>Times New Roman</option>
                </select>
              </label>
              <label>
                Weight
                <select value={toInputValue(selectedElement.fontWeight, '600')} onChange={(event) => onUpdate({ fontWeight: event.target.value })}>
                  <option value="400">Regular</option>
                  <option value="500">Medium</option>
                  <option value="600">Semibold</option>
                  <option value="700">Bold</option>
                  <option value="800">Extra bold</option>
                </select>
              </label>
              <div className="segmented-row">
                <button type="button" className={selectedElement.fontStyle === 'italic' ? 'active' : ''} onClick={() => onUpdate({ fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}>I</button>
                <button type="button" className={selectedElement.underline ? 'active' : ''} onClick={() => onUpdate({ underline: !selectedElement.underline })}>U</button>
                <button type="button" className={selectedElement.textAlign === 'left' ? 'active' : ''} onClick={() => onUpdate({ textAlign: 'left' })}><AlignLeft size={16} /></button>
                <button type="button" className={selectedElement.textAlign === 'center' ? 'active' : ''} onClick={() => onUpdate({ textAlign: 'center' })}><AlignCenter size={16} /></button>
                <button type="button" className={selectedElement.textAlign === 'right' ? 'active' : ''} onClick={() => onUpdate({ textAlign: 'right' })}><AlignRight size={16} /></button>
              </div>
              <label>
                Color
                <input type="color" value={toInputValue(selectedElement.color, '#172033')} onChange={(event) => onUpdate({ color: event.target.value })} />
              </label>
              <label>
                Letter spacing
                <input type="number" value={toInputValue(selectedElement.letterSpacing, 0)} onChange={(event) => onUpdate({ letterSpacing: event.target.value })} />
              </label>
              <label>
                Line height
                <input type="number" step="0.1" min="0.8" value={toInputValue(selectedElement.lineHeight, 1.2)} onChange={(event) => onUpdate({ lineHeight: event.target.value })} />
              </label>
            </>
          )}

          {isShape && (
            <>
              <label>
                Fill
                <input type="color" value={toInputValue(selectedElement.fill, '#ffffff')} onChange={(event) => onUpdate({ fill: event.target.value })} />
              </label>
              <label>
                Stroke
                <input type="color" value={toInputValue(selectedElement.stroke, '#172033')} onChange={(event) => onUpdate({ stroke: event.target.value })} />
              </label>
            </>
          )}

          <div className="property-grid">
            <label>
              X
              <input type="number" value={toInputValue(selectedElement.x, 0)} onChange={(event) => onUpdate({ x: event.target.value })} />
            </label>
            <label>
              Y
              <input type="number" value={toInputValue(selectedElement.y, 0)} onChange={(event) => onUpdate({ y: event.target.value })} />
            </label>
            <label>
              Width
              <input type="number" value={toInputValue(selectedElement.width, 100)} onChange={(event) => onUpdate({ width: event.target.value })} />
            </label>
            <label>
              Height
              <input type="number" value={toInputValue(selectedElement.height, 50)} onChange={(event) => onUpdate({ height: event.target.value })} />
            </label>
          </div>
          <label>
            Rotation
            <input type="range" min="-180" max="180" value={toInputValue(selectedElement.rotation, 0)} onChange={(event) => onUpdate({ rotation: event.target.value })} />
          </label>

          <div className="layer-actions">
            <button type="button" onClick={onDuplicate}><Copy size={16} />Duplicate</button>
            <button type="button" className="danger" onClick={onDelete}><Trash2 size={16} />Delete</button>
          </div>
        </>
      ) : (
        <div className="template-properties">
          <label>
            Canvas width
            <input value={design.width || 1600} readOnly />
          </label>
          <label>
            Canvas height
            <input value={design.height || 1100} readOnly />
          </label>
          <p className="panel-muted">Select an element to edit its properties.</p>
        </div>
      )}

      <h2>Layers</h2>
      <div className="layer-reorder">
        <button type="button" onClick={() => onMoveLayer('front')} title="Bring to front"><BringToFront size={16} /></button>
        <button type="button" onClick={() => onMoveLayer('forward')} title="Bring forward"><ChevronUp size={16} /></button>
        <button type="button" onClick={() => onMoveLayer('backward')} title="Send backward"><ChevronDown size={16} /></button>
        <button type="button" onClick={() => onMoveLayer('back')} title="Send to back"><SendToBack size={16} /></button>
      </div>
      <ol className="layers-list">
        {layers.map((layer) => (
          <li key={layer.id} className={selectedElement?.id === layer.id ? 'active' : ''}>
            <button type="button" onClick={() => onSelectLayer(layer.id)}>
              {layer.type === 'dynamic-text' ? layer.field : layer.text || layer.type}
            </button>
          </li>
        ))}
      </ol>
    </aside>
  )
}
