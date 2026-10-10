import { useState } from 'react';
import { useAuth } from '../auth.jsx';

const DEMOS = [
  { label: '👑 Admin', email: 'admin@demo.com', password: 'admin123' },
  { label: '🧑‍🏫 Teacher', email: 'teacher@demo.com', password: 'teacher123' },
  { label: '🎓 Student', email: 'student1@demo.com', password: 'student123' },
];

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '', rollNo: '', section: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { mode === 'login' ? await login(f.email, f.password) : await register(f); }
    catch (x) { setErr(x.message); }
    setBusy(false);
  };

  return (
    <main className="auth">
      <section className="card hero">
        <div className="logo big">✅ <span>AttendX</span></div>
        <h1>Attendance,<br /><em>but make it</em> <em className="pink">smart.</em></h1>
        <p>Mark in seconds. Track every subject. Catch low attendance before it becomes a problem.</p>
        <div className="stickers"><span>📅</span><span>📊</span><span>🎯</span></div>
      </section>

      <section className="card">
        <div className="tabs">
          <button className={'tab' + (mode === 'login' ? ' active' : '')} onClick={() => setMode('login')}>Login</button>
          <button className={'tab' + (mode === 'register' ? ' active' : '')} onClick={() => setMode('register')}>Student sign up</button>
        </div>
        <form onSubmit={submit}>
          {mode === 'register' && (
            <>
              <label>Full name<input value={f.name} onChange={set('name')} required placeholder="Your name" /></label>
              <div className="two">
                <label>Roll no<input value={f.rollNo} onChange={set('rollNo')} required placeholder="22CS150" /></label>
                <label>Section<input value={f.section} onChange={set('section')} placeholder="CSE-AIML-A" /></label>
              </div>
            </>
          )}
          <label>Email<input type="email" value={f.email} onChange={set('email')} required placeholder="you@college.edu" /></label>
          <label>Password<input type="password" value={f.password} onChange={set('password')} required minLength={mode === 'register' ? 6 : 1} placeholder="••••••" /></label>
          <button className="btn primary block" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? "Let's go →" : 'Create account 🎉'}</button>
          <p className="err">{err}</p>
        </form>
        <div className="demos">
          <small>Quick demo logins</small>
          <div>
            {DEMOS.map((d) => (
              <button key={d.label} className="btn small" type="button" onClick={() => { setMode('login'); setF({ ...f, email: d.email, password: d.password }); }}>{d.label}</button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
