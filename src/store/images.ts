import { del, get, set } from 'idb-keyval'
import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

const key = (projectId: string) => `image:${projectId}`

export function saveImage(projectId: string, blob: Blob): Promise<void> {
  return set(key(projectId), blob)
}

export function loadImage(projectId: string): Promise<Blob | undefined> {
  return get<Blob>(key(projectId))
}

export function deleteImage(projectId: string): Promise<void> {
  return del(key(projectId))
}

/** Object URL for a project's stored image; revoked automatically when the component unmounts. */
export function useImageUrl(projectId: Ref<string | undefined>): Ref<string | undefined> {
  const url = ref<string>()
  const revoke = () => {
    if (url.value) URL.revokeObjectURL(url.value)
    url.value = undefined
  }
  watch(
    projectId,
    async (id) => {
      revoke()
      if (!id) return
      const blob = await loadImage(id)
      if (blob && projectId.value === id) url.value = URL.createObjectURL(blob)
    },
    { immediate: true },
  )
  onBeforeUnmount(revoke)
  return url
}
