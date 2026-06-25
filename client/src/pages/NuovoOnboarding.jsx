import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createCliente } from '../api';
import { useToast } from '../contexts/ToastContext';

const TIPI_PROGETTO = [
  { id: 'Web Development',    icon: '🌐', desc: 'Siti e web app' },
  { id: 'App Mobile',         icon: '📱', desc: 'iOS & Android' },
  { id: 'Design UI/UX',       icon: '🎨', desc: 'Interfacce e prototipi' },
  { id: 'Marketing Digitale', icon: '📣', desc: 'Campagne e social' },
  { id: 'E-commerce',         icon: '🛒', desc: 'Negozi online' },
  { id: 'Consulenza',         icon: '💼', desc: 'Strategia e advisory' },
  { id: 'SEO & Content',      icon: '🔍', desc: 'Visibilità organica' },
  { id: 'Automazione',        icon: '⚙️',  desc: 'Workflow e integrazioni' },
];

const STEPS = ['Info Cliente', 'Tipo Progetto', 'Budget & Note', 'Conferma'];

const SUBMISSION_STEPS = [
  { label: 'Validazione dati cliente...',    icon: '◈' },
  { label: 'Salvataggio nel database...',    icon: '◎' },
  { label: 'Configurazione progetto...',     icon: '⬡' },
  { label: 'Onboarding completato!',         icon: '✦' },
];

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:  (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.2 } }),
};

