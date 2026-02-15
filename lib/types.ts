export type Tray = 'Frequent' | 'Growing' | 'Strong' | 'Mastered'
export type Stage = 0 | 1 | 2 | 3 | 4

export type CardType =
  | 'PrePhonicsCard'
  | 'SoundCard'
  | 'DigraphCard'
  | 'DecodableWordCard'
  | 'TrickyWordCard'

export interface Card {
  id: string
  stage: Stage
  type: CardType
  prompt: string
  answer?: string
  tip?: string
  graphemes?: string[]
  tray: Tray
  dueAt: number
  lapses: number
  streak: number
  isNew?: boolean
  custom?: boolean
  isTricky?: boolean
}

export interface ChildProfile {
  id: string
  name: string
  age: number
  createdAt: number
  unlockedStage: Stage
  blendConfirmed: boolean
  stickers: number
  settings: ChildSettings
}

export interface ChildSettings {
  sessionLength: number
  maxNewCards: number
  maxDailyDue: number
  intervals: Record<Tray, number>
  soundsEnabled: boolean
}

export interface SessionCard extends Card {
  source: 'review' | 'new' | 'win'
}

export type Rating = 'fast' | 'slow' | 'missed'

export interface ReviewEvent {
  cardId: string
  rating: Rating
  at: number
}
