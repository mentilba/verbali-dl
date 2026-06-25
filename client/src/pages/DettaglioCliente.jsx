import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCliente, updateCliente, deleteCliente } from '../api';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../contexts/ToastContext';

const TIPI = ['Web Development','App Mobile','Design UI/UX','Marketing Digitale','E-commerce','Consulenza','SEO & Content','Automazione'];

const pageAnim = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

function initials(nome = '') {
  return nome.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase() || '?';
}

export default function DettaglioCliente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [cliente, setCliente] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCliente(id)
      .then(r => { setCliente(r.data); setForm(r.data); })
      .catch(() => setError('Cliente non trovato'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateCliente(id, form);
      setCliente(updated.data);
      setForm(updated.data);
      setDirty(false);
      toast('Cliente aggiornato con successo', 'success');
    } catch {
      toast('Errore durante il salvataggio', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Eliminare definitivamente "${cliente.nome}"?`)) return;
    try {
      await deleteCliente(id);
      toast(`"${cliente.nome}" eliminato`, 'success');
      navigate('/clienti');
    } catch {
      toast('Errore durante l\'eliminazione', 'error');
    }
  };

  if (loading) return (
    <motion.div {...pageAnim} className="page">
      <div className="loader"><div className="spinner" /></div>
    </motion.div>
  );

  if (error) return (
    <motion.div {...pageAnim} className="page">
      <Link to="/clienti" className="back-link">← Torna ai Clienti</Link>
      <div className="error-banner">⚠ {error}</div>
    </motion.div>
  );

  const gradients = [
    'linear-gradient(135deg,#00e5ff,#8800ff)',
    'linear-gradient(135deg,#ff00cc,#8800ff)',
    'linear-gradient(135deg,#aaff00,#00e5ff)',
    'linear-gradient(135deg,#ff8800,#ff00cc)',
    'linear-gradient(135deg,#00e5ff,#aaff00)',
  ];
  const grad = gradients[Number(id) % gradients.length];

  return (
    <motion.div {...pageAnim} className="page">
      <Link to="/clienti" className="back-link">← Torna ai Clienti</Link>

      {/* Header */}
      <div className="detail-header">
        <div className="detail-avatar" style={{ background: grad }}>
          {initials(cliente.nome)}
        </div>
        <div>
          <div className="detail-name">{cliente.nome}</div>
          <div className="detail-email">{cliente.email}</div>
          {cliente.azienda && (
            <div style={{ fontSize: 12, color: 'var(--text-dimmer)', marginTop: 4 }}>
              🏢 {cliente.azienda}
            </div>
          )}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <StatusBadge stato={cliente.stato} />
        </div>
      </div>

      <div className="detail-grid">
        {/* Left: edit form */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 20,
            textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            Modifica Informazioni
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nome e Cognome <span>*</span></label>
              <input className="form-input" value={form.nome || ''} onChange={set('nome')} />
            </div>
            <div className="form-group">
              <label className="form-label">Email <span>*</span></label>
              <input className="form-input" type="email" value={form.email || ''} onChange={set('email')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Azienda</label>
            <input className="form-input" value={form.azienda || ''} onChange={set('azienda')} placeholder="Nome azienda" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipo Progetto</label>
              <select className="form-select" value={form.tipo_progetto || ''} onChange={set('tipo_progetto')}>
                {TIPI.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Stato</label>
              <select className="form-select" value={form.stato || ''} onChange={set('stato')}>
                <option value="nuovo">Nuovo</option>
                <option value="in_corso">In Corso</option>
                <option value="completato">Completato</option>
                <option value="sospeso">Sospeso</option>
                <option value="annullato">Annullato</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Budget</label>
            <div className="input-prefix">
              <span className="input-prefix-label">€</span>
              <input className="form-input" type="number" min="0" step="100"
                value={form.budget || ''} onChange={set('budget')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Note</label>
            <textarea className="form-textarea" value={form.note || ''} onChange={set('note')}
              placeholder="Note interne sul cliente..." />
          </div>

          <div className="flex-row" style={{ justifyContent: 'space-between' }}>
            <button className="btn btn-danger btn-sm" onClick={remove}>✕ Elimina</button>
            <button className="btn btn-primary" onClick={save} disabled={saving || !dirty}>
              {saving ? 'Salvataggio...' : dirty ? '✓ Salva Modifiche' : 'Salvato'}
            </button>
          </div>
        </div>

        {/* Right: meta info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Budget highlight */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dimmer)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Budget Progetto
            </div>
            <div className="detail-budget-big">
              € {Number(cliente.budget).toLocaleString('it-IT')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dimmer)', marginTop: 6 }}>
              {cliente.tipo_progetto}
            </div>
          </div>

          {/* Timeline info */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dimmer)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
              Timeline
            </div>
            <div className="detail-meta">
              <div className="detail-meta-item">
                <span className="detail-meta-label">Data Aggiunta</span>
                <span className="detail-meta-value">
                  {new Date(cliente.data_creazione).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="detail-meta-item">
                <span className="detail-meta-label">Ultimo Aggiornamento</span>
                <span className="detail-meta-value">
                  {new Date(cliente.data_aggiornamento).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="detail-meta-item">
                <span className="detail-meta-label">ID Interno</span>
                <span className="detail-meta-value monospace">#{String(cliente.id).padStart(4,'0')}</span>
              </div>
            </div>
          </div>

          {/* Note preview */}
          {cliente.note && (
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dimmer)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Note
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                {cliente.note}
              </div>
            </div>
          )}

          {/* Status change shortcuts */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dimmer)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Cambia Stato Rapido
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['nuovo','in_corso','completato','sospeso','annullato'].map(s => (
                <button
                  key={s}
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start' }}
                  disabled={form.stato === s}
                  onClick={() => { setForm(f => ({ ...f, stato: s })); setDirty(true); }}
                >
                  <StatusBadge stato={s} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
