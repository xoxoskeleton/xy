import { describe, expect, it } from 'vitest'
import { selectSessionCards } from '../lib/session'
import { Card } from '../lib/types'

const make = (id: string, tray: Card['tray'], isNew = false): Card => ({
  id,
  stage: 1,
  type: 'SoundCard',
  prompt: id,
  tray,
  dueAt: 0,
  lapses: 0,
  streak: tray === 'Strong' ? 5 : 1,
  isNew
})

describe('selectSessionCards', () => {
  it('starts with three win cards and ends on win', () => {
    const cards = [make('a', 'Strong'), make('b', 'Mastered'), make('c', 'Strong'), make('d', 'Frequent'), make('e', 'Growing')]
    const session = selectSessionCards(cards, { length: 5, maxDailyDue: 20, maxNewCards: 0, unlockedStage: 1, now: 1 })
    expect(session.slice(0, 3).every((c) => c.tray === 'Strong' || c.tray === 'Mastered')).toBe(true)
    const last = session[session.length - 1]
    expect(last.tray === 'Strong' || last.tray === 'Mastered').toBe(true)
  })

  it('honors daily due cap', () => {
    const cards = Array.from({ length: 30 }).map((_, i) => make(String(i), 'Frequent'))
    const session = selectSessionCards(cards, { length: 10, maxDailyDue: 5, maxNewCards: 0, unlockedStage: 1, now: 1 })
    expect(session.length).toBeLessThanOrEqual(5)
  })
})
