import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TASK_REQUIREMENTS } from "../data/questions";
import { useDb, newId } from "../lib/db-context";
import { addTask } from "../lib/storage";
import {
  computeCoverage,
  computePositioning,
  computePredictedImpact,
  computeUtilizzo,
  validateAnswer,
} from "../lib/formulas";
import type { DimKey, Task } from "../lib/types";

export default function TaskTest() {
  const { personId } = useParams();
  const navigate = useNavigate();
  const { db, setDb } = useDb();

  const person = db.people.find((p) => p.id === personId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState<Record<DimKey, number | null>>({
    G: null, A: null, R: null, S: null, E: null, Q: null,
  });
  const [error, setError] = useState("");

  if (!person) {
    return <p>Persona non trovata.</p>;
  }

  const allFilled = TASK_REQUIREMENTS.every((r) => requirements[r.dim] !== null);

  function setReq(dim: DimKey, value: number) {
    setRequirements((prev) => ({ ...prev, [dim]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Il nome del compito è obbligatorio.");
      return;
    }
    if (!allFilled) {
      setError("Assegna un voto da 1 a 10 per tutte le sei dimensioni.");
      return;
    }
    const finalReq = requirements as Record<DimKey, number>;
    for (const v of Object.values(finalReq)) {
      if (!validateAnswer(v)) {
        setError("Tutti i voti devono essere compresi tra 1 e 10.");
        return;
      }
    }

    const coverage = computeCoverage(person!.scores, finalReq);
    const utilizzo = computeUtilizzo(person!.scores, finalReq);
    const positioning = computePositioning(coverage, utilizzo);
    const predictedImpact = computePredictedImpact(person!.potential, positioning);

    const task: Task = {
      id: newId(),
      personId: person!.id,
      name: name.trim(),
      description: description.trim() || undefined,
      requirements: finalReq,
      coverage,
      utilizzo,
      positioning,
      predictedImpact,
      createdAt: new Date().toISOString(),
    };

    setDb(addTask(db, task));
    navigate(`/risultato/${person!.id}`);
  }

  return (
    <div>
      <h1 className="page-title">Nuovo compito</h1>
      <p className="page-subtitle">
        Assegna sei voti da 1 a 10 su quanto il compito richiede ciascuna
        dimensione. Da compilare preferibilmente da chi osserva la persona sul
        campo.
      </p>

      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>Nome del compito *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Descrizione (facoltativa)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        {TASK_REQUIREMENTS.map((req) => (
          <div className="field" key={req.dim}>
            <label>
              {req.label} — {req.question}
            </label>
            <div className="scale-grid">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`scale-btn ${requirements[req.dim] === val ? "selected" : ""}`}
                  onClick={() => setReq(req.dim, val)}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        ))}

        {error && <p className="error-text">{error}</p>}

        <div className="btn-row">
          <button type="submit" className="btn btn-primary">
            Calcola posizionamento
          </button>
        </div>
      </form>
    </div>
  );
}
