import { Card, Stage } from './types'

export const strongMasteredRatio = (cards: Card[], stage: Stage): number => {
  const stageCards = cards.filter((c) => c.stage === stage)
  if (!stageCards.length) return 0
  const mastered = stageCards.filter((c) => c.tray === 'Strong' || c.tray === 'Mastered').length
  return mastered / stageCards.length
}

export const computeUnlockedStage = (cards: Card[], blendConfirmed: boolean): Stage => {
  const stage1Ok = strongMasteredRatio(cards, 1) >= 0.8 && blendConfirmed
  const stage2Ok = strongMasteredRatio(cards, 2) >= 0.7

  if (stage1Ok && stage2Ok) return 3
  if (stage1Ok) return 2
  return 1
}

export const canUseWholeWordCard = (stage: Stage, isTricky: boolean): boolean => {
  if (stage <= 2 && !isTricky) return false
  return true
}
