import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as fabric from 'fabric'
import {
  DEFAULT_DESIGN_WIDTH,
  DEFAULT_DESIGN_HEIGHT,
  getViewportTransform,
  normalizeDesign,
} from '../utils/coordinateSystem'

const CANVAS_WIDTH = DEFAULT_DESIGN_WIDTH
const CANVAS_HEIGHT = DEFAULT_DESIGN_HEIGHT
const FABRIC_CUSTOM_PROPERTIES = [
  'certId',
  'certType',
  'certField',
  'certSource',
  'certShape',
  'elementType',
  'fieldKey',
  'textFit',
  'isBackground',
]

if (fabric.FabricObject) {
  fabric.FabricObject.customProperties = FABRIC_CUSTOM_PROPERTIES
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getApiAssetUrl(src) {
  if (!src) return ''
  if (/^https?:\/\//i.test(src) || src.startsWith('data:')) return src
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  return `${apiBase.replace(/\/api\/?$/, '')}${src.startsWith('/') ? src : `/${src}`}`
}

function elementName(element) {
  if (!element) return 'Element'
  if (element.type === 'dynamic-text') return element.field || 'Dynamic field'
  if (element.type === 'qr-code') return 'QR Code'
  if (element.type === 'image') return 'Image'
  if (element.type === 'shape') return 'Shape'
  return element.text || 'Text'
}

function humanizeField(field) {
  return (field || 'dynamic field')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function normalizeFieldKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function resolveDynamicText(field, previewRow, mapping, previewMode) {
  if (!previewMode) return humanizeField(field)
  const mappedColumn = mapping?.[field] || field
  if (previewRow?.[mappedColumn] !== undefined && previewRow?.[mappedColumn] !== null) return String(previewRow[mappedColumn])
  const matchingColumn = Object.keys(previewRow || {}).find((column) => normalizeFieldKey(column) === normalizeFieldKey(mappedColumn))
  return String(matchingColumn ? previewRow[matchingColumn] : humanizeField(field))
}

function applyObjectMetadata(object, element) {
  object.set({
    certId: element.id,
    certType: element.type,
    certField: element.field || '',
    certSource: element.src || element.source || '',
    certShape: element.shape || '',
    elementType: element.type,
    fieldKey: element.field || '',
    name: element.name || elementName(element),
  })
}

function objectToElement(object) {
  const common = {
    id: object.certId || makeId('element'),
    type: object.elementType || object.certType || 'text',
    x: Math.round(object.left || 0),
    y: Math.round(object.top || 0),
    width: Math.round((object.width || 0) * (object.scaleX || 1)),
    height: Math.round((object.height || 0) * (object.scaleY || 1)),
    rotation: Math.round(object.angle || 0),
    originX: object.originX || 'left',
    originY: object.originY || 'top',
    scaleX: Number(object.scaleX || 1),
    scaleY: Number(object.scaleY || 1),
  }

  if (common.type === 'text' || common.type === 'dynamic-text') {
    return {
      ...common,
      text: common.type === 'dynamic-text' ? undefined : object.text,
      field: common.type === 'dynamic-text' ? object.fieldKey || object.certField : undefined,
      fontFamily: object.fontFamily || 'Inter',
      fontSize: Math.round(object.fontSize || 36),
      fontWeight: object.fontWeight || '400',
      fontStyle: object.fontStyle || 'normal',
      underline: Boolean(object.underline),
      color: object.fill || '#172033',
      textAlign: object.textAlign || 'left',
      letterSpacing: Number(object.charSpacing || 0),
      lineHeight: Number(object.lineHeight || 1.2),
    }
  }

  if (common.type === 'image') {
    return {
      ...common,
      src: object.certSource || '',
    }
  }

  if (common.type === 'qr-code') {
    return {
      ...common,
      field: object.fieldKey || object.certField || 'certificate_number',
      shape: 'qr-placeholder',
    }
  }

  return {
    ...common,
    shape: object.certShape || 'rectangle',
    fill: object.fill || '#ffffff',
    stroke: object.stroke || '#172033',
    strokeWidth: object.strokeWidth || 1,
  }
}

function createTextObject(element, previewRow, mapping, previewMode) {
  const isDynamic = element.type === 'dynamic-text'
  const text = isDynamic ? resolveDynamicText(element.field, previewRow, mapping, previewMode) : element.text || 'Text'
  const width = element.width || 520
  const textAlign = element.textAlign || element.align || 'center'
  const object = new fabric.Textbox(text, {
    left: element.x ?? 360,
    top: element.y ?? 240,
    originX: element.originX || 'left',
    originY: element.originY || 'top',
    width,
    height: element.height || 70,
    angle: element.rotation || 0,
    fontFamily: element.fontFamily || 'Inter',
    fontSize: element.fontSize || 42,
    fontWeight: element.fontWeight || '600',
    fontStyle: element.fontStyle || 'normal',
    underline: Boolean(element.underline),
    fill: element.color || '#172033',
    textAlign,
    charSpacing: Number(element.letterSpacing || 0),
    lineHeight: Number(element.lineHeight || 1.2),
    editable: !previewMode && !isDynamic,
  })
  applyObjectMetadata(object, element)
  return object
}

function resizeCanvas(canvas, width, height, zoom) {
  const viewport = getViewportTransform({
    designWidth: width,
    designHeight: height,
    viewportWidth: width,
    viewportHeight: height,
    zoom,
  })
  canvas.setDimensions({
    width: viewport.width,
    height: viewport.height,
  })
  canvas.setViewportTransform([viewport.scale, 0, 0, viewport.scale, 0, 0])
}

function createQrObject(element) {
  const group = new fabric.Group([
    new fabric.Rect({ width: element.width || 150, height: element.height || 150, fill: '#ffffff', stroke: '#172033', strokeWidth: 3 }),
    new fabric.Textbox('QR', { width: element.width || 150, top: 50, fontSize: 34, fontWeight: '700', fill: '#172033', textAlign: 'center' }),
  ], {
    left: element.x ?? 1220,
    top: element.y ?? 820,
    originX: element.originX || 'left',
    originY: element.originY || 'top',
    angle: element.rotation || 0,
  })
  applyObjectMetadata(group, element)
  return group
}

function createShapeObject(element) {
  const rect = new fabric.Rect({
    left: element.x ?? 220,
    top: element.y ?? 220,
    originX: element.originX || 'left',
    originY: element.originY || 'top',
    width: element.width || 220,
    height: element.height || 120,
    angle: element.rotation || 0,
    fill: element.fill || '#ffffff',
    stroke: element.stroke || '#172033',
    strokeWidth: element.strokeWidth ?? 2,
  })
  applyObjectMetadata(rect, element)
  return rect
}

async function createImageObject(element) {
  const image = await fabric.FabricImage.fromURL(getApiAssetUrl(element.src || element.source), { crossOrigin: 'anonymous' })
  const targetWidth = element.width || 240
  const targetHeight = element.height || targetWidth * ((image.height || 1) / (image.width || 1))
  image.set({
    left: element.x ?? 300,
    top: element.y ?? 300,
    originX: element.originX || 'left',
    originY: element.originY || 'top',
    angle: element.rotation || 0,
    scaleX: targetWidth / (image.width || targetWidth),
    scaleY: targetHeight / (image.height || targetHeight),
  })
  applyObjectMetadata(image, element)
  return image
}

async function createBackgroundObject(background, width, height) {
  if (!background?.src || background.type !== 'image') return null
  const image = await fabric.FabricImage.fromURL(getApiAssetUrl(background.src), { crossOrigin: 'anonymous' })
  image.set({
    left: 0,
    top: 0,
    originX: 'left',
    originY: 'top',
    scaleX: width / (image.width || width),
    scaleY: height / (image.height || height),
    selectable: false,
    evented: false,
    lockMovementX: true,
    lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    isBackground: true,
    certType: 'background',
    elementType: 'background',
    certSource: background.src,
  })
  return image
}

function refreshFabricObject(object) {
  if (!object) return
  object.initDimensions?.()
  object.setCoords?.()
  object.dirty = true
}

function toFiniteNumber(value, fallback = 0) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

export default function useCertificateEditor({ initialDesign, previewRow, fieldMapping, previewMode }) {
  const canvasRef = useRef(null)
  const fabricRef = useRef(null)
  const historyRef = useRef([])
  const redoRef = useRef([])
  const [design, setDesign] = useState(() => normalizeDesign(initialDesign || { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, background: null, elements: [] }))
  const designRef = useRef(design)
  const [selectedElement, setSelectedElement] = useState(null)
  const [layers, setLayers] = useState([])
  const [zoom, setZoom] = useState(0.45)
  const zoomRef = useRef(zoom)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    designRef.current = design
  }, [design])

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  const templateFields = useMemo(() => {
    const names = new Set()
    design.elements?.forEach((element) => {
      if (element.type === 'dynamic-text' && element.field) names.add(element.field)
    })
    return [...names]
  }, [design])

  const syncFromCanvas = useCallback((pushHistory = true) => {
    const canvas = fabricRef.current
    if (!canvas) return null
    const elements = canvas.getObjects().filter((object) => !object.isBackground).map(objectToElement)
    const fabricJson = canvas.toJSON(FABRIC_CUSTOM_PROPERTIES)
    const currentDesign = designRef.current
    const nextDesign = normalizeDesign({
      ...currentDesign,
      coordinateModel: 'fabric',
      width: currentDesign.width || CANVAS_WIDTH,
      height: currentDesign.height || CANVAS_HEIGHT,
      background: currentDesign.background || null,
      elements,
      fabricJson,
    })
    designRef.current = nextDesign
    setDesign(nextDesign)
    setLayers([...elements].reverse())
    const active = canvas.getActiveObject()
    setSelectedElement(active ? objectToElement(active) : null)
    if (pushHistory) {
      historyRef.current.push(JSON.stringify(nextDesign))
      redoRef.current = []
    }
    return nextDesign
  }, [])

  const loadDesign = useCallback(async (nextDesign) => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.clear()
    let workingDesign = normalizeDesign(nextDesign || { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, background: null, elements: [] })

    if (workingDesign.background?.type === 'image' && workingDesign.background.src) {
      canvas.backgroundColor = 'rgba(255,255,255,0)'
      try {
        const backgroundImage = await fabric.FabricImage.fromURL(getApiAssetUrl(workingDesign.background.src), { crossOrigin: 'anonymous' })
        const naturalWidth = Math.round(backgroundImage.width || workingDesign.width)
        const naturalHeight = Math.round(backgroundImage.height || workingDesign.height)
        const hasPlacedElements = Boolean((workingDesign.elements || []).length)
        if (!hasPlacedElements && naturalWidth && naturalHeight && (workingDesign.width !== naturalWidth || workingDesign.height !== naturalHeight)) {
          workingDesign = {
            ...workingDesign,
            width: naturalWidth,
            height: naturalHeight,
            designWidth: naturalWidth,
            designHeight: naturalHeight,
            background: {
              ...workingDesign.background,
              intrinsicWidth: naturalWidth,
              intrinsicHeight: naturalHeight,
            },
          }
        }
      } catch {
        canvas.backgroundColor = 'rgba(255,255,255,0)'
      }
    }

    resizeCanvas(canvas, workingDesign.width, workingDesign.height, zoomRef.current)

    canvas.backgroundColor = workingDesign.background?.type === 'image' ? 'rgba(255,255,255,0)' : '#ffffff'

    if (workingDesign.fabricJson?.objects?.length) {
      await canvas.loadFromJSON(workingDesign.fabricJson)
      canvas.getObjects().forEach((object) => {
        if (object.isBackground || object.elementType === 'background' || object.certType === 'background') {
          object.set({
            selectable: false,
            evented: false,
            lockMovementX: true,
            lockMovementY: true,
            lockScalingX: true,
            lockScalingY: true,
            lockRotation: true,
            isBackground: true,
          })
          canvas.sendObjectToBack(object)
        }
        object.setCoords()
      })
    } else {
      const backgroundObject = await createBackgroundObject(workingDesign.background, workingDesign.width, workingDesign.height)
      if (backgroundObject) canvas.add(backgroundObject)

      for (const element of workingDesign.elements || []) {
        try {
          let object
          if (element.type === 'text' || element.type === 'dynamic-text') object = createTextObject(element, null, {}, false)
          if (element.type === 'shape') object = createShapeObject(element)
          if (element.type === 'qr-code') object = createQrObject(element)
          if (element.type === 'image' || element.type === 'signature') object = await createImageObject({ ...element, type: 'image' })
          if (object) {
            canvas.add(object)
          }
        } catch {
          // Ignore a broken external image and keep the rest of the design editable.
        }
      }
    }

    canvas.renderAll()
    const elements = canvas.getObjects().filter((object) => !object.isBackground).map(objectToElement)
    workingDesign = normalizeDesign({
      ...workingDesign,
      coordinateModel: 'fabric',
      elements,
      fabricJson: canvas.toJSON(FABRIC_CUSTOM_PROPERTIES),
    })
    designRef.current = workingDesign
    setDesign(workingDesign)
    setLayers([...elements].reverse())
    setSelectedElement(null)
  }, [])

  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return
    const hostElement = canvasRef.current
    const canvasElement = document.createElement('canvas')
    hostElement.replaceChildren(canvasElement)

    const canvas = new fabric.Canvas(canvasElement, {
      preserveObjectStacking: true,
      selection: true,
      stopContextMenu: true,
    })
    fabricRef.current = canvas

    const onChange = () => {
      setRevision((value) => value + 1)
      syncFromCanvas(false)
    }
    canvas.on('selection:created', onChange)
    canvas.on('selection:updated', onChange)
    canvas.on('selection:cleared', onChange)
    canvas.on('object:modified', () => syncFromCanvas(true))
    canvas.on('text:changed', () => syncFromCanvas(false))

    return () => {
      canvas.dispose()
      fabricRef.current = null
      hostElement.replaceChildren()
    }
  }, [syncFromCanvas])

  useEffect(() => {
    const normalized = normalizeDesign(initialDesign || { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, background: null, elements: [] })
    loadDesign(normalized)
  }, [initialDesign, loadDesign])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    canvas.getObjects().forEach((object) => {
      const editable = !previewMode
      object.set({ selectable: editable, evented: editable })
      if (object.certType === 'dynamic-text') {
        object.set('text', resolveDynamicText(object.certField, previewRow, fieldMapping, previewMode))
        object.setCoords()
      }
    })
    if (previewMode) canvas.discardActiveObject()
    canvas.renderAll()
  }, [fieldMapping, previewMode, previewRow])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    resizeCanvas(canvas, design.width || CANVAS_WIDTH, design.height || CANVAS_HEIGHT, zoom)
    canvas.renderAll()
  }, [design.height, design.width, zoom])

  const addElement = useCallback(async (type, options = {}) => {
    const canvas = fabricRef.current
    if (!canvas || previewMode) return
    const element = {
      id: makeId(type),
      type,
      x: 420,
      y: 300,
      width: type === 'qr-code' ? 160 : 560,
      height: type === 'qr-code' ? 160 : 80,
      text: options.text || 'New text',
      field: options.field,
      fontFamily: 'Inter',
      fontSize: 46,
      fontWeight: '600',
      color: '#172033',
      textAlign: 'center',
      fill: '#ffffff',
      stroke: '#172033',
      src: options.src,
    }
    let object
    if (type === 'text' || type === 'dynamic-text') object = createTextObject(element, previewRow, fieldMapping, false)
    if (type === 'shape') object = createShapeObject(element)
    if (type === 'qr-code') object = createQrObject({ ...element, field: options.field || 'certificate_number' })
    if (type === 'image' && options.src) object = await createImageObject(element)
    if (!object) return
    canvas.add(object)
    canvas.setActiveObject(object)
    canvas.renderAll()
    syncFromCanvas(true)
  }, [fieldMapping, previewMode, previewRow, syncFromCanvas])

  const updateSelected = useCallback((patch) => {
    const canvas = fabricRef.current
    const object = canvas?.getActiveObject()
    if (!canvas || !object) return
    const next = {}
    if (patch.text !== undefined) next.text = patch.text
    if (patch.field !== undefined) {
      object.certField = patch.field
      next.text = resolveDynamicText(patch.field, previewRow, fieldMapping, previewMode)
    }
    if (patch.fontFamily !== undefined) next.fontFamily = patch.fontFamily
    if (patch.fontSize !== undefined) next.fontSize = toFiniteNumber(patch.fontSize, object.fontSize || 42)
    if (patch.fontWeight !== undefined) next.fontWeight = patch.fontWeight
    if (patch.fontStyle !== undefined) next.fontStyle = patch.fontStyle
    if (patch.underline !== undefined) next.underline = patch.underline
    if (patch.color !== undefined) next.fill = patch.color
    if (patch.textAlign !== undefined) {
      next.textAlign = patch.textAlign
    }
    if (patch.letterSpacing !== undefined) next.charSpacing = toFiniteNumber(patch.letterSpacing, object.charSpacing || 0)
    if (patch.lineHeight !== undefined) next.lineHeight = toFiniteNumber(patch.lineHeight, object.lineHeight || 1.2)
    if (patch.x !== undefined) next.left = toFiniteNumber(patch.x, object.left || 0)
    if (patch.y !== undefined) next.top = toFiniteNumber(patch.y, object.top || 0)
    if (patch.width !== undefined && object.set) {
      const width = toFiniteNumber(patch.width, object.getScaledWidth?.() || object.width || 100)
      if (object.certType === 'image') {
        object.scaleToWidth(width)
      } else {
        object.set({ scaleX: 1, width })
      }
    }
    if (patch.height !== undefined && object.set) {
      const height = toFiniteNumber(patch.height, object.getScaledHeight?.() || object.height || 50)
      if (object.certType === 'image') {
        object.scaleToHeight(height)
      } else {
        object.set({ scaleY: 1, height })
      }
    }
    if (patch.rotation !== undefined) next.angle = toFiniteNumber(patch.rotation, object.angle || 0)
    if (patch.fill !== undefined) next.fill = patch.fill
    if (patch.stroke !== undefined) next.stroke = patch.stroke
    object.set(next)
    refreshFabricObject(object)
    canvas.requestRenderAll()
    setSelectedElement(objectToElement(object))
    syncFromCanvas(true)
  }, [fieldMapping, previewMode, previewRow, syncFromCanvas])

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current
    const object = canvas?.getActiveObject()
    if (!canvas || !object || previewMode) return
    canvas.remove(object)
    canvas.discardActiveObject()
    canvas.renderAll()
    syncFromCanvas(true)
  }, [previewMode, syncFromCanvas])

  const duplicateSelected = useCallback(async () => {
    const canvas = fabricRef.current
    const object = canvas?.getActiveObject()
    if (!canvas || !object || previewMode) return
    const element = objectToElement(object)
    const copy = { ...element, id: makeId(element.type), x: element.x + 36, y: element.y + 36 }
    let clone
    if (copy.type === 'text' || copy.type === 'dynamic-text') clone = createTextObject(copy, previewRow, fieldMapping, false)
    if (copy.type === 'shape') clone = createShapeObject(copy)
    if (copy.type === 'qr-code') clone = createQrObject(copy)
    if (copy.type === 'image') clone = await createImageObject(copy)
    if (!clone) return
    canvas.add(clone)
    canvas.setActiveObject(clone)
    canvas.renderAll()
    syncFromCanvas(true)
  }, [fieldMapping, previewMode, previewRow, syncFromCanvas])

  const selectLayer = useCallback((id) => {
    const canvas = fabricRef.current
    const object = canvas?.getObjects().find((item) => item.certId === id)
    if (!canvas || !object) return
    canvas.setActiveObject(object)
    canvas.renderAll()
    setSelectedElement(objectToElement(object))
  }, [])

  const moveLayer = useCallback((direction) => {
    const canvas = fabricRef.current
    const object = canvas?.getActiveObject()
    if (!canvas || !object || previewMode) return
    if (direction === 'front') canvas.bringObjectToFront(object)
    if (direction === 'back') canvas.sendObjectToBack(object)
    if (direction === 'forward') canvas.bringObjectForward(object)
    if (direction === 'backward') canvas.sendObjectBackwards(object)
    canvas.getObjects().filter((item) => item.isBackground).forEach((item) => canvas.sendObjectToBack(item))
    canvas.renderAll()
    syncFromCanvas(true)
  }, [previewMode, syncFromCanvas])

  const undo = useCallback(() => {
    if (historyRef.current.length < 2) return
    const current = historyRef.current.pop()
    redoRef.current.push(current)
    const previous = JSON.parse(historyRef.current[historyRef.current.length - 1])
    loadDesign(previous)
  }, [loadDesign])

  const redo = useCallback(() => {
    const next = redoRef.current.pop()
    if (!next) return
    historyRef.current.push(next)
    loadDesign(JSON.parse(next))
  }, [loadDesign])

  return {
    canvasRef,
    design,
    layers,
    selectedElement,
    templateFields,
    zoom,
    revision,
    setZoom,
    addElement,
    updateSelected,
    deleteSelected,
    duplicateSelected,
    selectLayer,
    moveLayer,
    undo,
    redo,
    serialize: () => syncFromCanvas(false) || design,
  }
}
