import { describe, expect, it } from 'vitest'
import type { Project } from '../model'
import { encodeTransfer, parseTransfer, transferFileName } from './transferFormat'

const project: Project = {
  id: '1',
  name: 'Test',
  createdAt: '2026-08-28T00:00:00.000Z',
  image: { width: 100, height: 50, type: 'image/png' },
  reference: { a: { x: 0, y: 0 }, b: { x: 10, y: 0 }, meters: 1 },
  labelMode: 'names',
  stands: [{ id: 's', name: 'A', notes: '', width: 3, depth: 2, placement: null, color: 'teal' }],
}

describe('transfer format', () => {
  it('round-trips project and image', () => {
    const parsed = parseTransfer(encodeTransfer(project, 'image/png', 'AAAA'))
    expect(parsed.project).toEqual(project)
    expect(parsed.image).toEqual({ type: 'image/png', base64: 'AAAA' })
  })

  it('rejects foreign or broken files', () => {
    expect(() => parseTransfer('nope')).toThrow('JSON')
    expect(() => parseTransfer('{"format":"other"}')).toThrow('keine Marktplaner-Datei')
    expect(() => parseTransfer('{"format":"marktplaner","version":99}')).toThrow('Dateiversion')
    expect(() => parseTransfer('{"format":"marktplaner","version":1,"project":{},"image":{}}')).toThrow('unvollständig')
    expect(() => parseTransfer(JSON.stringify({ format: 'marktplaner', version: 1, project, image: {} }))).toThrow('Kartenbild')
  })

  it('builds a safe file name', () => {
    expect(transferFileName('Weihnachtsmarkt 2026')).toBe('Weihnachtsmarkt 2026.marktplan')
    expect(transferFileName('a/b:c')).toBe('a_b_c.marktplan')
    expect(transferFileName('  ')).toBe('projekt.marktplan')
  })
})
