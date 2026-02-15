import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureDemoData, createChild } from '../lib/db'
import { CardType, Rating } from '../lib/types'
import { applyRating } from '../lib/srs'
import { computeUnlockedStage, strongMasteredRatio, canUseWholeWordCard } from '../lib/gating'
import { selectSessionCards } from '../lib/session'
import { stageNames } from '../lib/content'

const mascotMessage = {
  idle: 'Ready to play a 5-minute reading game?',
  fast: 'Brilliant blending! 🎉',
  slow: 'Nice effort. We can go gently.',
  missed: 'That is okay. Let’s try again soon.'
}

export default function Home() {
  const [activeChildId, setActiveChildId] = useState<string>('')
  const [mode, setMode] = useState<'dashboard' | 'session'>('dashboard')
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [mascot, setMascot] = useState<keyof typeof mascotMessage>('idle')
  const [celebrated, setCelebrated] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAge, setNewAge] = useState(5)
  const [customPrompt, setCustomPrompt] = useState('')
  const [customStage, setCustomStage] = useState(1)
  const [customType, setCustomType] = useState<CardType>('SoundCard')
  const [customTricky, setCustomTricky] = useState(false)

  const childrenQuery = useLiveQuery(() => db.children.toArray(), [])
  const children = useMemo(() => childrenQuery ?? [], [childrenQuery])
  const activeChild = children.find((c) => c.id === activeChildId) ?? children[0]
  const cardsQuery = useLiveQuery(() => (activeChild ? db.cards.where('childId').equals(activeChild.id).toArray() : []), [activeChild?.id])
  const cards = useMemo(() => cardsQuery ?? [], [cardsQuery])

  useEffect(() => {
    ensureDemoData()
  }, [])

  useEffect(() => {
    if (!activeChildId && children[0]) setActiveChildId(children[0].id)
  }, [children, activeChildId])

  const sessionCards = useMemo(() => {
    if (!activeChild) return []
    return selectSessionCards(cards, {
      length: activeChild.settings.sessionLength,
      maxNewCards: activeChild.settings.maxNewCards,
      maxDailyDue: activeChild.settings.maxDailyDue,
      unlockedStage: activeChild.unlockedStage
    })
  }, [cards, activeChild])

  const currentCard = sessionCards[cardIndex]

  const runRating = async (rating: Rating) => {
    if (!activeChild || !currentCard) return
    const sourceCard = cards.find((c) => c.id === currentCard.id)
    if (!sourceCard) return
    const updated = applyRating(sourceCard, rating, Date.now(), activeChild.settings.intervals)
    await db.cards.put({ ...sourceCard, ...updated })
    setMascot(rating === 'fast' ? 'fast' : rating === 'slow' ? 'slow' : 'missed')

    if (cardIndex >= sessionCards.length - 1) {
      if (!celebrated) {
        setCelebrated(true)
        await db.children.update(activeChild.id, { stickers: activeChild.stickers + 1 })
      }
      setMode('dashboard')
      setCardIndex(0)
      return
    }
    setCardIndex((i) => i + 1)
    setFlipped(false)
  }

  const saveReadiness = async (blendConfirmed: boolean) => {
    if (!activeChild) return
    const unlockedStage = computeUnlockedStage(cards, blendConfirmed)
    await db.children.update(activeChild.id, { blendConfirmed, unlockedStage })
  }

  const addCustomCard = async () => {
    if (!activeChild || !customPrompt.trim()) return
    if (!canUseWholeWordCard(customStage as 0 | 1 | 2 | 3 | 4, customTricky)) {
      alert('Whole-word cards are blocked in Stage 1/2 unless marked as tricky (Stage 4).')
      return
    }
    await db.cards.add({
      id: `${activeChild.id}-custom-${crypto.randomUUID()}`,
      childId: activeChild.id,
      stage: customStage as 0 | 1 | 2 | 3 | 4,
      type: customType,
      prompt: customPrompt,
      answer: '',
      tray: 'Frequent',
      dueAt: Date.now(),
      lapses: 0,
      streak: 0,
      isNew: true,
      custom: true,
      isTricky: customTricky
    })
    setCustomPrompt('')
  }

  const exportJson = async () => {
    if (!activeChild) return
    const payload = { child: activeChild, cards }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeChild.name}-traylearn-export.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Head>
        <title>TrayLearn</title>
      </Head>
      <main className="mx-auto max-w-5xl p-4 md:p-8">
        <h1 className="text-3xl font-bold">TrayLearn</h1>
        <p className="mb-4 text-slate-600">Mastery-first UK phonics practice: short sessions, low pressure, no streak guilt.</p>

        <section className="mb-4 rounded-xl bg-white p-4 shadow">
          <h2 className="font-semibold">In 60 seconds</h2>
          <p className="text-sm text-slate-600">Start with easy wins, review due cards, add at most two new cards, and always end on a win. Missed days are fine.</p>
        </section>

        <section className="mb-4 rounded-xl bg-white p-4 shadow">
          <h2 className="font-semibold">Child Profiles</h2>
          <div className="my-2 flex flex-wrap gap-2">
            {children.map((child) => (
              <button key={child.id} onClick={() => setActiveChildId(child.id)} className={`rounded-lg px-3 py-2 ${activeChild?.id === child.id ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>
                {child.name} ({child.age})
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="rounded border p-2" placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <input className="w-20 rounded border p-2" type="number" value={newAge} onChange={(e) => setNewAge(Number(e.target.value))} />
            <button className="rounded bg-slate-900 px-3 py-2 text-white" onClick={async () => newName && createChild(newName, newAge)}>Add child</button>
          </div>
        </section>

        {activeChild && mode === 'dashboard' && (
          <div className="space-y-4">
            <section className="rounded-xl bg-white p-4 shadow">
              <h2 className="font-semibold">Dashboard: {activeChild.name}</h2>
              <p>Due cards today: {cards.filter((c) => c.dueAt <= Date.now()).length}</p>
              <p>Unlocked: {stageNames[activeChild.unlockedStage]}</p>
              <p>Sticker book: {activeChild.stickers} stickers ⭐</p>
              <button className="mt-3 rounded bg-emerald-600 px-4 py-2 text-white" onClick={() => { setMode('session'); setCardIndex(0); setCelebrated(false); setMascot('idle') }}>
                Start 5-minute session
              </button>
            </section>

            <section className="rounded-xl bg-white p-4 shadow">
              <h2 className="font-semibold">Readiness & stage gating</h2>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={activeChild.blendConfirmed} onChange={(e) => saveReadiness(e.target.checked)} />
                Parent confirms child can blend c-a-t.
              </label>
              <p className="text-sm">Stage 1 mastery: {(strongMasteredRatio(cards, 1) * 100).toFixed(0)}% (need 80% + blend check).</p>
              <p className="text-sm">Stage 2 mastery: {(strongMasteredRatio(cards, 2) * 100).toFixed(0)}% (need 70%).</p>
              <p className="mt-2 text-xs text-slate-600">Tip: model consonants without adding “uh” (mmmm not muh).</p>
            </section>

            <section className="rounded-xl bg-white p-4 shadow">
              <h2 className="font-semibold">Insights</h2>
              <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                {['Frequent', 'Growing', 'Strong', 'Mastered'].map((tray) => (
                  <div key={tray} className="rounded bg-slate-100 p-2">{tray}: {cards.filter((c) => c.tray === tray).length}</div>
                ))}
              </div>
              <p className="mt-2 text-xs">Archive suggestion appears when most cards are Mastered.</p>
            </section>

            <section className="rounded-xl bg-white p-4 shadow">
              <h2 className="font-semibold">Custom card creator</h2>
              <p className="text-xs text-slate-600">Stage 1/2 whole-word cards are blocked unless tricky (Stage 4 only).</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input className="rounded border p-2" value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Prompt" />
                <select className="rounded border p-2" value={customStage} onChange={(e) => setCustomStage(Number(e.target.value))}>
                  {[0,1,2,3,4].map((s)=><option key={s} value={s}>Stage {s}</option>)}
                </select>
                <select className="rounded border p-2" value={customType} onChange={(e) => setCustomType(e.target.value as CardType)}>
                  {['PrePhonicsCard','SoundCard','DigraphCard','DecodableWordCard','TrickyWordCard'].map((t)=><option key={t}>{t}</option>)}
                </select>
                <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={customTricky} onChange={(e)=>setCustomTricky(e.target.checked)} />Mark tricky</label>
                <button className="rounded bg-indigo-600 px-3 py-2 text-white" onClick={addCustomCard}>Add card</button>
              </div>
            </section>

            <section className="rounded-xl bg-white p-4 shadow">
              <h2 className="font-semibold">Settings & backup</h2>
              <div className="flex flex-wrap gap-3 text-sm">
                <label>Session length <input type="number" className="ml-1 w-16 rounded border p-1" value={activeChild.settings.sessionLength} onChange={(e)=>db.children.update(activeChild.id, { settings: { ...activeChild.settings, sessionLength: Number(e.target.value) } })} /></label>
                <label>Max new <input type="number" className="ml-1 w-16 rounded border p-1" value={activeChild.settings.maxNewCards} onChange={(e)=>db.children.update(activeChild.id, { settings: { ...activeChild.settings, maxNewCards: Number(e.target.value) } })} /></label>
                <label>Sound effects <input type="checkbox" className="ml-1" checked={activeChild.settings.soundsEnabled} onChange={(e)=>db.children.update(activeChild.id, { settings: { ...activeChild.settings, soundsEnabled: e.target.checked } })} /></label>
                <button className="rounded bg-slate-800 px-3 py-1 text-white" onClick={exportJson}>Export JSON</button>
                <button className="rounded border px-3 py-1" onClick={() => window.print()}>Printable deck</button>
              </div>
            </section>
          </div>
        )}

        {mode === 'session' && activeChild && currentCard && (
          <section className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-3 text-sm">Child mode • Card {cardIndex + 1}/{sessionCards.length} • End on a win enabled</div>
            <div className="mb-2 h-2 w-full rounded bg-slate-200">
              <div className="h-2 rounded bg-indigo-600" style={{ width: `${((cardIndex + 1) / sessionCards.length) * 100}%` }} />
            </div>

            <div className="mb-4 rounded-xl bg-slate-100 p-8 text-center text-4xl font-bold" onClick={() => setFlipped((f) => !f)}>
              {flipped ? currentCard.answer || currentCard.tip || 'Great try!' : currentCard.prompt}
            </div>

            <div className="mb-4 flex justify-center gap-2">
              <button className="rounded bg-emerald-500 px-4 py-3 text-white" onClick={() => runRating('fast')}>Got it fast</button>
              <button className="rounded bg-amber-500 px-4 py-3 text-white" onClick={() => runRating('slow')}>Got it slow</button>
              <button className="rounded bg-rose-500 px-4 py-3 text-white" onClick={() => runRating('missed')}>Missed</button>
            </div>

            <div className="rounded-xl bg-indigo-50 p-3 text-center">
              <div className="mx-auto mb-1 h-14 w-14 rounded-full bg-indigo-300" />
              <p>{mascotMessage[mascot]}</p>
              {celebrated && <p className="mt-1">🎊 Session sticker earned!</p>}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
