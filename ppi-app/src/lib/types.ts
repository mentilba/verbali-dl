export type DimKey = "G" | "A" | "R" | "S" | "E" | "Q";

export const DIM_KEYS: DimKey[] = ["G", "A", "R", "S", "E", "Q"];

export const DIM_LABELS: Record<DimKey, string> = {
  G: "GENERA",
  A: "ANALIZZA",
  R: "RELAZIONA",
  S: "STRUTTURA",
  E: "ESEGUE",
  Q: "GARANTISCE",
};

export const DIM_LONG_LABELS: Record<DimKey, string> = {
  G: "GENERATORE",
  A: "ANALISTA",
  R: "CONNETTORE",
  S: "ARCHITETTO",
  E: "ESECUTORE",
  Q: "GUARDIANO",
};

export type EvaluationType = "auto" | "esterna";

export interface Person {
  id: string;
  name: string;
  age?: number;
  role?: string;
  evaluationType: EvaluationType;
  createdAt: string;
  answers: number[]; // 18 raw answers, 1-10, index 0 = Q1
  scores: Record<DimKey, number>; // G A R S E Q
  top1: DimKey;
  top2: DimKey;
  delta: number;
  classification: string;
  potential: number;
}

export interface Task {
  id: string;
  personId: string;
  name: string;
  description?: string;
  requirements: Record<DimKey, number>; // T1..T6
  coverage: number;
  utilizzo: number;
  positioning: number;
  predictedImpact: number;
  realImpact?: number;
  energy?: number;
  createdAt: string;
  realImpactDate?: string;
}

export interface Database {
  people: Person[];
  tasks: Task[];
}
