import { newId, type Project } from '../model'
import { loadImage, saveImage } from './images'
import { normalizeProject } from './serialization'
import { encodeTransfer, parseTransfer, transferFileName } from './transferFormat'

/** Serializes a project and its stored image into a `.marktplan` file and triggers a browser download. */
export async function exportProject(project: Project): Promise<void> {
  const image = await loadImage(project.id)
  if (!image) throw new Error('Das Kartenbild dieses Projekts wurde nicht gefunden.')
  const json = encodeTransfer(project, image.type || project.image.type, await blobToBase64(image))
  download(new Blob([json], { type: 'application/json' }), transferFileName(project.name))
}

/**
 * Reads a `.marktplan` file, stores its image and returns the project under a fresh id.
 *
 * @param file the selected file
 * @return the imported project, not yet added to the project list
 * @throws Error with a user-facing message if the file cannot be imported
 */
export async function importProject(file: File): Promise<Project> {
  const { project, image } = parseTransfer(await file.text())
  const id = newId()
  await saveImage(id, base64ToBlob(image.base64, image.type))
  return normalizeProject({ ...project, id, image: { ...project.image, type: image.type } })
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const dataUrl = reader.result as string
      resolve(dataUrl.slice(dataUrl.indexOf(',') + 1))
    }
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string, type: string): Blob {
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type })
}

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
