import { describe, it, expect } from "vitest";
import {
  computeDimensionScores,
  rankDimensions,
  computePotential,
  classifyProfile,
  computeCoverage,
  computeUtilizzo,
  computePositioning,
  computePredictedImpact,
  classifyPositioningZone,
  pearsonCorrelation,
} from "./formulas";
import type { DimKey } from "./types";

describe("computeDimensionScores", () => {
  it("calcola la media delle 3 domande per ciascuna dimensione", () => {
    // Q1-3=G, Q4-6=A, Q7-9=R, Q10-12=S, Q13-15=E, Q16-18=Q
    const answers = [
      9, 8, 7, // G -> 8
      5, 5, 5, // A -> 5
      3, 4, 5, // R -> 4
      10, 10, 10, // S -> 10
      1, 2, 3, // E -> 2
      6, 6, 6, // Q -> 6
    ];
    const scores = computeDimensionScores(answers);
    expect(scores.G).toBeCloseTo(8);
    expect(scores.A).toBeCloseTo(5);
    expect(scores.R).toBeCloseTo(4);
    expect(scores.S).toBeCloseTo(10);
    expect(scores.E).toBeCloseTo(2);
    expect(scores.Q).toBeCloseTo(6);
  });

  it("lancia un errore se le risposte non sono 18", () => {
    expect(() => computeDimensionScores([1, 2, 3])).toThrow();
  });
});

describe("rankDimensions", () => {
  it("ordina dal punteggio maggiore al minore", () => {
    const scores: Record<DimKey, number> = { G: 3, A: 9, R: 5, S: 1, E: 7, Q: 4 };
    const ranked = rankDimensions(scores);
    expect(ranked.map((r) => r.dim)).toEqual(["A", "E", "R", "Q", "G", "S"]);
  });
});

describe("computePotential", () => {
  it("è la media tra primo e secondo punteggio", () => {
    const scores: Record<DimKey, number> = { G: 9, A: 8, R: 5, S: 1, E: 7, Q: 4 };
    // ranked: G9, A8 -> (9+8)/2 = 8.5
    expect(computePotential(scores)).toBe(8.5);
  });
});

describe("classifyProfile", () => {
  it("PROFILO NON ANCORA DEFINITO quando il massimo è < 6.5", () => {
    const scores: Record<DimKey, number> = { G: 6, A: 5.8, R: 5, S: 4, E: 3, Q: 2 };
    const result = classifyProfile(scores);
    expect(result.classification).toBe("NON_DEFINITO");
  });

  it("PROFILO IBRIDO quando delta < 0.7", () => {
    const scores: Record<DimKey, number> = { G: 9, A: 8.5, R: 5, S: 4, E: 3, Q: 2 };
    const result = classifyProfile(scores);
    expect(result.classification).toBe("IBRIDO");
    expect(result.label).toContain("GENERATORE");
    expect(result.label).toContain("ANALISTA");
  });

  it("PRIMARIO + SECONDARIO quando delta tra 0.7 e 1.5", () => {
    const scores: Record<DimKey, number> = { G: 9, A: 8, R: 5, S: 4, E: 3, Q: 2 };
    const result = classifyProfile(scores);
    expect(result.classification).toBe("PRIMARIO_SECONDARIO");
    expect(result.delta).toBe(1);
  });

  it("POTENZIALE DOMINANTE quando delta > 1.5", () => {
    const scores: Record<DimKey, number> = { G: 9.5, A: 7, R: 5, S: 4, E: 3, Q: 2 };
    const result = classifyProfile(scores);
    expect(result.classification).toBe("DOMINANTE");
    expect(result.label).toBe("GENERATORE");
  });
});

describe("computeCoverage", () => {
  it("Coverage = 10 quando tutti i weight sono zero (task tutti a 1)", () => {
    const personScores: Record<DimKey, number> = { G: 5, A: 5, R: 5, S: 5, E: 5, Q: 5 };
    const taskReq: Record<DimKey, number> = { G: 1, A: 1, R: 1, S: 1, E: 1, Q: 1 };
    expect(computeCoverage(personScores, taskReq)).toBe(10);
  });

  it("calcola correttamente un caso noto", () => {
    // Solo G richiesto ad alta intensità, persona con G basso
    const personScores: Record<DimKey, number> = { G: 5, A: 1, R: 1, S: 1, E: 1, Q: 1 };
    const taskReq: Record<DimKey, number> = { G: 10, A: 1, R: 1, S: 1, E: 1, Q: 1 };
    // weight_G = (10-1)/9 = 1, altri weight = 0
    // adequacy_G = min(5/10,1) = 0.5
    // Coverage = 10 * (1*0.5 / 1) = 5
    expect(computeCoverage(personScores, taskReq)).toBe(5);
  });

  it("è limitata tra 1 e 10", () => {
    const personScores: Record<DimKey, number> = { G: 10, A: 10, R: 10, S: 10, E: 10, Q: 10 };
    const taskReq: Record<DimKey, number> = { G: 10, A: 10, R: 10, S: 10, E: 10, Q: 10 };
    const coverage = computeCoverage(personScores, taskReq);
    expect(coverage).toBeLessThanOrEqual(10);
    expect(coverage).toBeGreaterThanOrEqual(1);
  });
});

describe("computeUtilizzo", () => {
  it("è la media dei requisiti del compito nelle due dimensioni top della persona", () => {
    const personScores: Record<DimKey, number> = { G: 9, A: 8, R: 5, S: 4, E: 3, Q: 2 };
    const taskReq: Record<DimKey, number> = { G: 9, A: 8, R: 1, S: 1, E: 1, Q: 1 };
    expect(computeUtilizzo(personScores, taskReq)).toBe(8.5);
  });
});

describe("computePositioning", () => {
  it("è la media tra coverage e utilizzo", () => {
    expect(computePositioning(8, 6)).toBe(7);
  });
});

describe("computePredictedImpact", () => {
  it("è (potenziale * posizionamento) / 10", () => {
    expect(computePredictedImpact(8.9, 8.4)).toBe(7.5);
  });
});

describe("classifyPositioningZone", () => {
  it("SOTTOPOSIZIONATO per 1.0-4.9", () => {
    expect(classifyPositioningZone(3).zone).toBe("SOTTOPOSIZIONATO");
    expect(classifyPositioningZone(4.9).zone).toBe("SOTTOPOSIZIONATO");
  });
  it("COMPATIBILE per 5.0-7.4", () => {
    expect(classifyPositioningZone(5).zone).toBe("COMPATIBILE");
    expect(classifyPositioningZone(7.4).zone).toBe("COMPATIBILE");
  });
  it("POSIZIONAMENTO FORTE per 7.5-10", () => {
    expect(classifyPositioningZone(7.5).zone).toBe("FORTE");
    expect(classifyPositioningZone(10).zone).toBe("FORTE");
  });
});

describe("pearsonCorrelation", () => {
  it("calcola correlazione perfetta positiva", () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    expect(pearsonCorrelation(x, y)).toBeCloseTo(1);
  });

  it("calcola correlazione perfetta negativa", () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 8, 6, 4, 2];
    expect(pearsonCorrelation(x, y)).toBeCloseTo(-1);
  });

  it("ritorna null con meno di 2 punti", () => {
    expect(pearsonCorrelation([1], [1])).toBeNull();
  });
});
