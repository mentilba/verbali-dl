import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home-hero">
      <h1>DOVE DAI IL MEGLIO?</h1>
      <p className="lead">Scopri dove il tuo potenziale produce il massimo impatto.</p>

      <div className="formula-hero">
        <span>POTENZIALE</span>
        <span>×</span>
        <span>POSIZIONAMENTO</span>
        <span>=</span>
        <span>IMPATTO</span>
      </div>

      <p className="principle-text">
        Non partiamo da ciò che devi migliorare. Misuriamo ciò che esprimi già
        meglio e verifichiamo in quali compiti può produrre più valore.
      </p>

      <div className="btn-row" style={{ justifyContent: "center" }}>
        <Link to="/nuova-persona" className="btn btn-primary">
          INIZIA IL TEST
        </Link>
        <Link to="/dashboard" className="btn btn-secondary">
          Pilot Dashboard
        </Link>
      </div>
    </div>
  );
}
