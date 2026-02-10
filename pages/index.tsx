import type { NextPage } from "next";
import Head from "next/head";
import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "../styles/Home.module.css";

type WorkoutSet = {
  id: string;
  date: string;
  exercise: string;
  weightKg: number;
  reps: number;
  sets: number;
  est1RM: number;
};

type ExerciseSummary = {
  exercise: string;
  firstEst1RM: number;
  latestEst1RM: number;
  deltaKg: number;
  deltaPercent: number;
  percentile: number;
  topPercent: number;
  referenceMedian1RM: number;
};

type PercentilePoint = {
  percentile: number;
  oneRmKg: number;
};

type QuickLogForm = {
  date: string;
  exercise: string;
  weight: string;
  reps: string;
  sets: string;
  unit: "kg" | "lb";
};

const STORAGE_KEY = "strength-pulse-log";

const defaultLog = `2026-02-03
Squat 3x5 @ 95kg
Bench Press - 65kg x 8
Deadlift: 120kg x 4

2026-02-06
Squat 3x5 @ 100kg
Bench Press - 67.5kg x 8
Deadlift: 125kg x 4`;

// Approximate adult strength standards from publicly available aggregated lifting-standard charts,
// normalized to estimated 1RM in kg and mapped to percentile buckets.
const strengthPercentilesByExercise: Record<string, PercentilePoint[]> = {
  squat: [
    { percentile: 20, oneRmKg: 60 },
    { percentile: 40, oneRmKg: 90 },
    { percentile: 60, oneRmKg: 120 },
    { percentile: 75, oneRmKg: 145 },
    { percentile: 85, oneRmKg: 165 },
    { percentile: 93, oneRmKg: 190 },
    { percentile: 97, oneRmKg: 210 },
    { percentile: 99, oneRmKg: 230 },
  ],
  "bench press": [
    { percentile: 20, oneRmKg: 40 },
    { percentile: 40, oneRmKg: 60 },
    { percentile: 60, oneRmKg: 80 },
    { percentile: 75, oneRmKg: 100 },
    { percentile: 85, oneRmKg: 117.5 },
    { percentile: 93, oneRmKg: 135 },
    { percentile: 97, oneRmKg: 150 },
    { percentile: 99, oneRmKg: 165 },
  ],
  deadlift: [
    { percentile: 20, oneRmKg: 70 },
    { percentile: 40, oneRmKg: 105 },
    { percentile: 60, oneRmKg: 140 },
    { percentile: 75, oneRmKg: 175 },
    { percentile: 85, oneRmKg: 200 },
    { percentile: 93, oneRmKg: 225 },
    { percentile: 97, oneRmKg: 250 },
    { percentile: 99, oneRmKg: 280 },
  ],
  "overhead press": [
    { percentile: 20, oneRmKg: 25 },
    { percentile: 40, oneRmKg: 37.5 },
    { percentile: 60, oneRmKg: 50 },
    { percentile: 75, oneRmKg: 62.5 },
    { percentile: 85, oneRmKg: 72.5 },
    { percentile: 93, oneRmKg: 82.5 },
    { percentile: 97, oneRmKg: 92.5 },
    { percentile: 99, oneRmKg: 105 },
  ],
  row: [
    { percentile: 20, oneRmKg: 40 },
    { percentile: 40, oneRmKg: 60 },
    { percentile: 60, oneRmKg: 80 },
    { percentile: 75, oneRmKg: 100 },
    { percentile: 85, oneRmKg: 115 },
    { percentile: 93, oneRmKg: 130 },
    { percentile: 97, oneRmKg: 145 },
    { percentile: 99, oneRmKg: 160 },
  ],
  "romanian deadlift": [
    { percentile: 20, oneRmKg: 60 },
    { percentile: 40, oneRmKg: 90 },
    { percentile: 60, oneRmKg: 120 },
    { percentile: 75, oneRmKg: 150 },
    { percentile: 85, oneRmKg: 170 },
    { percentile: 93, oneRmKg: 190 },
    { percentile: 97, oneRmKg: 210 },
    { percentile: 99, oneRmKg: 230 },
  ],
};

