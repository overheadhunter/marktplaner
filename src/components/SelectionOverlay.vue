<script setup lang="ts">
import type { Stand } from '../model'

defineProps<{ stand: Stand }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div class="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4">
    <div class="pointer-events-auto w-full max-w-xl rounded-xl border border-neutral-200 bg-white/95 p-4 shadow-lg backdrop-blur">
      <div class="flex items-start gap-3">
        <div class="min-w-0 flex-1">
          <h3 class="truncate text-lg font-semibold">{{ stand.name || 'Unbenannt' }}</h3>
          <p class="text-xs text-neutral-500">{{ stand.width.toFixed(2) }} m × {{ stand.depth.toFixed(2) }} m</p>
          <p v-if="stand.notes" class="mt-2 text-sm whitespace-pre-wrap text-neutral-700">{{ stand.notes }}</p>
          <p v-else class="mt-2 text-sm text-neutral-400 italic">Keine Notizen</p>
        </div>
        <button type="button" class="rounded px-2 text-neutral-500 hover:bg-neutral-100" title="Auswahl aufheben (Esc)" @click="emit('close')">✕</button>
      </div>
    </div>
  </div>
</template>
