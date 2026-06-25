const express = require('express');
const cors = require('cors');
const { getDb } = require('./db');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ─── CLIENTI ──────────────────────────────────────────────────────────────────

app.get('/api/clienti', (req, res) => {
  try {
    const db = getDb();
    const { stato, q } = req.query;
    let sql = 'SELECT * FROM clienti';
    const params = [];
    const where = [];
    if (stato && stato !== 'tutti') { where.push("stato = ?"); params.push(stato); }
    if (q) { where.push("(LOWER(nome) LIKE ? OR LOWER(email) LIKE ? OR LOWER(azienda) LIKE ?)"); const like = `%${q.toLowerCase()}%`; params.push(like, like, like); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY data_creazione DESC';
    res.json(db.prepare(sql).all(...params));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/clienti/:id', (req, res) => {
  try {
    const db = getDb();
    const c = db.prepare('SELECT * FROM clienti WHERE id = ?').get(req.params.id);
    if (!c) return res.status(404).json({ error: 'Cliente non trovato' });
    res.json(c);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/clienti', (req, res) => {
  try {
    const db = getDb();
    const { nome, email, azienda = '', tipo_progetto, budget, stato = 'nuovo', note = '' } = req.body;
    if (!nome || !email || !tipo_progetto) return res.status(400).json({ error: 'Campi obbligatori mancanti' });
    const now = new Date().toISOString();
    const result = db.prepare(
      `INSERT INTO clienti (nome, email, azienda, tipo_progetto, budget, stato, note, data_creazione, data_aggiornamento)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(nome, email, azienda, tipo_progetto, Number(budget) || 0, stato, note, now, now);
    res.status(201).json(db.prepare('SELECT * FROM clienti WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/clienti/:id', (req, res) => {
  try {
    const db = getDb();
    const { nome, email, azienda = '', tipo_progetto, budget, stato, note = '' } = req.body;
    const now = new Date().toISOString();
    const info = db.prepare(
      `UPDATE clienti SET nome=?, email=?, azienda=?, tipo_progetto=?, budget=?, stato=?, note=?, data_aggiornamento=?
       WHERE id=?`
    ).run(nome, email, azienda, tipo_progetto, Number(budget) || 0, stato, note, now, req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Cliente non trovato' });
    res.json(db.prepare('SELECT * FROM clienti WHERE id = ?').get(req.params.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/clienti/:id', (req, res) => {
  try {
    const db = getDb();
    const info = db.prepare('DELETE FROM clienti WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Cliente non trovato' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── KPI ──────────────────────────────────────────────────────────────────────

app.get('/api/kpi', (req, res) => {
  try {
    const db = getDb();
    const g = (sql, ...p) => db.prepare(sql).get(...p);

    const totale       = g("SELECT COUNT(*) c FROM clienti").c;
    const nuovi        = g("SELECT COUNT(*) c FROM clienti WHERE stato='nuovo'").c;
    const in_corso     = g("SELECT COUNT(*) c FROM clienti WHERE stato='in_corso'").c;
    const completati   = g("SELECT COUNT(*) c FROM clienti WHERE stato='completato'").c;
    const sospesi      = g("SELECT COUNT(*) c FROM clienti WHERE stato='sospeso'").c;
    const annullati    = g("SELECT COUNT(*) c FROM clienti WHERE stato='annullato'").c;
    const budgetTotale = g("SELECT COALESCE(SUM(budget),0) v FROM clienti WHERE stato != 'annullato'").v;
    const budgetMedio  = g("SELECT COALESCE(AVG(budget),0) v FROM clienti WHERE stato != 'annullato'").v;
    const conversionRate = totale > 0 ? +((completati / totale) * 100).toFixed(1) : 0;

    const perMese = db.prepare(`
      SELECT strftime('%m/%Y', data_creazione) mese,
             strftime('%Y%m', data_creazione) sort,
             COUNT(*) clienti,
             COALESCE(SUM(budget),0) budget
      FROM clienti
      WHERE data_creazione >= datetime('now', '-6 months')
      GROUP BY strftime('%Y-%m', data_creazione)
      ORDER BY sort ASC
    `).all();

    const perStato = db.prepare(`
      SELECT stato, COUNT(*) count FROM clienti GROUP BY stato
    `).all();

    const perProgetto = db.prepare(`
      SELECT tipo_progetto, COUNT(*) count, COALESCE(SUM(budget),0) budget
      FROM clienti GROUP BY tipo_progetto ORDER BY count DESC LIMIT 6
    `).all();

    const ultimiClienti = db.prepare(
      "SELECT * FROM clienti ORDER BY data_creazione DESC LIMIT 5"
    ).all();

    res.json({
      totale, nuovi, in_corso, completati, sospesi, annullati,
      budgetTotale, budgetMedio, conversionRate,
      perMese, perStato, perProgetto, ultimiClienti
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── IMPOSTAZIONI ─────────────────────────────────────────────────────────────

app.get('/api/impostazioni', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM impostazioni').all();
    const s = {};
    rows.forEach(r => s[r.chiave] = r.valore);
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/impostazioni', (req, res) => {
  try {
    const db = getDb();
    const upsert = db.prepare('INSERT OR REPLACE INTO impostazioni (chiave, valore) VALUES (?, ?)');
    const tx = db.transaction((data) => {
      for (const [k, v] of Object.entries(data)) upsert.run(k, String(v));
    });
    tx(req.body);
    const rows = db.prepare('SELECT * FROM impostazioni').all();
    const s = {};
    rows.forEach(r => s[r.chiave] = r.valore);
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── EXPORT ───────────────────────────────────────────────────────────────────

app.get('/api/export/csv', (req, res) => {
  try {
    const db = getDb();
    const clienti = db.prepare('SELECT * FROM clienti ORDER BY data_creazione DESC').all();
    const header = 'ID,Nome,Email,Azienda,Tipo Progetto,Budget,Stato,Note,Data Creazione';
    const rows = clienti.map(c =>
      [c.id, `"${c.nome}"`, `"${c.email}"`, `"${c.azienda}"`, `"${c.tipo_progetto}"`,
       c.budget, c.stato, `"${(c.note||'').replace(/"/g,'""')}"`,
       c.data_creazione.slice(0,10)].join(',')
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=clienti-clientflow.csv');
    res.send([header, ...rows].join('\n'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log(`\n✅  ClientFlow AI  →  http://localhost:${PORT}\n`);
});
