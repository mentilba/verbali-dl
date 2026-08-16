import { Link } from "react-router-dom";
import { useDb } from "../lib/db-context";

export default function PeopleList() {
  const { db } = useDb();

  return (
    <div>
      <h1 className="page-title">Persone</h1>
      <p className="page-subtitle">Tutte le persone valutate nel pilot.</p>

      {db.people.length === 0 && (
        <p style={{ color: "var(--text-muted)" }}>Nessuna persona ancora. Inizia creandone una.</p>
      )}

      {db.people
        .slice()
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .map((p) => {
          const taskCount = db.tasks.filter((t) => t.personId === p.id).length;
          return (
            <Link to={`/risultato/${p.id}`} className="list-item" key={p.id}>
              <div>
                <div className="list-item-name">{p.name}</div>
                <div className="list-item-meta">
                  {p.classification} · Potenziale {p.potential.toFixed(1)} · {taskCount} compiti
                </div>
              </div>
              <span>→</span>
            </Link>
          );
        })}

      <div className="btn-row">
        <Link to="/nuova-persona" className="btn btn-primary">
          Nuova persona
        </Link>
      </div>
    </div>
  );
}
