import type { Database, Person, Task } from "./types";
import { DIM_KEYS } from "./types";

const STORAGE_KEY = "ppi-pilot-db-v1";

export function loadDatabase(): Database {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { people: [], tasks: [] };
  try {
    const parsed = JSON.parse(raw);
    return {
      people: Array.isArray(parsed.people) ? parsed.people : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    };
  } catch {
    return { people: [], tasks: [] };
  }
}

export function saveDatabase(db: Database): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function addPerson(db: Database, person: Person): Database {
  return { ...db, people: [...db.people, person] };
}

export function addTask(db: Database, task: Task): Database {
  return { ...db, tasks: [...db.tasks, task] };
}

export function updateTask(db: Database, taskId: string, updates: Partial<Task>): Database {
  return {
    ...db,
    tasks: db.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
  };
}

export function deletePerson(db: Database, personId: string): Database {
  return {
    people: db.people.filter((p) => p.id !== personId),
    tasks: db.tasks.filter((t) => t.personId !== personId),
  };
}

export function deleteTask(db: Database, taskId: string): Database {
  return { ...db, tasks: db.tasks.filter((t) => t.id !== taskId) };
}

function csvEscape(value: string | number | undefined): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const CSV_HEADERS = [
  "person_id",
  "person_name",
  "person_age",
  "person_role",
  "evaluation_type",
  "person_created_at",
  ...DIM_KEYS.map((d) => `person_${d}`),
  "person_top1",
  "person_top2",
  "person_delta",
  "person_classification",
  "person_potential",
  "task_id",
  "task_name",
  "task_description",
  ...DIM_KEYS.map((d) => `task_req_${d}`),
  "coverage",
  "utilizzo",
  "positioning",
  "predicted_impact",
  "real_impact",
  "energy",
  "task_created_at",
  "real_impact_date",
];

export function exportToCsv(db: Database): string {
  const rows: string[] = [CSV_HEADERS.join(",")];

  for (const person of db.people) {
    const personTasks = db.tasks.filter((t) => t.personId === person.id);
    if (personTasks.length === 0) {
      rows.push(
        [
          person.id,
          csvEscape(person.name),
          person.age ?? "",
          csvEscape(person.role),
          person.evaluationType,
          person.createdAt,
          ...DIM_KEYS.map((d) => person.scores[d]),
          person.top1,
          person.top2,
          person.delta,
          csvEscape(person.classification),
          person.potential,
          "", "", "",
          ...DIM_KEYS.map(() => ""),
          "", "", "", "", "", "", "", "",
        ].join(",")
      );
      continue;
    }
    for (const task of personTasks) {
      rows.push(
        [
          person.id,
          csvEscape(person.name),
          person.age ?? "",
          csvEscape(person.role),
          person.evaluationType,
          person.createdAt,
          ...DIM_KEYS.map((d) => person.scores[d]),
          person.top1,
          person.top2,
          person.delta,
          csvEscape(person.classification),
          person.potential,
          task.id,
          csvEscape(task.name),
          csvEscape(task.description),
          ...DIM_KEYS.map((d) => task.requirements[d]),
          task.coverage,
          task.utilizzo,
          task.positioning,
          task.predictedImpact,
          task.realImpact ?? "",
          task.energy ?? "",
          task.createdAt,
          task.realImpactDate ?? "",
        ].join(",")
      );
    }
  }

  return rows.join("\n");
}

export function exportToJson(db: Database): string {
  return JSON.stringify(db, null, 2);
}

export function parseImportedJson(jsonText: string): Database {
  const parsed = JSON.parse(jsonText);
  if (!Array.isArray(parsed.people) || !Array.isArray(parsed.tasks)) {
    throw new Error("Formato JSON non valido: mancano people o tasks");
  }
  return { people: parsed.people, tasks: parsed.tasks };
}

export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
