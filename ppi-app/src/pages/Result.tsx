import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDb } from "../lib/db-context";
import { updateTask } from "../lib/storage";
import { classifyPositioningZone } from "../lib/formulas";
import { DIM_LABELS } from "../lib/types";
import DimensionBars from "../components/DimensionBars";

const ENERGY_LABELS: Record<number, string> = {
  [-2]: "Mi svuota molto",
  [-1]: "Mi toglie energia",
  0: "Neutro",
  1: "Mi dà energia",
  2: "Mi dà molta energia",
};

function zoneBadgeClass(zone: string) {
  if (zone === "FORTE") return "badge-strong";
  if (zone === "COMPATIBILE") return "badge-compat";
  return "badge-weak";
}

export default function Result() {
  const { personId } = useParams();
  const { db, setDb } = useDb();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [realImpactInput, setRealImpactInput] = useState("");
  const [energyInput, setEnergyInput] = useState("0");

  const person = db.people.find((p) => p.id === personId);
  const tasks = db.tasks
    .filter((t) => t.personId === personId)
    .sort((a, b) => b.positioning - a.positioning);

  if (!person) {
    return <p>Persona non trovata.</p>;
  }

  const tasksWithReal = tasks.filter((t) => t.realImpact !== undefined);

  function startEdit(taskId: string, currentReal?: number, currentEnergy?: number) {
    setEditingTaskId(taskId);
    setRealImpactInput(currentReal !== undefined ? String(currentReal) : "");
    setEnergyInput(currentEnergy !== undefined ? String(currentEnergy) : "0");
  }

  function saveReal(taskId: string) {
    const value = Number(realImpactInput);
    if (!Number.isFinite(value) || value < 1 || value > 10) return;
    setDb(
      updateTask(db, taskId, {
        realImpact: value,
        energy: Number(energyInput),
        realImpactDate: new Date().toISOString(),
      })
    );
    setEditingTaskId(null);
  }

  return (
    <div>
      <h1 className="page-title">{person.name}</h1>
      <p className="page-subtitle">
        {person.role ? `${person.role} · ` : ""}
        {person.evaluationType === "auto" ? "Autovalutazione" : "Valutazione esterna"}
      </p>

      <div className="formula-hero">
        <span>{person.potential.toFixed(1)}</span>
        <span>×</span>
        <span>{tasks.length ? tasks[0].positioning.toFixed(1) : "—"}</span>
        <span>=</span>
        <span>{tasks.length ? tasks[0].predictedImpact.toFixed(1) : "—"}</span>
      </div>

      <div className="card">
        <div className="stat-grid">
          <div className="stat-tile">
            <div className="stat-value">{DIM_LABELS[person.top1]}</div>
            <div className="stat-label">Potenziale primario</div>
          </div>
          <div className="stat-tile">
            <div className="stat-value">{DIM_LABELS[person.top2]}</div>
            <div className="stat-label">Potenziale secondario</div>
          </div>
          <div className="stat-tile">
            <div className="stat-value">{person.potential.toFixed(1)} / 10</div>
            <div className="stat-label">Potenziale</div>
          </div>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Configurazione: <strong style={{ color: "var(--text)" }}>{person.classification}</strong>
        </p>
      </div>

      <div className="section-heading">Le sei dimensioni</div>
      <div className="card">
        <DimensionBars scores={person.scores} />
      </div>

      <div className="section-heading">Compiti</div>

      {tasks.length === 0 && (
        <p style={{ color: "var(--text-muted)" }}>Nessun compito assegnato ancora.</p>
      )}

      {tasks.map((task) => {
        const zone = classifyPositioningZone(task.positioning);
        return (
          <div className="card" key={task.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <strong>{task.name}</strong>
                {task.description && (
                  <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "4px 0 0" }}>
                    {task.description}
                  </p>
                )}
              </div>
              <span className={`badge ${zoneBadgeClass(zone.zone)}`}>{zone.label}</span>
            </div>

            <div className="stat-grid" style={{ marginTop: 16 }}>
              <div className="stat-tile">
                <div className="stat-value">{task.positioning.toFixed(1)}</div>
                <div className="stat-label">Posizionamento</div>
              </div>
              <div className="stat-tile">
                <div className="stat-value">{task.predictedImpact.toFixed(1)}</div>
                <div className="stat-label">Impatto previsto</div>
              </div>
              <div className="stat-tile">
                <div className="stat-value">{task.realImpact !== undefined ? task.realImpact.toFixed(1) : "—"}</div>
                <div className="stat-label">Impatto reale</div>
              </div>
              <div className="stat-tile">
                <div className="stat-value">
                  {task.energy !== undefined ? ENERGY_LABELS[task.energy] : "—"}
                </div>
                <div className="stat-label">Energia</div>
              </div>
            </div>

            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{zone.description}</p>

            {editingTaskId === task.id ? (
              <div style={{ marginTop: 12 }}>
                <div className="field">
                  <label>Impatto reale (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={realImpactInput}
                    onChange={(e) => setRealImpactInput(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Energia dopo il compito</label>
                  <select value={energyInput} onChange={(e) => setEnergyInput(e.target.value)}>
                    <option value="-2">-2 · Mi svuota molto</option>
                    <option value="-1">-1 · Mi toglie energia</option>
                    <option value="0">0 · Neutro</option>
                    <option value="1">+1 · Mi dà energia</option>
                    <option value="2">+2 · Mi dà molta energia</option>
                  </select>
                </div>
                <div className="btn-row">
                  <button className="btn btn-primary" onClick={() => saveReal(task.id)}>
                    Salva
                  </button>
                  <button className="btn btn-secondary" onClick={() => setEditingTaskId(null)}>
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div className="btn-row">
                <button
                  className="btn btn-secondary"
                  onClick={() => startEdit(task.id, task.realImpact, task.energy)}
                >
                  {task.realImpact !== undefined ? "Modifica impatto reale" : "Aggiungi impatto reale"}
                </button>
              </div>
            )}
          </div>
        );
      })}

      <div className="btn-row">
        <Link to={`/test-compito/${person.id}`} className="btn btn-primary">
          Aggiungi compito
        </Link>
      </div>

      {tasks.length > 1 && (
        <>
          <div className="section-heading">Confronto tra compiti</div>
          <div className="card table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Compito</th>
                  <th>Posizionamento</th>
                  <th>Impatto previsto</th>
                  <th>Impatto reale</th>
                  <th>Energia</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{t.positioning.toFixed(1)}</td>
                    <td>{t.predictedImpact.toFixed(1)}</td>
                    <td>{t.realImpact !== undefined ? t.realImpact.toFixed(1) : "—"}</td>
                    <td>{t.energy !== undefined ? t.energy : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tasksWithReal.length >= 2 && (
        <>
          <div className="section-heading">Analisi del riposizionamento</div>
          {tasksWithReal
            .slice()
            .sort((a, b) => a.positioning - b.positioning)
            .reduce<{ a: typeof tasksWithReal[number]; b: typeof tasksWithReal[number] }[]>(
              (pairs, task, idx, arr) => {
                if (idx < arr.length - 1) pairs.push({ a: task, b: arr[arr.length - 1] });
                return pairs;
              },
              []
            )
            .slice(0, 1)
            .map(({ a, b }) => (
              <div className="card" key={`${a.id}-${b.id}`}>
                <div className="stat-grid">
                  <div className="stat-tile">
                    <div className="stat-value">{a.name}</div>
                    <div className="stat-label">
                      Posizionamento {a.positioning.toFixed(1)} · Impatto reale {a.realImpact?.toFixed(1)}
                    </div>
                  </div>
                  <div className="stat-tile">
                    <div className="stat-value">{b.name}</div>
                    <div className="stat-label">
                      Posizionamento {b.positioning.toFixed(1)} · Impatto reale {b.realImpact?.toFixed(1)}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 14 }}>
                  Δ Posizionamento:{" "}
                  <strong>{(b.positioning - a.positioning).toFixed(1)}</strong> · Δ Impatto:{" "}
                  <strong>{((b.realImpact ?? 0) - (a.realImpact ?? 0)).toFixed(1)}</strong>
                </p>
              </div>
            ))}
        </>
      )}

      <p className="principle-text">
        Il talento appartiene alla persona. La performance appartiene all'incastro.
        <br />
        Prima posiziona. Poi, se serve, migliora.
      </p>

    </div>
  );
}
