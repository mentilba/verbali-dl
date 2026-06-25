import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NuovoOnboarding from './pages/NuovoOnboarding';
import ListaClienti from './pages/ListaClienti';
import DettaglioCliente from './pages/DettaglioCliente';
import Impostazioni from './pages/Impostazioni';

export default function App() {
  const location = useLocation();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/onboarding"    element={<NuovoOnboarding />} />
            <Route path="/clienti"       element={<ListaClienti />} />
            <Route path="/clienti/:id"   element={<DettaglioCliente />} />
            <Route path="/impostazioni"  element={<Impostazioni />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}
