import { Card, Stage } from './types'

const now = Date.now()

const card = (partial: Partial<Card> & Pick<Card, 'id' | 'prompt' | 'stage' | 'type'>): Card => ({
  answer: '',
  tip: '',
  graphemes: [],
  tray: 'Frequent',
  dueAt: now,
  lapses: 0,
  streak: 0,
  isNew: true,
  ...partial
})

export const starterCards: Card[] = [
  card({ id: 's0-rhyme', stage: 0, type: 'PrePhonicsCard', prompt: 'Find two words that rhyme: cat / hat / sun', tip: 'Celebrate any try.' }),
  card({ id: 's0-first-sound', stage: 0, type: 'PrePhonicsCard', prompt: 'What is the first sound in “sun”?', tip: 'Use pure sounds.' }),
  card({ id: 's0-blend', stage: 0, type: 'PrePhonicsCard', prompt: 'Blend orally: c-a-t', tip: 'Pause then blend smoothly.' }),
  card({ id: 's0-segment', stage: 0, type: 'PrePhonicsCard', prompt: 'Segment “dog” into sounds', tip: 'Tap each sound.' }),
  card({ id: 's0-listen', stage: 0, type: 'PrePhonicsCard', prompt: 'Which word starts with /s/: sun or moon?' }),
  card({ id: 's0-clap', stage: 0, type: 'PrePhonicsCard', prompt: 'Clap syllables: di-no-saur' }),
  card({ id: 's0-alliteration', stage: 0, type: 'PrePhonicsCard', prompt: 'Think of a silly /m/ sentence' }),
  card({ id: 's0-odd-one', stage: 0, type: 'PrePhonicsCard', prompt: 'Odd one out: sock, sun, pig' }),

  ...['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o', 'c', 'k', 'e', 'u', 'r'].map((g) =>
    card({
      id: `s1-${g}`,
      stage: 1,
      type: 'SoundCard',
      prompt: g,
      answer: `Say pure sound for ${g}`,
      tip: 'Avoid adding “uh” to consonants.'
    })
  ),

  ...['sat', 'pat', 'tap', 'pin', 'nap', 'sit', 'pit', 'tip'].map((w) =>
    card({
      id: `s1-word-${w}`,
      stage: 1,
      type: 'DecodableWordCard',
      prompt: w,
      answer: w.split('').join('-'),
      graphemes: w.split('')
    })
  ),

  ...['sh', 'ch', 'th', 'ng', 'ai', 'ee', 'igh', 'oa', 'oo'].map((g) =>
    card({
      id: `s2-${g}`,
      stage: 2,
      type: 'DigraphCard',
      prompt: g,
      answer: `Say sound for ${g}`,
      graphemes: [g]
    })
  ),

  ...['the', 'to', 'no', 'go', 'I', 'into'].map((w) =>
    card({
      id: `s4-tricky-${w}`,
      stage: 4,
      type: 'TrickyWordCard',
      prompt: w,
      answer: 'Explain tricky part.',
      isTricky: true
    })
  )
]

export const stageNames: Record<Stage, string> = {
  0: 'Stage 0: Pre-phonics',
  1: 'Stage 1: Single sounds',
  2: 'Stage 2: Digraphs',
  3: 'Stage 3: Decodable words',
  4: 'Stage 4: Tricky words'
}
