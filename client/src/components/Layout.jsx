import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

const LINKS = [
  { to: '/', label: '🏠 Dashboard', roles: ['admin', 'teacher', 'student'], end: true },
  { to: '/mark', label: '✍️ Mark', roles: ['admin', 'teacher'] },
  { to: '/records', label: '📋 Records', roles: ['admin', 'teacher'] },
  { to: '/records', label: '📋 My Attendance', roles: ['student'] },
  { to: '/students', label: '🎓 Students', roles: ['admin', 'teacher'] },
  { to: '/subjects', label: '📚 Subjects', roles: ['admin', 'teacher'] },
  { to: '/reports', label: '📊 Reports', roles: ['admin', 'teacher', 'student'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <header className="top">
        <div className="logo">✅ <span>AttendX</span></div>
        <nav className="nav">
          {LINKS.filter((l) => l.roles.includes(user.role)).map((l) => (
            <NavLink key={l.label} to={l.to} end={l.end} className={({ isActive }) => 'navlink' + (isActive ? ' active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="userbar">
          <span className="chip">{user.name.split(' ')[0]} · <b>{user.role}</b></span>
          <button className="btn small" onClick={logout}>Logout</button>
        </div>
      </header>
      <main className="page"><Outlet /></main>
    </div>
  );
}
