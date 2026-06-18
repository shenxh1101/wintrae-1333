import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import ImportPage from '@/pages/Import';
import RulesPage from '@/pages/Rules';
import ResultsPage from '@/pages/Results';
import FixesPage from '@/pages/Fixes';
import ExportPage from '@/pages/Export';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/fixes" element={<FixesPage />} />
          <Route path="/export" element={<ExportPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