const parseWorkoutText = (text: string): WorkoutSet[] => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let currentDate = new Date().toISOString().slice(0, 10);

  return lines.flatMap((line, index) => {
    const dateMatch = line.match(
      /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/
    );

    if (dateMatch) {
      currentDate = dateMatch[1].replace(/\//g, "-");
      return [];
    }

    const patternA = line.match(
      /^([a-zA-Z\s]+?)\s+(\d+)x(\d+)\s*@?\s*(\d+(?:\.\d+)?)\s*(kg|lb|lbs)?$/i
    );
    const patternB = line.match(
      /^([a-zA-Z\s]+?)\s*[-:]\s*(\d+(?:\.\d+)?)\s*(kg|lb|lbs)?\s*x\s*(\d+)$/i
    );

    const match = patternA ?? patternB;

    if (!match) {
      return [];
    }

    const exercise = match[1].trim().toLowerCase();
    const usesPatternA = Boolean(patternA);

    const sets = usesPatternA ? Number(match[2]) : 1;
    const reps = usesPatternA ? Number(match[3]) : Number(match[4]);
    const weightRaw = usesPatternA ? Number(match[4]) : Number(match[2]);
    const unit = (usesPatternA ? match[5] : match[3])?.toLowerCase() ?? "kg";

    const weightKg = unit.startsWith("lb") ? weightRaw * 0.453592 : weightRaw;
    const est1RM = weightKg * (1 + reps / 30);

    return [
      {
        id: `${currentDate}-${exercise}-${index}`,
        date: currentDate,
        exercise,
        weightKg,
        reps,
        sets,
        est1RM,
      },
    ];
  });
};

const prettifyExercise = (exercise: string) =>
  exercise.replace(/\b\w/g, (letter) => letter.toUpperCase());

const getStrengthReference = (exercise: string): PercentilePoint[] => {
  const found = Object.entries(strengthPercentilesByExercise).find(([name]) =>
    exercise.includes(name)
  );

  return (
    found?.[1] ?? [
      { percentile: 20, oneRmKg: 30 },
      { percentile: 40, oneRmKg: 45 },
      { percentile: 60, oneRmKg: 60 },
      { percentile: 75, oneRmKg: 75 },
      { percentile: 85, oneRmKg: 90 },
      { percentile: 93, oneRmKg: 105 },
      { percentile: 97, oneRmKg: 120 },
      { percentile: 99, oneRmKg: 135 },
    ]
  );
};

const estimatePercentile = (oneRmKg: number, points: PercentilePoint[]) => {
  const ordered = [...points].sort((a, b) => a.oneRmKg - b.oneRmKg);

  if (oneRmKg <= ordered[0].oneRmKg) {
    return ordered[0].percentile;
  }

  if (oneRmKg >= ordered[ordered.length - 1].oneRmKg) {
    return ordered[ordered.length - 1].percentile;
  }

  for (let index = 0; index < ordered.length - 1; index += 1) {
    const current = ordered[index];
    const next = ordered[index + 1];

    if (oneRmKg >= current.oneRmKg && oneRmKg <= next.oneRmKg) {
      const span = next.oneRmKg - current.oneRmKg;
      const ratio = span === 0 ? 0 : (oneRmKg - current.oneRmKg) / span;
      return current.percentile + ratio * (next.percentile - current.percentile);
    }
  }

  return 50;
};

