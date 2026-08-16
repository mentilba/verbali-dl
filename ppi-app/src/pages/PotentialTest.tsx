import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QUESTIONS } from "../data/questions";
import { useDb } from "../lib/db-context";
import { addPerson } from "../lib/storage";
import {
  classifyProfile,
  computeDimensionScores,
  computePotential,
  validateAnswer,
} from "../lib/formulas";
import type { Person } from "../lib/types";

interface DraftPerson {
  id: string;
  name: string;
  age?: number;
  role?: string;
  evaluationType: "auto" | "esterna";
  createdAt: string;
}

export default function PotentialTest() {
  const { personId } = useParams();
  const navigate = useNavigate();
  const { db, setDb } = useDb();

  const [answers, setAnswers] = useState<(number | null)[]>(Array(18).fill(null));
  const [index, setIndex] = useState(0);

  const question = QUESTIONS[index];
  const current = answers[index];
  const allAnswered = answers.every((a) => a !== null);

  function selectValue(value: number) {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
    if (index < QUESTIONS.length - 1) {
      setTimeout(() => setIndex(index + 1), 150);
    }
  }

  function handleFinish() {
    if (!allAnswered || !personId) return;

    const raw = sessionStorage.getItem("ppi-draft-person");
    if (!raw) {
      navigate("/nuova-persona");
      return;
    }
    const draft: DraftPerson = JSON.parse(raw);

    const finalAnswers = answers.map((a) => a as number);
    for (const a of finalAnswers) {
      if (!validateAnswer(a)) {
        return;
      }
    }

    const scores = computeDimensionScores(finalAnswers);
    const potential = computePotential(scores);
    const { classification, label, top1, top2, delta } = classifyProfile(scores);

    const person: Person = {
      id: draft.id,
      name: draft.name,
      age: draft.age,
      role: draft.role,
      evaluationType: draft.evaluationType,
      createdAt: draft.createdAt,
      answers: finalAnswers,
      scores,
      top1,
      top2,
      delta,
      classification: label ?? classification,
      potential,
    };

    setDb(addPerson(db, person));
    sessionStorage.removeItem("ppi-draft-person");
    navigate(`/risultato/${person.id}`);
  }

  return (
    <div>
      <h1 className="page-title">Test del potenziale</h1>
      <p className="page-subtitle">
        Per ogni affermazione, assegna un voto da 1 (per niente vero) a 10
        (estremamente vero e ricorrente).
      </p>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((index + 1) / QUESTIONS.length) * 100}%` }}
        />
      </div>

      <div className="card">
        <div className="question-eyebrow">
          Domanda {index + 1} di {QUESTIONS.length}
        </div>
        <div className="question-text">{question.text}</div>

        <div className="scale-grid">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
            <button
              key={val}
              type="button"
              className={`scale-btn ${current === val ? "selected" : ""}`}
              onClick={() => selectValue(val)}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      <div className="btn-row">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          Indietro
        </button>
        {index < QUESTIONS.length - 1 ? (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={current === null}
            onClick={() => setIndex(index + 1)}
          >
            Avanti
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!allAnswered}
            onClick={handleFinish}
          >
            Calcola profilo
          </button>
        )}
      </div>
    </div>
  );
}
