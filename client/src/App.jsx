import { Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Network from './pages/Network.jsx';
import Guides from './pages/Guides.jsx';
import GuideDetail from './pages/GuideDetail.jsx';
import Software from './pages/Software.jsx';
import Workstations from './pages/Workstations.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="reseau" element={<Network />} />
        <Route path="guides" element={<Guides />} />
        <Route path="guides/:stepId" element={<GuideDetail />} />
        <Route path="logiciels" element={<Software />} />
        <Route path="postes" element={<Workstations />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-lg font-semibold text-slate-900">Page introuvable</p>
      <Link to="/" className="mt-2 inline-block text-sm text-brand-600 underline">
        Retour au tableau de bord
      </Link>
    </div>
  );
}
