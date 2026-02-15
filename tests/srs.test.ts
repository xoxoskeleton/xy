import { describe, expect, it } from 'vitest'
import { applyRating } from '../lib/srs'
import { Card } from '../lib/types'

const baseCard: Card = {
  id: '1',
  stage: 1,
  type: 'SoundCard',
  prompt: 's',
  tray: 'Frequent',
  dueAt: 0,
  lapses: 0,
  streak: 0
}

describe('applyRating', () => {
  it('promotes on fast', () => {
    const updated = applyRating(baseCard, 'fast', 1000)
    expect(updated.tray).toBe('Growing')
    expect(updated.dueAt).toBeGreaterThan(1000)
  })

  it('keeps tray on slow and schedules sooner', () => {
    const updated = applyRating(baseCard, 'slow', 1000)
    expect(updated.tray).toBe('Frequent')
    expect(updated.dueAt).toBe(1000 + 12 * 60 * 60 * 1000)
  })

  it('demotes to frequent on missed', () => {
    const strongCard = { ...baseCard, tray: 'Strong' as const }
    const updated = applyRating(strongCard, 'missed', 1000)
    expect(updated.tray).toBe('Frequent')
    expect(updated.lapses).toBe(1)
  })
})
