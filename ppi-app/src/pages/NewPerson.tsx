import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDb, newId } from "../lib/db-context";
import type { EvaluationType } from "../lib/types";

export default function NewPerson() {
  const { db, setDb } = useDb();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [role, setRole] = useState("");
  const [evaluationType, setEvaluationType] = useState<EvaluationType>("auto");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Il nome o codice persona è obbligatorio.");
      return;
    }
    const id = newId();
    const draft = {
      id,
      name: name.trim(),
      age: age ? Number(age) : undefined,
      role: role.trim() || undefined,
      evaluationType,
      createdAt: new Date().toISOString(),
    };
    // Persona incompleta: verrà completata al termine del test potenziale.
    sessionStorage.setItem("ppi-draft-person", JSON.stringify(draft));
    navigate(`/test-potenziale/${id}`);
    // db non ancora modificato qui: la persona viene salvata a fine test.
    void db;
    void setDb;
  }

  return (
    <div>
      <h1 className="page-title">Nuova persona</h1>
      <p className="page-subtitle">
        Inserisci i dati essenziali. La persona risponderà poi a 18 affermazioni.
      </p>

      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>Nome o codice persona *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="es. P-001" />
        </div>
        <div className="field">
          <label>Età (facoltativa)</label>
          <input
            type="number"
            min={1}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Ruolo / professione (facoltativo)</label>
          <input value={role} onChange={(e) => setRole(e.target.value)} />
        </div>
        <div className="field">
          <label>Tipo valutazione</label>
          <select
            value={evaluationType}
            onChange={(e) => setEvaluationType(e.target.value as EvaluationType)}
          >
            <option value="auto">Autovalutazione</option>
            <option value="esterna">Valutazione esterna</option>
          </select>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="btn-row">
          <button type="submit" className="btn btn-primary">
            Avvia test del potenziale
          </button>
        </div>
      </form>
    </div>
  );
}
