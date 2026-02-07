import type { NextPage } from "next";
import Head from "next/head";
import { useMemo, useState } from "react";
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
  populationAvg1RM: number;
  vsPopulationPercent: number;
};

const populationAvgByExercise: Record<string, number> = {
  squat: 95,
  "bench press": 70,
  deadlift: 115,
  "overhead press": 45,
  row: 65,
  "romanian deadlift": 85,
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

const getPopulationAverage = (exercise: string) => {
  const found = Object.entries(populationAvgByExercise).find(([name]) =>
    exercise.includes(name)
  );

  return found?.[1] ?? 60;
};

const Home: NextPage = () => {
  const [rawLog, setRawLog] = useState(`2026-02-03
Squat 3x5 @ 95kg
Bench Press - 65kg x 8
Deadlift: 120kg x 4

2026-02-06
Squat 3x5 @ 100kg
Bench Press - 67.5kg x 8
Deadlift: 125kg x 4`);

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
        const populationAvg = getPopulationAverage(exercise);

        return {
          exercise,
          firstEst1RM: first,
          latestEst1RM: latest,
          deltaKg: latest - first,
          deltaPercent: first ? ((latest - first) / first) * 100 : 0,
          populationAvg1RM: populationAvg,
          vsPopulationPercent: (latest / populationAvg) * 100,
        };
      })
      .sort((a, b) => b.deltaKg - a.deltaKg);
  }, [parsedSets]);

  return (
    <div className={styles.page}>
      <Head>
        <title>Strength Pulse</title>
        <meta
          name="description"
          content="Phone-first strength tracker with progression and population benchmarks"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.appShell}>
        <header className={styles.header}>
          <p className={styles.kicker}>Phone-first strength tracker</p>
          <h1>Strength Pulse</h1>
          <p>
            Paste your workout chat history, track your trend, and compare your current strength to population averages.
          </p>
        </header>

        <section className={styles.card}>
          <h2>Paste workout log</h2>
          <p className={styles.helpText}>
            Supported examples: <code>Squat 3x5 @ 100kg</code>, <code>Bench Press - 65kg x 8</code>, <code>Deadlift: 265lb x 4</code>.
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
            <p className={styles.empty}>No lift data parsed yet. Paste your log to begin.</p>
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
          <h2>Population comparison</h2>
          {summaries.length === 0 ? (
            <p className={styles.empty}>Add at least one lift to view comparison data.</p>
          ) : (
            <ul className={styles.list}>
              {summaries.map((summary) => (
                <li key={`${summary.exercise}-pop`} className={styles.listItem}>
                  <div>
                    <h3>{prettifyExercise(summary.exercise)}</h3>
                    <p>Population avg est. 1RM: {summary.populationAvg1RM} kg</p>
                  </div>
                  <p className={styles.badge}>{summary.vsPopulationPercent.toFixed(0)}% of avg</p>
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
