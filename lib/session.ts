import { Card, SessionCard, Stage } from './types'

interface SessionOptions {
  now?: number
  length: number
  maxNewCards: number
  unlockedStage: Stage
  maxDailyDue: number
}

export const selectSessionCards = (cards: Card[], options: SessionOptions): SessionCard[] => {
  const now = options.now ?? Date.now()
  const due = cards.filter((c) => c.dueAt <= now).slice(0, options.maxDailyDue)

  const winsStart = due
    .filter((c) => c.tray === 'Strong' || c.tray === 'Mastered')
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 3)

  const fallbackWins = due
    .filter((c) => c.tray === 'Growing')
    .sort((a, b) => b.streak - a.streak)
    .slice(0, Math.max(0, 3 - winsStart.length))

  const start = [...winsStart, ...fallbackWins]
  const selectedIds = new Set(start.map((c) => c.id))

  const reviewPool = due
    .filter((c) => !selectedIds.has(c.id) && (c.tray === 'Frequent' || c.tray === 'Growing'))
    .slice(0, Math.max(0, options.length - 1))

  reviewPool.forEach((c) => selectedIds.add(c.id))

  const newCards = cards
    .filter((c) => c.isNew && c.stage <= options.unlockedStage && !selectedIds.has(c.id))
    .slice(0, Math.min(2, options.maxNewCards))

  newCards.forEach((c) => selectedIds.add(c.id))

  const endWin =
    due.find((c) => !selectedIds.has(c.id) && (c.tray === 'Strong' || c.tray === 'Mastered')) ||
    start[start.length - 1]

  const core = [...start, ...reviewPool, ...newCards]
    .slice(0, Math.max(0, options.length - 1))
    .map((c): SessionCard => ({ ...c, source: c.isNew ? 'new' : 'review' }))

  if (endWin) {
    core.push({ ...endWin, source: 'win' })
  }

  return core
}
