import { describe, expect, it } from 'vitest'
import type { Project } from '../model'
import { deserialize, serialize } from './serialization'

const project: Project = {
  id: '1',
  name: 'Test',
  createdAt: '2026-08-28T00:00:00.000Z',
  image: { width: 100, height: 50, type: 'image/png' },
  reference: { a: { x: 0, y: 0 }, b: { x: 10, y: 0 }, meters: 1 },
  labelMode: 'names',
  stands: [{ id: 's', name: 'A', notes: 'n', width: 3, depth: 2, placement: { x: 5, y: 5, angle: 30 } }],
}

describe('project serialization', () => {
  it('round-trips', () => {
    expect(deserialize(serialize([project]))).toEqual([project])
  })
  it('tolerates garbage', () => {
    expect(deserialize(null)).toEqual([])
    expect(deserialize('{')).toEqual([])
    expect(deserialize('{"a":1}')).toEqual([])
  })
})
