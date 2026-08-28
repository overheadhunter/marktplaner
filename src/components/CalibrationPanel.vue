<script setup lang="ts">
import { computed } from 'vue'
import type { Calibration } from './MapCanvas.vue'
import { distance, formatMeters } from '../geometry'

const props = defineProps<{ calibration: Calibration; meters: number }>()
const emit = defineEmits<{ 'update:meters': [m: number]; reset: [] }>()

const pixels = computed(() => (props.calibration.a && props.calibration.b ? distance(props.calibration.a, props.calibration.b) : 0))
const step = computed(() => (!props.calibration.a ? 1 : !props.calibration.b ? 2 : 3))

function onInput(e: Event) {
  const v = Number.parseFloat((e.target as HTMLInputElement).value)
  emit('update:meters', Number.isFinite(v) ? Math.round(v * 100) / 100 : 0)
}
</script>

<template>
  <div class="space-y-4">
    <ol class="space-y-2 text-sm">
      <li :class="step === 1 ? 'font-semibold' : 'text-neutral-500'">1. Ersten Referenzpunkt auf der Karte anklicken {{ calibration.a ? '✓' : '' }}</li>
      <li :class="step === 2 ? 'font-semibold' : 'text-neutral-500'">2. Zweiten Referenzpunkt anklicken {{ calibration.b ? '✓' : '' }}</li>
      <li :class="step === 3 ? 'font-semibold' : 'text-neutral-500'">3. Tatsächliche Entfernung eingeben</li>
    </ol>
    <p class="text-xs text-neutral-500">Punkte können anschließend per Ziehen korrigiert werden. Mausrad zoomt, Ziehen auf der Karte verschiebt den Ausschnitt.</p>
    <label class="block text-sm">
      <span class="text-neutral-600">Entfernung</span>
      <div class="mt-1 flex items-center gap-2">
        <input :value="meters || ''" type="number" min="0.01" step="0.01" placeholder="0.00" :disabled="step < 3" class="w-32 rounded border border-neutral-300 px-2 py-1 text-right disabled:bg-neutral-100" @input="onInput" />
        <span>m</span>
      </div>
    </label>
    <p v-if="pixels > 0" class="text-xs text-neutral-500">
      {{ pixels.toFixed(1) }} px
      <template v-if="meters > 0">≙ {{ formatMeters(meters) }} → {{ (pixels / meters).toFixed(2) }} px/m</template>
    </p>
    <button type="button" class="text-sm text-neutral-500 underline hover:text-neutral-800" @click="emit('reset')">Punkte zurücksetzen</button>
  </div>
</template>
