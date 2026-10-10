import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

const COLORS = ['#ff5d8f', '#4d8dff', '#ffd23f', '#2ee6a6', '#9b5cff'];
const emoji = (p) => (p >= 90 ? '🔥' : p >= 75 ? '👍' : '⚠️');

export default function Dashboard() {
  const { user } = useAuth();
  const staff = user.role !== 'student';
  const [d, setD] = useState(null);
  useEffect(() => { api('/reports/summary').then(setD); }, []);
  if (!d) return <p className="muted">Loading…</p>;

  return (
    <>
      <h1 className="title">Hey {user.name.split(' ')[0]} 👋</h1>
      <p className="muted">{staff ? "Here's how attendance is looking across the class." : 'Here is how your attendance is looking.'}</p>

      <section className="stats">
        <div className="stat s1"><b>{d.overall.percent}%</b><span>Overall {emoji(d.overall.percent)}</span></div>
        <div className="stat s3"><b>{d.overall.present}</b><span>Present</span></div>
        <div className="stat s2"><b>{d.overall.absent}</b><span>Absent</span></div>
        {staff
          ? <div className="stat s4"><b>{d.counts.students}</b><span>Students · {d.counts.low} low ⚠️</span></div>
          : <div className="stat s4"><b>{d.overall.total}</b><span>Classes total</span></div>}
      </section>

      {d.overall.total === 0 ? (
        <div className="card empty">No attendance marked yet. {staff && 'Head to “Mark” to take the first one! ✍️'}</div>
      ) : (
        <section className="grid2">
          <div className="card">
            <h2>Subject-wise %</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={d.bySubject.map((s) => ({ name: s.subject.code, percent: s.percent }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#16131f33" />
                <XAxis dataKey="name" stroke="#16131f" /><YAxis domain={[0, 100]} stroke="#16131f" />
                <Tooltip />
                <Bar dataKey="percent" stroke="#16131f" strokeWidth={2} radius={[8, 8, 0, 0]}>
                  {d.bySubject.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h2>Last {d.trend.length} class days</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={d.trend.map((t) => ({ name: t.date.slice(5), percent: t.percent }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#16131f33" />
                <XAxis dataKey="name" stroke="#16131f" /><YAxis domain={[0, 100]} stroke="#16131f" />
                <Tooltip />
                <Line type="monotone" dataKey="percent" stroke="#9b5cff" strokeWidth={4} dot={{ r: 5, fill: '#ffd23f', stroke: '#16131f', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {staff && d.lowList?.length > 0 && (
        <div className="card warn">
          <h2>⚠️ Needs attention (below {d.threshold}%)</h2>
          <ul className="lowlist">
            {d.lowList.map((r) => (
              <li key={r.student._id}><span>{r.student.name} <small>{r.student.rollNo}</small></span><b>{r.percent}%</b></li>
            ))}
          </ul>
        </div>
      )}
      {!staff && (
        <div className="subcards">
          {d.bySubject.map((s, i) => (
            <div key={s.subject._id} className="card mini" style={{ background: COLORS[i % COLORS.length] + '33' }}>
              <h3>{s.subject.code}</h3><div className="big">{s.percent}%</div>
              <small>{s.present}/{s.total} classes</small>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
