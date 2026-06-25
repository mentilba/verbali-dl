import { useEffect, useRef, useState } from 'react';

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = Number(target) || 0;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(from + (to - from) * ease);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return val;
}

export default function KpiCard({ icon, label, value, sub, gradient, format = 'number' }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0);

  const display = () => {
    const v = animated;
    if (format === 'currency') return `€ ${v.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    if (format === 'percent') return `${v.toFixed(1)}%`;
    return Math.round(v).toLocaleString('it-IT');
  };

  return (
    <div className="kpi-card" style={{ '--gradient': gradient }}>
      <div className="kpi-glow" />
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{
        background: gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        {typeof value === 'number' ? display() : value}
      </div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}
