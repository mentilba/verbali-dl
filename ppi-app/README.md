# PPI — Pilot v0.1

Web app sperimentale per testare il metodo **Impatto = Potenziale × Posizionamento**.

## Come avviarla

```bash
cd ppi-app
npm install
npm run dev
```

Apri l'indirizzo mostrato in console (di default `http://localhost:5173`). L'app è mobile-first: funziona bene da smartphone (iPhone incluso) e da desktop.

Altri comandi utili:

```bash
npm run test    # esegue tutti i test delle formule e dello storage
npm run build   # build di produzione (tsc + vite build)
npm run lint    # lint del codice
```

## Dove sono definite le formule

Tutte le formule del metodo sono isolate dalla UI in `src/lib/formulas.ts`:

- `computeDimensionScores` — media delle 3 domande per ciascuna delle 6 dimensioni (G/A/R/S/E/Q)
- `rankDimensions` / `computePotential` — ordinamento e calcolo del Potenziale
- `classifyProfile` — classificazione del profilo (non definito / ibrido / primario+secondario / dominante)
- `computeCoverage` — copertura pesata rispetto ai requisiti del compito
- `computeUtilizzo` — utilizzo dei due punti di forza principali
- `computePositioning` — Posizionamento = (Coverage + Utilizzo) / 2
- `computePredictedImpact` — Impatto previsto = (Potenziale × Posizionamento) / 10
- `classifyPositioningZone` — zone sottoposizionato / compatibile / forte
- `pearsonCorrelation` — correlazione usata nella Pilot Dashboard

Le formule sono testate in `src/lib/formulas.test.ts` con casi numerici noti verificati a mano rispetto alle formule della specifica (`npm run test`).

Le domande del test del potenziale e i requisiti dei compiti sono in `src/data/questions.ts`.

## Dove sono memorizzati i dati

Nessun backend: tutto è salvato in `localStorage` del browser (chiave `ppi-pilot-db-v1`), gestito da `src/lib/storage.ts` e dal context React in `src/lib/db-context.tsx`. Ogni persona conserva sempre le 18 risposte originali e ogni compito i 6 requisiti originali, oltre ai punteggi calcolati — così le formule potranno essere ricalcolate in futuro senza perdere dati.

## Come esportare i risultati

Dalla **Pilot Dashboard** (`/dashboard`):

- **Esporta CSV** — una riga per ogni combinazione persona-compito, con tutti gli input e gli output.
- **Esporta JSON** — l'intero database locale (persone + compiti).
- **Importa JSON** — ripristina un database esportato in precedenza (utile per backup o per condividere i dati raccolti nel pilot).

## Flusso dell'app

1. **Nuova persona** — dati anagrafici minimi + tipo valutazione.
2. **Test del potenziale** — 18 affermazioni, voto 1–10, una alla volta.
3. **Risultato** — profilo G/A/R/S/E/Q, Potenziale primario/secondario, classificazione.
4. **Test del compito** — 6 requisiti del compito (voto 1–10), calcolo automatico di Coverage, Utilizzo, Posizionamento, Impatto previsto.
5. **Impatto reale ed Energia** — inseribili in un secondo momento dalla pagina Risultato.
6. **Confronto compiti** e **analisi del riposizionamento** per la stessa persona.
7. **Pilot Dashboard** — statistiche aggregate e correlazioni (Pearson) tra Posizionamento/Impatto previsto e Impatto reale.

Nessun dato interpretato liberamente da un'AI, nessun test psicologico esterno: solo le formule definite nella specifica del metodo.
