import type { DimKey } from "../lib/types";

export interface Question {
  id: number; // 1..18
  dim: DimKey;
  text: string;
}

export const QUESTIONS: Question[] = [
  { id: 1, dim: "G", text: "Quando si trova davanti a qualcosa di nuovo, vede rapidamente possibilità che gli altri non vedono." },
  { id: 2, dim: "G", text: "Trova con facilità soluzioni diverse da quelle già utilizzate." },
  { id: 3, dim: "G", text: "Riconosce opportunità interessanti prima che diventino evidenti agli altri." },
  { id: 4, dim: "A", text: "Davanti a un problema complesso riesce rapidamente a capire quali sono le vere cause." },
  { id: 5, dim: "A", text: "Riconosce incongruenze, punti deboli o errori di ragionamento che gli altri tendono a non vedere." },
  { id: 6, dim: "A", text: "Riesce a scomporre una situazione complessa nelle poche variabili che contano davvero." },
  { id: 7, dim: "R", text: "Le persone tendono a fidarsi di lui/lei rapidamente." },
  { id: 8, dim: "R", text: "Capisce con facilità cosa motiva, preoccupa o interessa realmente l'altra persona." },
  { id: 9, dim: "R", text: "Riesce a portare persone con opinioni diverse verso un accordo, una scelta o un'azione comune." },
  { id: 10, dim: "S", text: "Quando una situazione è confusa, tende spontaneamente a mettere ordine." },
  { id: 11, dim: "S", text: "Riesce a trasformare un obiettivo generico in passaggi, priorità e responsabilità chiare." },
  { id: 12, dim: "S", text: "È bravo/a a trasformare qualcosa che funziona in modo improvvisato in un sistema ripetibile." },
  { id: 13, dim: "E", text: "Una volta presa una decisione, passa all'azione rapidamente." },
  { id: 14, dim: "E", text: "È una persona sulla quale si può contare per portare realmente le cose a termine." },
  { id: 15, dim: "E", text: "Mantiene un buon ritmo operativo anche senza essere continuamente seguito/a o sollecitato/a." },
  { id: 16, dim: "Q", text: "Nota dettagli, errori o anomalie che normalmente sfuggono agli altri." },
  { id: 17, dim: "Q", text: "Prima che qualcosa vada storto tende a individuare rischi e punti di cedimento." },
  { id: 18, dim: "Q", text: "Riesce a mantenere uno standard elevato di precisione e affidabilità anche quando l'attività diventa ripetitiva." },
];

export const DIM_DESCRIPTIONS: Record<DimKey, string> = {
  G: "Vedere possibilità, creare alternative, anticipare opportunità.",
  A: "Comprendere, diagnosticare, trovare le variabili decisive.",
  R: "Leggere, coinvolgere e muovere le persone.",
  S: "Trasformare complessità e caos in ordine e sistema.",
  E: "Trasformare intenzioni e decisioni in risultato.",
  Q: "Proteggere precisione, qualità, affidabilità e rischio.",
};

export interface TaskRequirementDef {
  dim: DimKey;
  label: string;
  question: string;
}

export const TASK_REQUIREMENTS: TaskRequirementDef[] = [
  { dim: "G", label: "GENERA", question: "Quanto questo compito richiede di creare possibilità, trovare alternative o vedere opportunità nuove?" },
  { dim: "A", label: "ANALIZZA", question: "Quanto richiede di analizzare, capire cause e risolvere problemi complessi?" },
  { dim: "R", label: "RELAZIONA", question: "Quanto richiede di comprendere, coinvolgere o influenzare altre persone?" },
  { dim: "S", label: "STRUTTURA", question: "Quanto richiede di organizzare, pianificare e trasformare complessità in sistema?" },
  { dim: "E", label: "ESEGUE", question: "Quanto richiede di agire, produrre e portare a termine?" },
  { dim: "Q", label: "GARANTISCE", question: "Quanto richiede precisione, controllo, affidabilità e prevenzione degli errori?" },
];
