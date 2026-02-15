import { Card, Rating, Tray } from './types'

const DAY = 24 * 60 * 60 * 1000

export const defaultIntervals: Record<Tray, number> = {
  Frequent: 1 * DAY,
  Growing: 3 * DAY,
  Strong: 7 * DAY,
  Mastered: 30 * DAY
}

const promote: Record<Tray, Tray> = {
  Frequent: 'Growing',
  Growing: 'Strong',
  Strong: 'Mastered',
  Mastered: 'Mastered'
}

export const applyRating = (card: Card, rating: Rating, now = Date.now(), intervals = defaultIntervals): Card => {
  if (rating === 'missed') {
    return {
      ...card,
      tray: 'Frequent',
      dueAt: now + 10 * 60 * 1000,
      lapses: card.lapses + 1,
      streak: 0,
      isNew: false
    }
  }

  if (rating === 'slow') {
    const slowDelay = card.tray === 'Frequent' ? 12 * 60 * 60 * 1000 : Math.min(intervals[card.tray], DAY)
    return {
      ...card,
      dueAt: now + slowDelay,
      streak: card.streak + 1,
      isNew: false
    }
  }

  const nextTray = promote[card.tray]
  return {
    ...card,
    tray: nextTray,
    dueAt: now + intervals[nextTray],
    streak: card.streak + 1,
    isNew: false
  }
}
