import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { getKpi } from '../api';
import KpiCard from '../components/KpiCard';
import StatusBadge from '../components/StatusBadge';

const PIE_COLORS = {
  nuovo:      '#00e5ff',
  in_corso:   '#ff00cc',
  completato: '#aaff00',
  sospeso:    '#ff8800',
  annullato:  '#ff3355',
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      <div className="val">{payload[0]?.value} clienti</div>
      {payload[1] && <div style={{ color: '#aaff00', fontWeight: 700 }}>€ {payload[1]?.value?.toLocaleString('it-IT')}</div>}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{payload[0].name}</div>
      <div className="val">{payload[0].value} clienti</div>
    </div>
  );
};

const pageAnim = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export default function Dashboard() {
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getKpi()
      .then(r => setKpi(r.data))
      .catch(() => setError('Impossibile connettersi al server. Verifica che il backend sia in esecuzione.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <motion.div {...pageAnim} className="page">
      <div className="loader"><div className="spinner" /></div>
    </motion.div>
  );

  if (error) return (
    <motion.div {...pageAnim} className="page">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Panoramica attività clienti</p>
      </div>
      <div className="error-banner">⚠ {error}</div>
    </motion.div>
  );

  const {
    totale, nuovi, in_corso, completati, sospesi,
    budgetTotale, budgetMedio, conversionRate,
    perMese = [], perStato = [], ultimiClienti = []
  } = kpi;

  const statoData = perStato.map(s => ({
    name: { nuovo: 'Nuovo', in_corso: 'In Corso', completato: 'Completato', sospeso: 'Sospeso', annullato: 'Annullato' }[s.stato] ?? s.stato,
    value: s.count,
    fill: PIE_COLORS[s.stato] ?? '#555',
  }));

  return (
    <motion.div {...pageAnim} className="page">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Panoramica in tempo reale — dati aggiornati dal database locale</p>
      </div>

      <div className="kpi-grid">
        <KpiCard icon="⬡" label="Totale Clienti"   value={totale}         gradient="linear-gradient(135deg,#00e5ff,#8800ff)" sub={`${nuovi} nuovi in attesa`} />
        <KpiCard icon="◎" label="In Corso"          value={in_corso}       gradient="linear-gradient(135deg,#ff00cc,#8800ff)" sub="onboarding attivi" />
        <KpiCard icon="✦" label="Completati"        value={completati}     gradient="linear-gradient(135deg,#aaff00,#00e5ff)" sub="onboarding chiusi" />
        <KpiCard icon="◈" label="Budget Totale"     value={budgetTotale}   gradient="linear-gradient(135deg,#aaff00,#ff8800)" format="currency" sub="esclusi annullati" />
        <KpiCard icon="△" label="Budget Medio"      value={budgetMedio}    gradient="linear-gradient(135deg,#00e5ff,#aaff00)" format="currency" sub="per cliente" />
        <KpiCard icon="◉" label="Tasso Conversione" value={conversionRate} gradient="linear-gradient(135deg,#ff00cc,#aaff00)" format="percent" sub={`${sospesi} sospesi`} />
      </div>

      <div className="charts-grid">
        <div className="chart-card glass-card">
          <div className="chart-title">Clienti per Mese — ultimi 6 mesi</div>
          {perMese.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 180, padding: '30px 0' }}>
              <div className="empty-icon">📊</div>
              <div className="empty-title">Nessun dato</div>
              <div className="empty-sub">Aggiungi il primo cliente</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={perMese} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="mese" tick={{ fill: 'rgba(240,240,255,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(240,240,255,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="clienti" fill="url(#barGrad)" radius={[4,4,0,0]} maxBarSize={32} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e5ff" />
                    <stop offset="100%" stopColor="#8800ff" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card glass-card">
          <div className="chart-title">Distribuzione per Stato</div>
          {statoData.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 180, padding: '30px 0' }}>
              <div className="empty-icon">◉</div>
              <div className="empty-title">Nessun dato</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statoData} cx="50%" cy="45%" innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value">
                  {statoData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  iconType="circle" iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: 'rgba(240,240,255,0.55)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="recent-section glass-card" style={{ padding: '20px', marginBottom: 0 }}>
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <div className="chart-title" style={{ marginBottom: 0 }}>Ultimi Clienti</div>
          <Link to="/clienti" className="btn btn-ghost btn-sm">Vedi tutti →</Link>
        </div>

        {ultimiClienti.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-icon">👥</div>
            <div className="empty-title">Nessun cliente ancora</div>
            <div className="empty-sub">
              <Link to="/onboarding" className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>
                ✦ Primo Onboarding
              </Link>
            </div>
          </div>
        ) : (
          <table className="client-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Progetto</th>
                <th>Budget</th>
                <th>Stato</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {ultimiClienti.map(c => (
                <tr key={c.id} onClick={() => window.location.href = `/clienti/${c.id}`} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.nome}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dimmer)' }}>{c.email}</div>
                  </td>
                  <td>{c.tipo_progetto}</td>
                  <td style={{ color: 'var(--lime)', fontWeight: 700 }}>
                    € {Number(c.budget).toLocaleString('it-IT')}
                  </td>
                  <td><StatusBadge stato={c.stato} /></td>
                  <td className="mono">{c.data_creazione.slice(0,10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
