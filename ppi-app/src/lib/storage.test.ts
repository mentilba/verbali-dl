import { describe, it, expect, beforeEach } from "vitest";
import {
  loadDatabase,
  saveDatabase,
  addPerson,
  addTask,
  exportToCsv,
  exportToJson,
  parseImportedJson,
} from "./storage";
import type { Database, Person, Task } from "./types";

const person: Person = {
  id: "p1",
  name: "Test Person",
  evaluationType: "auto",
  createdAt: "2026-01-01",
  answers: Array(18).fill(5),
  scores: { G: 5, A: 5, R: 5, S: 5, E: 5, Q: 5 },
  top1: "G",
  top2: "A",
  delta: 0,
  classification: "IBRIDO",
  potential: 5,
};

const task: Task = {
  id: "t1",
  personId: "p1",
  name: "Test Task",
  requirements: { G: 5, A: 5, R: 5, S: 5, E: 5, Q: 5 },
  coverage: 8,
  utilizzo: 7,
  positioning: 7.5,
  predictedImpact: 3.75,
  createdAt: "2026-01-02",
};

beforeEach(() => {
  localStorage.clear();
});

describe("loadDatabase/saveDatabase", () => {
  it("ritorna database vuoto se non esiste nulla", () => {
    expect(loadDatabase()).toEqual({ people: [], tasks: [] });
  });

  it("salva e ricarica correttamente", () => {
    const db: Database = { people: [person], tasks: [task] };
    saveDatabase(db);
    expect(loadDatabase()).toEqual(db);
  });
});

describe("addPerson/addTask", () => {
  it("aggiunge persone e compiti senza mutare l'originale", () => {
    const db: Database = { people: [], tasks: [] };
    const db2 = addPerson(db, person);
    expect(db.people).toHaveLength(0);
    expect(db2.people).toHaveLength(1);
    const db3 = addTask(db2, task);
    expect(db3.tasks).toHaveLength(1);
  });
});

describe("exportToCsv", () => {
  it("include intestazioni e una riga per combinazione persona-compito", () => {
    const db: Database = { people: [person], tasks: [task] };
    const csv = exportToCsv(db);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("person_id");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("p1");
    expect(lines[1]).toContain("t1");
  });
});

describe("exportToJson/parseImportedJson", () => {
  it("esporta e reimporta correttamente", () => {
    const db: Database = { people: [person], tasks: [task] };
    const json = exportToJson(db);
    const imported = parseImportedJson(json);
    expect(imported).toEqual(db);
  });

  it("lancia errore su JSON non valido", () => {
    expect(() => parseImportedJson('{"foo": 1}')).toThrow();
  });
});
