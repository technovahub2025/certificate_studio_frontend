export const DEFAULT_DESIGN_WIDTH = 1600
export const DEFAULT_DESIGN_HEIGHT = 1100

function numberOr(value, fallback) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

function positiveOr(value, fallback) {
  const next = numberOr(value, fallback)
  return next > 0 ? next : fallback
}

export function normalizeDesign(design = {}) {
  const width = positiveOr(design.width ?? design.designWidth, DEFAULT_DESIGN_WIDTH)
  const height = positiveOr(design.height ?? design.designHeight, DEFAULT_DESIGN_HEIGHT)

  return {
    ...design,
    coordinateSpace: 'design',
    coordinateModel: design.coordinateModel || 'fabric',
    width,
    height,
    designWidth: width,
    designHeight: height,
    background: design.background || null,
    elements: (design.elements || []).map((element) => ({
      ...element,
      x: numberOr(element.x, 0),
      y: numberOr(element.y, 0),
      width: positiveOr(element.width, element.type === 'qr-code' ? 150 : 200),
      height: positiveOr(element.height, element.type === 'qr-code' ? 150 : 50),
      rotation: numberOr(element.rotation, 0),
    })),
  }
}

export function getViewportTransform({ designWidth, designHeight, viewportWidth, viewportHeight, zoom = 1 }) {
  const width = positiveOr(designWidth, DEFAULT_DESIGN_WIDTH)
  const height = positiveOr(designHeight, DEFAULT_DESIGN_HEIGHT)
  const scaleX = positiveOr(viewportWidth, width) / width
  const scaleY = positiveOr(viewportHeight, height) / height
  const scale = Math.min(scaleX, scaleY) * positiveOr(zoom, 1)

  return {
    scale,
    width: width * scale,
    height: height * scale,
  }
}
