const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'clientflow.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clienti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL,
      azienda TEXT DEFAULT '',
      tipo_progetto TEXT NOT NULL,
      budget REAL NOT NULL DEFAULT 0,
      stato TEXT NOT NULL DEFAULT 'nuovo',
      note TEXT DEFAULT '',
      data_creazione TEXT NOT NULL,
      data_aggiornamento TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS impostazioni (
      chiave TEXT PRIMARY KEY,
      valore TEXT
    );

    INSERT OR IGNORE INTO impostazioni (chiave, valore) VALUES
      ('nome_freelancer', 'Il Tuo Nome'),
      ('email_freelancer', 'tuo@email.com'),
      ('valuta', 'EUR'),
      ('simbolo_valuta', '€'),
      ('notifiche_email', '1'),
      ('tema', 'dark');
  `);
}

module.exports = { getDb };
