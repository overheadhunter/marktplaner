<script setup lang="ts">
import { computed } from 'vue'
import { DEFAULT_COLOR, standClasses } from '../colors'
import type { Point, Stand } from '../model'
import { compareNumbers } from '../numbering'

// rendered inside the map SVG: anchored by its bottom-right corner in image coordinates, counter-scaled so it keeps a constant on-screen size
const props = defineProps<{
  stands: Stand[]
  numbers: Map<string, string>
  /** bottom-right corner in image px */
  position: Point
  /** screen px per image px */
  scale: number
  toImage: (clientX: number, clientY: number) => Point
}>()
const emit = defineEmits<{ 'update:position': [position: Point] }>()

// generous box for the foreignObject; the legend itself is anchored to its bottom-right corner
const BOX = 400

const entries = computed(() =>
  props.stands
    .map((s) => ({ id: s.id, number: props.numbers.get(s.id) ?? '', name: s.name, swatch: standClasses(s.color ?? DEFAULT_COLOR, false).swatch }))
    .sort((a, b) => compareNumbers(a.number, b.number)),
)

const transform = computed(() => `translate(${props.position.x} ${props.position.y}) scale(${1 / props.scale})`)

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  e.stopPropagation()
  e.preventDefault()
  const el = e.currentTarget as HTMLElement
  const start = props.toImage(e.clientX, e.clientY)
  const origin = { ...props.position }
  const onMove = (ev: PointerEvent) => {
    const p = props.toImage(ev.clientX, ev.clientY)
    emit('update:position', { x: origin.x + (p.x - start.x), y: origin.y + (p.y - start.y) })
  }
  const onUp = () => {
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerup', onUp)
    el.removeEventListener('pointercancel', onUp)
  }
  el.setPointerCapture(e.pointerId)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)
}
</script>

<template>
  <g :transform="transform">
    <foreignObject :x="-BOX" :y="-BOX" :width="BOX" :height="BOX" style="overflow: visible">
      <div
        class="absolute right-0 bottom-0 max-h-96 max-w-64 cursor-move touch-none overflow-y-auto rounded-lg border border-neutral-300 bg-white/95 p-3 text-sm shadow-lg select-none print:max-h-none print:bg-white print:shadow-none"
        @pointerdown="onPointerDown"
      >
        <h3 class="mb-2 font-semibold">Legende</h3>
        <ul class="space-y-1">
          <li v-for="e in entries" :key="e.id" class="flex items-center gap-2">
            <span class="flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" :class="e.swatch">{{ e.number }}</span>
            <span class="truncate">{{ e.name || 'Unbenannt' }}</span>
          </li>
          <li v-if="entries.length === 0" class="text-neutral-400 italic">Keine Stände auf der Karte</li>
        </ul>
      </div>
    </foreignObject>
  </g>
</template>