const Home: NextPage = () => {
  const [rawLog, setRawLog] = useState(defaultLog);
  const [quickLog, setQuickLog] = useState<QuickLogForm>({
    date: new Date().toISOString().slice(0, 10),
    exercise: "",
    weight: "",
    reps: "5",
    sets: "3",
    unit: "kg",
  });

  useEffect(() => {
    const storedLog = window.localStorage.getItem(STORAGE_KEY);
    if (storedLog) {
      setRawLog(storedLog);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, rawLog);
  }, [rawLog]);

  const parsedSets = useMemo(() => parseWorkoutText(rawLog), [rawLog]);

  const summaries = useMemo<ExerciseSummary[]>(() => {
    const byExercise = parsedSets.reduce<Record<string, WorkoutSet[]>>((acc, set) => {
      if (!acc[set.exercise]) acc[set.exercise] = [];
      acc[set.exercise].push(set);
      return acc;
    }, {});

    return Object.entries(byExercise)
      .map(([exercise, sets]) => {
        const sorted = [...sets].sort((a, b) =>
          `${a.date}-${a.id}`.localeCompare(`${b.date}-${b.id}`)
        );

        const first = sorted[0]?.est1RM ?? 0;
        const latest = sorted[sorted.length - 1]?.est1RM ?? 0;
        const reference = getStrengthReference(exercise);
        const percentile = estimatePercentile(latest, reference);
        const medianRef = reference.find((point) => point.percentile === 60)?.oneRmKg ?? 0;

        return {
          exercise,
          firstEst1RM: first,
          latestEst1RM: latest,
          deltaKg: latest - first,
          deltaPercent: first ? ((latest - first) / first) * 100 : 0,
          percentile,
          topPercent: 100 - percentile,
          referenceMedian1RM: medianRef,
        };
      })
      .sort((a, b) => b.percentile - a.percentile);
  }, [parsedSets]);

  const onAddLogEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const sets = Number(quickLog.sets);
    const reps = Number(quickLog.reps);
    const weight = Number(quickLog.weight);

    if (!quickLog.exercise.trim() || !sets || !reps || !weight || !quickLog.date) {
      return;
    }

    const formattedLine = `${prettifyExercise(quickLog.exercise.trim())} ${sets}x${reps} @ ${weight}${quickLog.unit}`;
    const block = `${quickLog.date}\n${formattedLine}`;

    setRawLog((previous) => `${previous.trim()}\n\n${block}`.trim());
    setQuickLog((previous) => ({
      ...previous,
      exercise: "",
      weight: "",
    }));
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>Strength Pulse</title>
        <meta
          name="description"
          content="Phone-first strength tracker with progression and percentile benchmarks"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.appShell}>
        <header className={styles.header}>
          <p className={styles.kicker}>Phone-first strength tracker</p>
          <h1>Strength Pulse</h1>
          <p>
            Log workouts here or paste chat history, then track progression and percentile rank by lift.
          </p>
        </header>

        <section className={styles.card}>
          <h2>Quick log entry</h2>
          <form className={styles.form} onSubmit={onAddLogEntry}>
            <div className={styles.rowTwo}>
              <label>
                Date
                <input
                  type="date"
                  value={quickLog.date}
                  onChange={(event) =>
                    setQuickLog((previous) => ({ ...previous, date: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Exercise
                <input
                  type="text"
                  placeholder="Squat"
                  value={quickLog.exercise}
                  onChange={(event) =>
                    setQuickLog((previous) => ({ ...previous, exercise: event.target.value }))
                  }
                  required
                />
              </label>
            </div>
            <div className={styles.rowThree}>
              <label>
                Weight
                <input
                  type="number"
                  inputMode="decimal"
                  value={quickLog.weight}
                  onChange={(event) =>
                    setQuickLog((previous) => ({ ...previous, weight: event.target.value }))
                  }
                  placeholder="100"
                  required
                />
              </label>
              <label>
                Reps
                <input
                  type="number"
                  value={quickLog.reps}
                  onChange={(event) =>
                    setQuickLog((previous) => ({ ...previous, reps: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Sets
                <input
                  type="number"
                  value={quickLog.sets}
                  onChange={(event) =>
                    setQuickLog((previous) => ({ ...previous, sets: event.target.value }))
                  }
                  required
                />
              </label>
            </div>
            <div className={styles.actions}>
              <div className={styles.unitToggle} role="radiogroup" aria-label="Weight unit">
                <button
                  type="button"
                  aria-pressed={quickLog.unit === "kg"}
                  className={quickLog.unit === "kg" ? styles.unitActive : ""}
                  onClick={() => setQuickLog((previous) => ({ ...previous, unit: "kg" }))}
                >
                  kg
                </button>
                <button
                  type="button"
                  aria-pressed={quickLog.unit === "lb"}
                  className={quickLog.unit === "lb" ? styles.unitActive : ""}
                  onClick={() => setQuickLog((previous) => ({ ...previous, unit: "lb" }))}
                >
                  lb
                </button>
              </div>
              <button className={styles.primaryButton} type="submit">
                Add to log
              </button>
            </div>
          </form>
        </section>

        <section className={styles.card}>
          <h2>Paste or edit raw log</h2>
          <p className={styles.helpText}>
            Supports <code>Squat 3x5 @ 100kg</code>, <code>Bench Press - 65kg x 8</code>, and <code>Deadlift: 265lb x 4</code>.
          </p>
          <textarea
            value={rawLog}
            onChange={(event) => setRawLog(event.target.value)}
            className={styles.input}
            aria-label="Workout log input"
          />
          <p className={styles.caption}>{parsedSets.length} sets parsed</p>
        </section>

        <section className={styles.card}>
          <h2>Progression</h2>
          {summaries.length === 0 ? (
            <p className={styles.empty}>No lift data parsed yet. Add a log entry to begin.</p>
          ) : (
            <ul className={styles.list}>
              {summaries.map((summary) => (
                <li key={summary.exercise} className={styles.listItem}>
                  <div>
                    <h3>{prettifyExercise(summary.exercise)}</h3>
                    <p>
                      Est. 1RM: <strong>{summary.latestEst1RM.toFixed(1)} kg</strong>
                    </p>
                  </div>
                  <p className={summary.deltaKg >= 0 ? styles.up : styles.down}>
                    {summary.deltaKg >= 0 ? "+" : ""}
                    {summary.deltaKg.toFixed(1)} kg ({summary.deltaPercent.toFixed(1)}%)
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.card}>
          <h2>Percentile ranking</h2>
          <p className={styles.helpText}>
            Percentiles are estimated from real-world lifting-standard style distributions, then interpolated.
          </p>
          {summaries.length === 0 ? (
            <p className={styles.empty}>Add at least one lift to view rankings.</p>
          ) : (
            <ul className={styles.list}>
              {summaries.map((summary) => (
                <li key={`${summary.exercise}-percentile`} className={styles.listItem}>
                  <div>
                    <h3>{prettifyExercise(summary.exercise)}</h3>
                    <p>Median benchmark (60th): {summary.referenceMedian1RM.toFixed(1)} kg est. 1RM</p>
                  </div>
                  <p className={styles.badge}>Top {summary.topPercent.toFixed(1)}%</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default Home;
