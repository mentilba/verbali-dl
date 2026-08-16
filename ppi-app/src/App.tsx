import { NavLink, Route, Routes } from "react-router-dom";
import { DbProvider } from "./lib/db-context";
import Home from "./pages/Home";
import NewPerson from "./pages/NewPerson";
import PotentialTest from "./pages/PotentialTest";
import TaskTest from "./pages/TaskTest";
import Result from "./pages/Result";
import Dashboard from "./pages/Dashboard";
import PeopleList from "./pages/PeopleList";

function App() {
  return (
    <DbProvider>
      <div className="app-shell">
        <header className="app-header">
          <NavLink to="/" className="app-logo">
            PPI
          </NavLink>
          <nav className="app-nav">
            <NavLink to="/persone" className={({ isActive }) => (isActive ? "active" : "")}>
              Persone
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
              Dashboard
            </NavLink>
          </nav>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/nuova-persona" element={<NewPerson />} />
            <Route path="/test-potenziale/:personId" element={<PotentialTest />} />
            <Route path="/test-compito/:personId" element={<TaskTest />} />
            <Route path="/risultato/:personId" element={<Result />} />
            <Route path="/persone" element={<PeopleList />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </DbProvider>
  );
}

export default App;
