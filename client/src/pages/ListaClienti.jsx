import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getClienti, deleteCliente } from '../api';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../contexts/ToastContext';

const FILTRI = [
  { key: 'tutti',      label: 'Tutti' },
  { key: 'nuovo',      label: 'Nuovi' },
  { key: 'in_corso',   label: 'In Corso' },
  { key: 'completato', label: 'Completati' },
  { key: 'sospeso',    label: 'Sospesi' },
  { key: 'annullato',  label: 'Annullati' },
];

const pageAnim = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

function initials(nome = '') {
  return nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

export default function ListaClienti() {
  const toast = useToast();
  const navigate = useNavigate();

  const [clienti, setClienti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('tutti');
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filtro !== 'tutti') params.stato = filtro;
    if (search.trim()) params.q = search.trim();
    getClienti(params)
      .then(r => setClienti(r.data))
      .catch(() => toast('Errore nel caricamento clienti', 'error'))
      .finally(() => setLoading(false));
  }, [filtro, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const handleDelete = async (id, nome) => {
    if (!window.confirm(`Eliminare definitivamente "${nome}"?`)) return;
    setDeleting(id);
    try {
      await deleteCliente(id);
      setClienti(c => c.filter(x => x.id !== id));
      toast(`"${nome}" eliminato`, 'success');
    } catch {
      toast('Errore durante l\'eliminazione', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const gradients = [
    'linear-gradient(135deg,#00e5ff,#8800ff)',
    'linear-gradient(135deg,#ff00cc,#8800ff)',
    'linear-gradient(135deg,#aaff00,#00e5ff)',
    'linear-gradient(135deg,#ff8800,#ff00cc)',
    'linear-gradient(135deg,#00e5ff,#aaff00)',
  ];

  return (
    <motion.div {...pageAnim} className="page">
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>⬡ Clienti</h2>
          <p>Gestisci e monitora tutti i tuoi clienti</p>
        </div>
        <Link to="/onboarding" className="btn btn-primary">✦ Nuovo Onboarding</Link>
      </div>

      {/* Toolbar */}
      <div className="list-toolbar">
        <div className="search-input-wrap">
          <span className="search-icon">⌕</span>
          <input
            className="form-input"
            placeholder="Cerca per nome, email, azienda..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {FILTRI.map(f => (
            <button
              key={f.key}
              className={`filter-tab ${filtro === f.key ? 'active' : ''}`}
              onClick={() => setFiltro(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      {!loading && (
        <div style={{ fontSize: 12, color: 'var(--text-dimmer)', marginBottom: 16 }}>
          {clienti.length === 0 ? 'Nessun risultato' : `${clienti.length} client${clienti.length === 1 ? 'e' : 'i'}`}
        </div>
      )}

      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : clienti.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">
              {search ? 'Nessun cliente trovato' : 'Nessun cliente ancora'}
            </div>
            <div className="empty-sub">
              {search
                ? 'Prova con termini di ricerca diversi'
                : 'Avvia il primo onboarding per aggiungere un cliente'}
            </div>
            {!search && (
              <Link to="/onboarding" className="btn btn-primary" style={{ marginTop: 16 }}>
                ✦ Nuovo Onboarding
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="clients-grid">
          <AnimatePresence>
            {clienti.map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.04, duration: 0.25 } }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                className="client-card"
                onClick={() => navigate(`/clienti/${c.id}`)}
              >
                <div className="client-card-header">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div className="client-avatar" style={{ background: gradients[c.id % gradients.length] }}>
                      {initials(c.nome)}
                    </div>
                    <div>
                      <div className="client-card-name">{c.nome}</div>
                      <div className="client-card-email">{c.email}</div>
                      {c.azienda && (
                        <div style={{ fontSize: 11, color: 'var(--text-dimmer)', marginTop: 2 }}>
                          🏢 {c.azienda}
                        </div>
                      )}
                    </div>
                  </div>
                  <StatusBadge stato={c.stato} />
                </div>

                <div className="client-card-body">
                  <div className="client-card-row">
                    <span className="client-card-label">Progetto</span>
                    <span className="client-card-value">{c.tipo_progetto}</span>
                  </div>
                  <div className="client-card-row">
                    <span className="client-card-label">Budget</span>
                    <span className="client-budget">€ {Number(c.budget).toLocaleString('it-IT')}</span>
                  </div>
                  <div className="client-card-row">
                    <span className="client-card-label">Aggiunto</span>
                    <span className="client-card-value monospace" style={{ fontSize: 11 }}>
                      {new Date(c.data_creazione).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                </div>

                <div className="client-card-actions" onClick={e => e.stopPropagation()}>
                  <Link to={`/clienti/${c.id}`} className="btn btn-ghost btn-sm" style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}>
                    Modifica
                  </Link>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(c.id, c.nome)}
                    disabled={deleting === c.id}
                    style={{ minWidth: 36 }}
                  >
                    {deleting === c.id ? '...' : '✕'}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
