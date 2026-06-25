const LABELS = {
  nuovo:      'Nuovo',
  in_corso:   'In Corso',
  completato: 'Completato',
  sospeso:    'Sospeso',
  annullato:  'Annullato',
};

export default function StatusBadge({ stato }) {
  return (
    <span className={`badge badge-${stato}`}>
      <span className="badge-dot" />
      {LABELS[stato] ?? stato}
    </span>
  );
}
