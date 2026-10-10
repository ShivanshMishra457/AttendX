// View / filter / edit / delete attendance records. Students see only their own (read-only).
import { useEffect, useState } from 'react';
import { api, qs } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Records() {
  const { user } = useAuth();
  const staff = user.role !== 'student';
  const toast = useToast();
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [f, setF] = useState({ subject: '', student: '', status: '', from: '', to: '' });
  const [rows, setRows] = useState([]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    api('/subjects').then(setSubjects);
    if (staff) api('/users?role=student').then(setStudents);
  }, []);
  const load = () => api('/attendance' + qs(f)).then(setRows).catch((e) => toast(e.message));
  useEffect(() => { load(); }, [f]);

  const flip = async (r) => {
    const status = r.status === 'present' ? 'absent' : 'present';
    try { await api('/attendance/' + r._id, { method: 'PUT', body: { status } }); toast('Updated ✏️'); load(); }
    catch (e) { toast(e.message); }
  };
  const del = async (r) => {
    if (!confirm('Delete this record?')) return;
    try { await api('/attendance/' + r._id, { method: 'DELETE' }); toast('Deleted 🗑'); load(); }
    catch (e) { toast(e.message); }
  };

  return (
    <>
      <h1 className="title">{staff ? 'Attendance records 📋' : 'My attendance 📋'}</h1>
      <div className="card toolbar">
        <label>Subject<select value={f.subject} onChange={set('subject')}><option value="">All</option>{subjects.map((s) => <option key={s._id} value={s._id}>{s.code}</option>)}</select></label>
        {staff && <label>Student<select value={f.student} onChange={set('student')}><option value="">All</option>{students.map((s) => <option key={s._id} value={s._id}>{s.rollNo} · {s.name}</option>)}</select></label>}
        <label>Status<select value={f.status} onChange={set('status')}><option value="">All</option><option value="present">Present</option><option value="absent">Absent</option></select></label>
        <label>From<input type="date" value={f.from} onChange={set('from')} /></label>
        <label>To<input type="date" value={f.to} onChange={set('to')} /></label>
      </div>

      <div className="card tablewrap">
        <table>
          <thead><tr><th>Date</th>{staff && <th>Student</th>}<th>Subject</th><th>Status</th>{staff && <th>Actions</th>}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                <td>{r.date}</td>
                {staff && <td>{r.student?.name} <small>{r.student?.rollNo}</small></td>}
                <td><span className="tag">{r.subject?.code}</span></td>
                <td><span className={'pill ' + r.status}>{r.status === 'present' ? '✓ Present' : '✕ Absent'}</span></td>
                {staff && <td className="acts"><button className="btn small" onClick={() => flip(r)}>Flip</button><button className="btn small pink" onClick={() => del(r)}>🗑</button></td>}
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="empty">Nothing found ✨</td></tr>}
          </tbody>
        </table>
      </div>
      {rows.length === 500 && <p className="muted">Showing the latest 500 records. Use filters to narrow down.</p>}
    </>
  );
}
