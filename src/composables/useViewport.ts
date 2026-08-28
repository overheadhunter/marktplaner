import { computed, reactive, ref, type Ref } from 'vue'
import type { Point } from '../model'

export interface ViewBox {
  x: number
  y: number
  w: number
  h: number
}

/** Pan/zoom state of an SVG map expressed as its `viewBox`, plus client ↔ image coordinate conversion. */
export function useViewport(svg: Ref<SVGSVGElement | undefined>) {
  const viewBox = reactive<ViewBox>({ x: 0, y: 0, w: 1000, h: 1000 })
  // screen px per image px; updated on fit/zoom and when the element is resized
  const clientWidth = ref(1)
  const clientHeight = ref(1)

  const refreshClientSize = () => {
    if (!svg.value) return
    clientWidth.value = svg.value.clientWidth || 1
    clientHeight.value = svg.value.clientHeight || 1
  }

  const scale = computed(() => Math.min(clientWidth.value / viewBox.w, clientHeight.value / viewBox.h))

  const viewBoxString = computed(() => `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`)

  /** Fits the whole image into the element with some padding. */
  function fit(imageWidth: number, imageHeight: number, padding = 0.05) {
    refreshClientSize()
    const aspect = clientWidth.value / clientHeight.value
    let w = imageWidth * (1 + 2 * padding)
    let h = imageHeight * (1 + 2 * padding)
    if (w / h < aspect) w = h * aspect
    else h = w / aspect
    viewBox.x = imageWidth / 2 - w / 2
    viewBox.y = imageHeight / 2 - h / 2
    viewBox.w = w
    viewBox.h = h
  }

  function clientToImage(clientX: number, clientY: number): Point {
    const el = svg.value
    if (!el) return { x: 0, y: 0 }
    const ctm = el.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }

  /** Zooms by `factor` (>1 zooms out) keeping the image point under the given client position fixed. */
  function zoomAt(clientX: number, clientY: number, factor: number) {
    const p = clientToImage(clientX, clientY)
    const f = Math.min(Math.max(factor, 0.5), 2)
    const newW = viewBox.w * f
    if (newW < 20 || newW > 200_000) return
    viewBox.x = p.x - (p.x - viewBox.x) * f
    viewBox.y = p.y - (p.y - viewBox.y) * f
    viewBox.w = newW
    viewBox.h = viewBox.h * f
  }

  /** Pans by a delta given in image px. */
  function panBy(dx: number, dy: number) {
    viewBox.x -= dx
    viewBox.y -= dy
  }

  function center(): Point {
    return { x: viewBox.x + viewBox.w / 2, y: viewBox.y + viewBox.h / 2 }
  }

  return { viewBox, viewBoxString, scale, fit, clientToImage, zoomAt, panBy, center, refreshClientSize }
}
