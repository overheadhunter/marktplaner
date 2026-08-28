<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import CalibrationPanel from '../components/CalibrationPanel.vue'
import MapCanvas, { type Calibration } from '../components/MapCanvas.vue'
import { newId, type Project } from '../model'
import { saveImage } from '../store/images'
import { useProjects } from '../store/projects'

const router = useRouter()
const { add } = useProjects()

const name = ref('')
const file = ref<File>()
const imageSize = ref<{ width: number; height: number }>()
const imageUrl = ref<string>()
const step = ref<1 | 2>(1)
const calibration = ref<Calibration>({})
const meters = ref(0)
const error = ref('')

async function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  error.value = ''
  try {
    const bmp = await createImageBitmap(f)
    imageSize.value = { width: bmp.width, height: bmp.height }
    bmp.close()
    if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = URL.createObjectURL(f)
    file.value = f
  } catch {
    error.value = 'Bild konnte nicht gelesen werden.'
    file.value = undefined
  }
}

const canContinue = computed(() => name.value.trim().length > 0 && !!file.value && !!imageSize.value)
const canCreate = computed(() => !!calibration.value.a && !!calibration.value.b && meters.value > 0)

async function create() {
  if (!canCreate.value || !file.value || !imageSize.value) return
  const id = newId()
  await saveImage(id, file.value)
  const project: Project = {
    id,
    name: name.value.trim(),
    createdAt: new Date().toISOString(),
    image: { ...imageSize.value, type: file.value.type },
    reference: { a: calibration.value.a!, b: calibration.value.b!, meters: meters.value },
    showLabels: true,
    stands: [],
  }
  add(project)
  await router.push(`/p/${id}`)
}

onBeforeUnmount(() => {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
})
</script>

<template>
  <main v-if="step === 1" class="mx-auto max-w-lg p-6">
    <h1 class="mb-6 text-2xl font-bold">Neues Projekt</h1>
    <form class="space-y-4" @submit.prevent="step = 2">
      <label class="block">
        <span class="text-sm text-neutral-600">Name</span>
        <input v-model="name" type="text" required class="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-sky-500 focus:outline-none" />
      </label>
      <label class="block">
        <span class="text-sm text-neutral-600">Karte</span>
        <input type="file" accept="image/*" required class="mt-1 block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-neutral-200 file:px-3 file:py-1.5" @change="onFile" />
        <span v-if="imageSize" class="mt-1 block text-xs text-neutral-500">{{ imageSize.width }} × {{ imageSize.height }} px</span>
      </label>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <div class="flex gap-3 pt-2">
        <RouterLink to="/" class="rounded px-4 py-2 text-neutral-600 hover:bg-neutral-100">Abbrechen</RouterLink>
        <button type="submit" :disabled="!canContinue" class="ml-auto rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 disabled:opacity-40">Weiter: Maßstab</button>
      </div>
    </form>
  </main>

  <div v-else-if="imageSize" class="grid h-screen grid-cols-3 overflow-hidden">
    <div class="col-span-2 min-h-0 h-full">
      <MapCanvas :image-url="imageUrl" :image-size="imageSize" mode="calibrate" :calibration="calibration" @update:calibration="calibration = $event" />
    </div>
    <aside class="flex h-full min-h-0 flex-col overflow-y-auto border-l border-neutral-200 bg-neutral-50 p-4">
      <h1 class="text-xl font-bold">{{ name }}</h1>
      <h2 class="mt-4 mb-3 font-semibold">Maßstab festlegen</h2>
      <CalibrationPanel :calibration="calibration" :meters="meters" @update:meters="meters = $event" @reset="calibration = {}; meters = 0" />
      <div class="mt-auto flex gap-3 pt-4">
        <button type="button" class="rounded px-4 py-2 text-neutral-600 hover:bg-neutral-200" @click="step = 1">Zurück</button>
        <button type="button" :disabled="!canCreate" class="ml-auto rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 disabled:opacity-40" @click="create">Projekt anlegen</button>
      </div>
    </aside>
  </div>
</template>
