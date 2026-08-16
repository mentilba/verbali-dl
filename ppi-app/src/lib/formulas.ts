import { DIM_KEYS, DIM_LONG_LABELS, type DimKey } from "./types";
import { QUESTIONS } from "../data/questions";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Calcola i sei punteggi G/A/R/S/E/Q come media delle 3 domande di ciascuna dimensione. */
export function computeDimensionScores(answers: number[]): Record<DimKey, number> {
  if (answers.length !== 18) {
    throw new Error("Servono esattamente 18 risposte");
  }
  const scores = {} as Record<DimKey, number>;
  for (const dim of DIM_KEYS) {
    const qs = QUESTIONS.filter((q) => q.dim === dim);
    const sum = qs.reduce((acc, q) => acc + answers[q.id - 1], 0);
    scores[dim] = sum / qs.length;
  }
  return scores;
}

export interface RankedDimension {
  dim: DimKey;
  score: number;
}

/** Ordina le sei dimensioni dal punteggio maggiore al minore. */
export function rankDimensions(scores: Record<DimKey, number>): RankedDimension[] {
  return DIM_KEYS.map((dim) => ({ dim, score: scores[dim] })).sort(
    (a, b) => b.score - a.score
  );
}

/** Potenziale = media tra primo e secondo punteggio (scala 1-10). */
export function computePotential(scores: Record<DimKey, number>): number {
  const ranked = rankDimensions(scores);
  return round1((ranked[0].score + ranked[1].score) / 2);
}

export interface ClassificationResult {
  classification: string;
  label: string;
  top1: DimKey;
  top2: DimKey;
  delta: number;
}

/** Classifica il profilo in base al punteggio massimo e al delta primo/secondo. */
export function classifyProfile(scores: Record<DimKey, number>): ClassificationResult {
  const ranked = rankDimensions(scores);
  const top1 = ranked[0].dim;
  const top2 = ranked[1].dim;
  const delta = round1(ranked[0].score - ranked[1].score);

  if (ranked[0].score < 6.5) {
    return {
      classification: "NON_DEFINITO",
      label: "PROFILO NON ANCORA DEFINITO",
      top1,
      top2,
      delta,
    };
  }

  if (delta < 0.7) {
    return {
      classification: "IBRIDO",
      label: `${DIM_LONG_LABELS[top1]}–${DIM_LONG_LABELS[top2]}`,
      top1,
      top2,
      delta,
    };
  }

  if (delta <= 1.5) {
    return {
      classification: "PRIMARIO_SECONDARIO",
      label: `${DIM_LONG_LABELS[top1]} con componente ${DIM_LONG_LABELS[top2].toLowerCase()}`,
      top1,
      top2,
      delta,
    };
  }

  return {
    classification: "DOMINANTE",
    label: DIM_LONG_LABELS[top1],
    top1,
    top2,
    delta,
  };
}

/**
 * Coverage: misura se la persona possiede capacità sufficienti rispetto
 * a ciò che il compito richiede, pesata per l'intensità della richiesta.
 */
export function computeCoverage(
  personScores: Record<DimKey, number>,
  taskRequirements: Record<DimKey, number>
): number {
  let weightedSum = 0;
  let weightTotal = 0;

  for (const dim of DIM_KEYS) {
    const taskScore = taskRequirements[dim];
    const personScore = personScores[dim];
    const weight = (taskScore - 1) / 9;
    const adequacy = Math.min(personScore / taskScore, 1);
    weightedSum += weight * adequacy;
    weightTotal += weight;
  }

  if (weightTotal === 0) {
    return 10;
  }

  const coverage = 10 * (weightedSum / weightTotal);
  return round1(clamp(coverage, 1, 10));
}

/** Utilizzo: quanto il compito richiede le due dimensioni più forti della persona. */
export function computeUtilizzo(
  personScores: Record<DimKey, number>,
  taskRequirements: Record<DimKey, number>
): number {
  const ranked = rankDimensions(personScores);
  const top1 = ranked[0].dim;
  const top2 = ranked[1].dim;
  return round1((taskRequirements[top1] + taskRequirements[top2]) / 2);
}

/** Posizionamento = media tra Coverage e Utilizzo. */
export function computePositioning(coverage: number, utilizzo: number): number {
  return round1((coverage + utilizzo) / 2);
}

/** Impatto previsto = (Potenziale × Posizionamento) / 10. */
export function computePredictedImpact(potential: number, positioning: number): number {
  return round1((potential * positioning) / 10);
}

export type PositioningZone = "SOTTOPOSIZIONATO" | "COMPATIBILE" | "FORTE";

export interface PositioningZoneInfo {
  zone: PositioningZone;
  label: string;
  description: string;
}

/** Classifica la zona di posizionamento. */
export function classifyPositioningZone(positioning: number): PositioningZoneInfo {
  if (positioning < 5.0) {
    return {
      zone: "SOTTOPOSIZIONATO",
      label: "SOTTOPOSIZIONATO",
      description: "Il compito utilizza male le capacità più forti della persona.",
    };
  }
  if (positioning < 7.5) {
    return {
      zone: "COMPATIBILE",
      label: "COMPATIBILE",
      description:
        "La persona può funzionare bene nel compito, ma una parte rilevante del suo potenziale potrebbe restare inutilizzata.",
    };
  }
  return {
    zone: "FORTE",
    label: "POSIZIONAMENTO FORTE",
    description:
      "Il compito utilizza in modo rilevante le capacità nelle quali la persona risulta più forte.",
  };
}

/** Pearson correlation coefficient. Ritorna null se non calcolabile. */
export function pearsonCorrelation(x: number[], y: number[]): number | null {
  const n = x.length;
  if (n < 2 || n !== y.length) return null;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  if (denomX === 0 || denomY === 0) return null;

  return num / Math.sqrt(denomX * denomY);
}

export function validateAnswer(value: number): boolean {
  return Number.isFinite(value) && value >= 1 && value <= 10;
}
