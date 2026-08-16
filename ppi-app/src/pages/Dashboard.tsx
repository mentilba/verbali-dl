import { useRef } from "react";
import { useDb } from "../lib/db-context";
import { pearsonCorrelation } from "../lib/formulas";
import {
  downloadFile,
  exportToCsv,
  exportToJson,
  parseImportedJson,
} from "../lib/storage";

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export default function Dashboard() {
  const { db, setDb } = useDb();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const tasks = db.tasks;
  const tasksWithReal = tasks.filter((t) => t.realImpact !== undefined);

  const positioningAvg = average(tasks.map((t) => t.positioning));
  const predictedAvg = average(tasks.map((t) => t.predictedImpact));
  const realAvg = average(tasksWithReal.map((t) => t.realImpact as number));

  const errorAvg = average(
    tasksWithReal.map((t) => Math.abs(t.predictedImpact - (t.realImpact as number)))
  );

  const corrPositioningReal = pearsonCorrelation(
    tasksWithReal.map((t) => t.positioning),
    tasksWithReal.map((t) => t.realImpact as number)
  );

  const corrPredictedReal = pearsonCorrelation(
    tasksWithReal.map((t) => t.predictedImpact),
    tasksWithReal.map((t) => t.realImpact as number)
  );

  function handleExportCsv() {
    downloadFile("ppi-pilot-export.csv", exportToCsv(db), "text/csv;charset=utf-8");
  }

  function handleExportJson() {
    downloadFile("ppi-pilot-export.json", exportToJson(db), "application/json");
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseImportedJson(String(reader.result));
        setDb(imported);
      } catch {
        alert("File JSON non valido.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div>
      <h1 className="page-title">Pilot Dashboard</h1>
      <p className="page-subtitle">Panoramica di tutti i dati raccolti nel pilot.</p>

      <div className="warning-box">
        Indicatore sperimentale: il campione non costituisce validazione scientifica.
      </div>

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-value">{db.people.length}</div>
          <div className="stat-label">Persone</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{tasks.length}</div>
          <div className="stat-label">Compiti valutati</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{tasksWithReal.length}</div>
          <div className="stat-label">Con impatto reale</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{positioningAvg !== null ? positioningAvg.toFixed(1) : "—"}</div>
          <div className="stat-label">Posizionamento medio</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{predictedAvg !== null ? predictedAvg.toFixed(1) : "—"}</div>
          <div className="stat-label">Impatto previsto medio</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{realAvg !== null ? realAvg.toFixed(1) : "—"}</div>
          <div className="stat-label">Impatto reale medio</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{errorAvg !== null ? errorAvg.toFixed(1) : "—"}</div>
          <div className="stat-label">Errore medio previsto/reale</div>
        </div>
      </div>

      <div className="section-heading">Correlazioni (Pearson)</div>
      <div className="card">
        <p style={{ fontSize: 14 }}>
          Posizionamento ↔ Impatto reale:{" "}
          <strong>{corrPositioningReal !== null ? corrPositioningReal.toFixed(2) : "dati insufficienti"}</strong>
        </p>
        <p style={{ fontSize: 14 }}>
          Impatto previsto ↔ Impatto reale:{" "}
          <strong>{corrPredictedReal !== null ? corrPredictedReal.toFixed(2) : "dati insufficienti"}</strong>
        </p>
      </div>

      <div className="section-heading">Dati</div>
      <div className="card">
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button className="btn btn-secondary" onClick={handleExportCsv}>
            Esporta CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExportJson}>
            Esporta JSON
          </button>
          <button className="btn btn-secondary" onClick={handleImportClick}>
            Importa JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={handleImportFile}
          />
        </div>
      </div>
    </div>
  );
}
