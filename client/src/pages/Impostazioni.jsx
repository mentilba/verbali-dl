import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getImpostazioni, updateImpostazioni, exportCsv } from '../api';
import { useToast } from '../contexts/ToastContext';

const pageAnim = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export default function Impostazioni() {
  const toast = useToast();
  const [form, setForm] = useState({
    nome_freelancer: '',
    email_freelancer: '',
    valuta: 'EUR',
    simbolo_valuta: '€',
    notifiche_email: '1',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    getImpostazioni()
      .then(r => { setForm(r.data); setLoading(false); })
      .catch(() => { toast('Errore nel caricamento impostazioni', 'error'); setLoading(false); });
  }, []);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? (e.target.checked ? '1' : '0') : e.target.value;
    setForm(f => ({ ...f, [k]: v }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateImpostazioni(form);
      setDirty(false);
      toast('Impostazioni salvate', 'success');
    } catch {
      toast('Errore durante il salvataggio', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div {...pageAnim} className="page">
      <div className="page-header">
        <h2>◎ Impostazioni</h2>
        <p>Personalizza ClientFlow AI in base alle tue preferenze</p>
      </div>

      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : (
        <>
          <div className="settings-grid">
            {/* Profilo */}
            <div className="settings-section">
              <div className="settings-section-title">Profilo Freelancer</div>

              <div className="form-group">
                <label className="form-label">Nome visualizzato</label>
                <input className="form-input" value={form.nome_freelancer || ''} onChange={set('nome_freelancer')}
                  placeholder="Il Tuo Nome" />
                <div className="form-hint">Mostrato nella sidebar dell'applicazione</div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email_freelancer || ''} onChange={set('email_freelancer')}
                  placeholder="tuo@email.com" />
              </div>
            </div>

            {/* Valuta */}
            <div className="settings-section">
              <div className="settings-section-title">Valuta & Formato</div>

              <div className="form-group">
                <label className="form-label">Valuta</label>
                <select className="form-select" value={form.valuta || 'EUR'} onChange={set('valuta')}>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="USD">Dollaro (USD)</option>
                  <option value="GBP">Sterlina (GBP)</option>
                  <option value="CHF">Franco Svizzero (CHF)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Simbolo Valuta</label>
                <select className="form-select" value={form.simbolo_valuta || '€'} onChange={set('simbolo_valuta')}>
                  <option value="€">€ Euro</option>
                  <option value="$">$ Dollaro</option>
                  <option value="£">£ Sterlina</option>
                  <option value="CHF">CHF Franco</option>
                </select>
              </div>
            </div>

            {/* Notifiche */}
            <div className="settings-section">
              <div className="settings-section-title">Notifiche</div>

              <div className="toggle-row">
                <span className="toggle-label">Notifiche email</span>
                <label className="toggle">
                  <input type="checkbox" checked={form.notifiche_email === '1'} onChange={set('notifiche_email')} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            {/* Database */}
            <div className="settings-section">
              <div className="settings-section-title">Database & Dati</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => { exportCsv(); toast('Export avviato', 'info'); }}>
                  ↓ Esporta Clienti CSV
                </button>

                <div style={{ padding: '12px', background: 'var(--glass)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dimmer)', marginBottom: 6 }}>Database locale</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--cyan)' }}>
                    server/clientflow.db
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dimmer)', marginTop: 4 }}>
                    SQLite · dati persistenti al riavvio
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* App info */}
          <div className="glass-card" style={{ padding: '20px', marginTop: 20 }}>
            <div className="flex-between">
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }} className="text-gradient">ClientFlow AI</div>
                <div style={{ fontSize: 12, color: 'var(--text-dimmer)', marginTop: 4 }}>
                  v1.0.0 · Gestione onboarding clienti per freelancer · Dati 100% locali
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--lime)' }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--lime)', boxShadow: '0 0 8px var(--lime)',
                    display: 'inline-block'
                  }} />
                  Server attivo
                </div>
                <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
                <div style={{ fontSize: 12, color: 'var(--text-dimmer)' }}>
                  React + Express + SQLite
                </div>
              </div>
            </div>
          </div>

          {/* Save bar */}
          {dirty && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(8,8,26,0.95)', border: '1px solid var(--border-hi)',
                borderRadius: 12, padding: '12px 20px',
                display: 'flex', gap: 12, alignItems: 'center',
                backdropFilter: 'blur(20px)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                zIndex: 100
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>Modifiche non salvate</span>
              <button className="btn btn-ghost btn-sm" onClick={() => { getImpostazioni().then(r => { setForm(r.data); setDirty(false); }); }}>
                Annulla
              </button>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                {saving ? 'Salvataggio...' : '✓ Salva'}
              </button>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
