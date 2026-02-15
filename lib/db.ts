import Dexie, { Table } from 'dexie'
import { starterCards } from './content'
import { ChildProfile, ChildSettings, Card } from './types'
import { defaultIntervals } from './srs'

export interface StoredCard extends Card {
  childId: string
}

const defaultSettings: ChildSettings = {
  sessionLength: 10,
  maxNewCards: 2,
  maxDailyDue: 20,
  intervals: defaultIntervals,
  soundsEnabled: false
}

export class TrayLearnDB extends Dexie {
  children!: Table<ChildProfile, string>
  cards!: Table<StoredCard, string>

  constructor() {
    super('traylearn')
    this.version(1).stores({
      children: 'id, name, createdAt',
      cards: 'id, childId, stage, tray, dueAt'
    })
  }
}

export const db = new TrayLearnDB()

export const ensureDemoData = async () => {
  const count = await db.children.count()
  if (count > 0) return

  const child: ChildProfile = {
    id: 'demo-child',
    name: 'Sam',
    age: 5,
    createdAt: Date.now(),
    unlockedStage: 1,
    blendConfirmed: false,
    stickers: 0,
    settings: defaultSettings
  }

  await db.children.add(child)
  await db.cards.bulkAdd(starterCards.map((card) => ({ ...card, childId: child.id })))
}

export const createChild = async (name: string, age: number) => {
  const id = `child-${crypto.randomUUID()}`
  const child: ChildProfile = {
    id,
    name,
    age,
    createdAt: Date.now(),
    unlockedStage: 1,
    blendConfirmed: false,
    stickers: 0,
    settings: defaultSettings
  }
  await db.children.add(child)
  await db.cards.bulkAdd(starterCards.map((card) => ({ ...card, id: `${id}-${card.id}`, childId: id })))
}
