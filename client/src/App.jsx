import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Mark from './pages/Mark.jsx';
import Records from './pages/Records.jsx';
import Students from './pages/Students.jsx';
import Subjects from './pages/Subjects.jsx';
import Reports from './pages/Reports.jsx';

// Route guard: redirects to /login if not logged in, to / if the role isn't allowed
function Guard({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash">Loading… ⏳</div>;

  return (
    <>
      <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route element={<Guard><Layout /></Guard>}>
          <Route index element={<Dashboard />} />
          <Route path="mark" element={<Guard roles={['admin', 'teacher']}><Mark /></Guard>} />
          <Route path="records" element={<Records />} />
          <Route path="students" element={<Guard roles={['admin', 'teacher']}><Students /></Guard>} />
          <Route path="subjects" element={<Guard roles={['admin', 'teacher']}><Subjects /></Guard>} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
