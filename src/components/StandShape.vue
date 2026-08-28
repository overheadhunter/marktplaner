<script setup lang="ts">
import { computed } from 'vue'
import { labelAngle, labelFontSize, snapAngle, normalizeAngle } from '../geometry'
import type { Placement, Point, Stand } from '../model'

const props = defineProps<{
  stand: Stand & { placement: Placement }
  pxPerMeter: number
  /** screen px per image px, used to keep handles a constant on-screen size */
  scale: number
  selected: boolean
  showLabel: boolean
  toImage: (clientX: number, clientY: number) => Point
}>()

const emit = defineEmits<{
  select: [id: string]
  'update:placement': [id: string, placement: Placement]
}>()

const w = computed(() => props.stand.width * props.pxPerMeter)
const d = computed(() => props.stand.depth * props.pxPerMeter)
const transform = computed(() => `translate(${props.stand.placement.x} ${props.stand.placement.y}) rotate(${props.stand.placement.angle})`)

// label rotation relative to the already rotated group
const labelRotation = computed(() => labelAngle(props.stand.placement.angle, props.stand.width, props.stand.depth) - props.stand.placement.angle)
const fontSize = computed(() => labelFontSize(props.stand.name, Math.max(w.value, d.value), Math.min(w.value, d.value)))

const handleOffset = computed(() => 28 / props.scale)
const handleRadius = computed(() => 8 / props.scale)

function onMovePointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  e.stopPropagation()
  emit('select', props.stand.id)
  const el = e.currentTarget as Element
  const start = props.toImage(e.clientX, e.clientY)
  const origin = { ...props.stand.placement }
  const onMove = (ev: PointerEvent) => {
    const p = props.toImage(ev.clientX, ev.clientY)
    emit('update:placement', props.stand.id, { ...origin, x: origin.x + (p.x - start.x), y: origin.y + (p.y - start.y) })
  }
  const onUp = () => {
    el.removeEventListener('pointermove', onMove as EventListener)
    el.removeEventListener('pointerup', onUp)
    el.removeEventListener('pointercancel', onUp)
  }
  el.setPointerCapture(e.pointerId)
  el.addEventListener('pointermove', onMove as EventListener)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)
}

function onRotatePointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  e.stopPropagation()
  const el = e.currentTarget as Element
  const { x: cx, y: cy } = props.stand.placement
  const onMove = (ev: PointerEvent) => {
    const p = props.toImage(ev.clientX, ev.clientY)
    // handle sits "above" the rect (negative local y), hence +90
    let angle = normalizeAngle((Math.atan2(p.y - cy, p.x - cx) * 180) / Math.PI + 90)
    if (ev.shiftKey) angle = snapAngle(angle, 15)
    emit('update:placement', props.stand.id, { ...props.stand.placement, angle })
  }
  const onUp = () => {
    el.removeEventListener('pointermove', onMove as EventListener)
    el.removeEventListener('pointerup', onUp)
    el.removeEventListener('pointercancel', onUp)
  }
  el.setPointerCapture(e.pointerId)
  el.addEventListener('pointermove', onMove as EventListener)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)
}
</script>

<template>
  <g :transform="transform" class="select-none">
    <rect
      :x="-w / 2"
      :y="-d / 2"
      :width="w"
      :height="d"
      :class="selected ? 'fill-sky-500/50 stroke-sky-700' : 'fill-amber-400/50 stroke-amber-700'"
      :stroke-width="selected ? 3 : 2"
      vector-effect="non-scaling-stroke"
      class="cursor-move"
      @pointerdown="onMovePointerDown"
    />
    <text
      v-if="showLabel && fontSize > 0"
      :transform="`rotate(${labelRotation})`"
      :font-size="fontSize"
      text-anchor="middle"
      dominant-baseline="central"
      class="pointer-events-none fill-black"
    >{{ stand.name }}</text>
    <template v-if="selected">
      <line :x1="0" :y1="-d / 2" :x2="0" :y2="-d / 2 - handleOffset" class="stroke-sky-700" stroke-width="2" vector-effect="non-scaling-stroke" />
      <circle
        :cx="0"
        :cy="-d / 2 - handleOffset"
        :r="handleRadius"
        class="cursor-grab fill-white stroke-sky-700"
        stroke-width="2"
        vector-effect="non-scaling-stroke"
        @pointerdown="onRotatePointerDown"
      />
    </template>
  </g>
</template>