const pageAnim = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export default function NuovoOnboarding() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [subStep, setSubStep] = useState(-1);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    nome: '', email: '', azienda: '',
    tipo_progetto: '',
    budget: '', note: '', stato: 'nuovo',
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const pick = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.nome.trim())  e.nome  = 'Il nome è obbligatorio';
      if (!form.email.trim()) e.email = "L'email è obbligatoria";
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email non valida';
    }
    if (step === 1 && !form.tipo_progetto) e.tipo_progetto = 'Seleziona un tipo di progetto';
    if (step === 2) {
      if (!form.budget || Number(form.budget) <= 0) e.budget = 'Inserisci un budget valido';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate()) return;
    setDir(1);
    setStep(s => s + 1);
  };

  const prev = () => {
    setDir(-1);
    setStep(s => s - 1);
    setErrors({});
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setStep(3);
    setDir(1);

    // Animated submission sequence
    for (let i = 0; i < SUBMISSION_STEPS.length - 1; i++) {
      setSubStep(i);
      await new Promise(r => setTimeout(r, 700 + Math.random() * 300));
    }

    try {
      await createCliente({
        ...form,
        budget: Number(form.budget),
      });
      setSubStep(SUBMISSION_STEPS.length - 1);
      await new Promise(r => setTimeout(r, 400));
      setDone(true);
      toast('Cliente aggiunto con successo!', 'success');
      setTimeout(() => navigate('/clienti'), 2000);
    } catch {
      toast('Errore durante il salvataggio. Verifica il server.', 'error');
      setSubmitting(false);
      setStep(2);
      setSubStep(-1);
    }
  };

  return (
    <motion.div {...pageAnim} className="page">
      <div className="page-header">
        <h2>✦ Nuovo Onboarding</h2>
        <p>Guida il cliente attraverso il processo di avvio in pochi passi</p>
      </div>

      {/* Stepper */}
      <div className="stepper">
        {STEPS.map((label, i) => (
          <div key={i} className={`step-item ${i < step ? 'done' : i === step ? 'active' : ''}`}>
            <div className="step-circle">
              {i < step ? '✓' : i + 1}
            </div>
            <div className="step-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '32px', maxWidth: 660, margin: '0 auto' }}>
        <AnimatePresence mode="wait" custom={dir}>
          {/* ── Step 0: Info Cliente ── */}
          {step === 0 && (
            <motion.div key="step0" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit">
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Informazioni Cliente</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 24 }}>
                Inserisci i dati del nuovo cliente
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nome e Cognome <span>*</span></label>
                  <input className={`form-input ${errors.nome ? 'error' : ''}`}
                    value={form.nome} onChange={set('nome')} placeholder="Mario Rossi" />
                  {errors.nome && <div className="form-error">{errors.nome}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email <span>*</span></label>
                  <input className={`form-input ${errors.email ? 'error' : ''}`}
                    type="email" value={form.email} onChange={set('email')} placeholder="mario@azienda.com" />
                  {errors.email && <div className="form-error">{errors.email}</div>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Azienda <span style={{ color: 'var(--text-dimmer)' }}>(opzionale)</span></label>
                <input className="form-input" value={form.azienda} onChange={set('azienda')} placeholder="Acme S.r.l." />
              </div>
              <div className="flex-row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-primary" onClick={next}>Avanti →</button>
              </div>
            </motion.div>
          )}

          {/* ── Step 1: Tipo Progetto ── */}
          {step === 1 && (
            <motion.div key="step1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit">
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Tipo di Progetto</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 20 }}>
                Seleziona la categoria che meglio descrive il lavoro
              </p>
              <div className="project-grid">
                {TIPI_PROGETTO.map(t => (
                  <div
                    key={t.id}
                    className={`project-card ${form.tipo_progetto === t.id ? 'selected' : ''}`}
                    onClick={() => pick('tipo_progetto', t.id)}
                  >
                    <div className="project-card-icon">{t.icon}</div>
                    <div className="project-card-name">{t.id}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dimmer)', marginTop: 3 }}>{t.desc}</div>
                  </div>
                ))}
              </div>
              {errors.tipo_progetto && <div className="form-error" style={{ marginTop: 10 }}>{errors.tipo_progetto}</div>}
              <div className="flex-row" style={{ justifyContent: 'space-between', marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={prev}>← Indietro</button>
                <button className="btn btn-primary" onClick={next}>Avanti →</button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Budget & Note ── */}
          {step === 2 && (
            <motion.div key="step2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit">
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Budget & Dettagli</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 24 }}>
                Definisci il budget e lo stato iniziale dell'onboarding
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Budget Progetto <span>*</span></label>
                  <div className="input-prefix">
                    <span className="input-prefix-label">€</span>
                    <input className={`form-input ${errors.budget ? 'error' : ''}`}
                      type="number" min="0" step="100"
                      value={form.budget} onChange={set('budget')} placeholder="5000" />
                  </div>
                  {errors.budget && <div className="form-error">{errors.budget}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Stato Iniziale</label>
                  <select className="form-select" value={form.stato} onChange={set('stato')}>
                    <option value="nuovo">⚪ Nuovo</option>
                    <option value="in_corso">🔵 In Corso</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Note <span style={{ color: 'var(--text-dimmer)' }}>(opzionale)</span></label>
                <textarea className="form-textarea" value={form.note} onChange={set('note')}
                  placeholder="Requisiti speciali, scadenze, riferimenti importanti..." />
              </div>
              <div className="flex-row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={prev}>← Indietro</button>
                <button className="btn btn-magenta" onClick={submit} disabled={submitting}>
                  {submitting ? '...' : '✦ Avvia Onboarding'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Animazione invio ── */}
          {step === 3 && (
            <motion.div key="step3" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit">
              {!done ? (
                <div className="submission-overlay">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--cyan), var(--magenta))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 28, margin: '0 auto 16px',
                      animation: 'spin 2s linear infinite',
                    }}>✦</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                      Elaborazione in corso...
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dimmer)', marginTop: 4 }}>
                      {form.nome} — {form.tipo_progetto}
                    </div>
                  </div>
                  <div className="submission-steps">
                    {SUBMISSION_STEPS.map((s, i) => (
                      <motion.div
                        key={i}
                        className={`sub-step ${i < subStep ? 'done' : i === subStep ? 'active' : ''}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: i <= subStep ? 1 : 0.35, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="sub-step-dot">
                          {i < subStep ? '✓' : s.icon}
                        </div>
                        <div className="sub-step-label">{s.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div
                  className="submission-overlay"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="success-icon">✓</div>
                  <div>
                    <div className="success-title">Onboarding Completato!</div>
                    <div className="success-sub" style={{ marginTop: 8 }}>
                      {form.nome} è stato aggiunto con successo.<br />
                      Reindirizzamento alla lista clienti...
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', padding: '10px 20px', background: 'var(--glass)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-dimmer)' }}>Progetto</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)' }}>{form.tipo_progetto}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px 20px', background: 'var(--glass)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-dimmer)' }}>Budget</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lime)' }}>€ {Number(form.budget).toLocaleString('it-IT')}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
