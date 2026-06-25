import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getImpostazioni } from '../api';

const NAV = [
  { path: '/',             icon: '◈', label: 'Dashboard' },
  { path: '/onboarding',   icon: '✦', label: 'Nuovo Onboarding' },
  { path: '/clienti',      icon: '⬡', label: 'Clienti' },
  { path: '/impostazioni', icon: '◎', label: 'Impostazioni' },
];

export default function Sidebar() {
  const location = useLocation();
  const [nome, setNome] = useState('...');

  useEffect(() => {
    getImpostazioni()
      .then(r => setNome(r.data.nome_freelancer || 'Utente'))
      .catch(() => {});
  }, [location.pathname]);

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <h1>ClientFlow AI</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span className="sidebar-badge">PRO</span>
          <span className="sidebar-brand" style={{ padding: 0, fontSize: 11, color: 'var(--text-dimmer)', border: 'none', margin: 0 }}>
            v1.0.0
          </span>
        </div>
      </div>

      <div className="sidebar-nav">
        <div className="sidebar-label">Menu</div>
        {NAV.map(({ path, icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-label">Freelancer</div>
        <div className="sidebar-footer-name">{nome}</div>
        <div style={{
          marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, color: 'var(--text-dimmer)'
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--lime)',
            boxShadow: '0 0 6px var(--lime)',
            display: 'inline-block', flexShrink: 0
          }} />
          Server connesso
        </div>
      </div>
    </nav>
  );
}
