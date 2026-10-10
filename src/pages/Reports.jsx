// Per-student attendance report with filters, low-attendance flags and CSV download.
import { useEffect, useState } from 'react';
import { api, qs } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Reports() {
  const staff = useAuth().user.role !== 'student';
  const toast = useToast();
  const [subjects, setSubjects] = useState([]);
  const [f, setF] = useState({ subject: '', from: '', to: '' });
  const [data, setData] = useState({ threshold: 75, rows: [] });
  const [onlyLow, setOnlyLow] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { api('/subjects').then(setSubjects); }, []);
  useEffect(() => { api('/reports/students' + qs(f)).then(setData).catch((e) => toast(e.message)); }, [f]);

  const download = async () => {
    const res = await api('/reports/export.csv' + qs(f), { raw: true });
    if (!res.ok) return toast('Download failed');
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement('a'), { href: url, download: 'attendance-report.csv' });
    a.click(); URL.revokeObjectURL(url);
  };

  const rows = onlyLow ? data.rows.filter((r) => r.low) : data.rows;
  const color = (p) => (p >= 90 ? 'var(--green)' : p >= data.threshold ? 'var(--yellow)' : 'var(--pink)');

  return (
    <>
      <h1 className="title">Reports 📊</h1>
      <div className="card toolbar">
        <label>Subject<select value={f.subject} onChange={set('subject')}><option value="">All subjects</option>{subjects.map((s) => <option key={s._id} value={s._id}>{s.code}</option>)}</select></label>
        <label>From<input type="date" value={f.from} onChange={set('from')} /></label>
        <label>To<input type="date" value={f.to} onChange={set('to')} /></label>
        {staff && <label className="check"><input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} /> Only below {data.threshold}%</label>}
        {staff && <button className="btn green" onClick={download}>⬇ Download CSV</button>}
      </div>

      <div className="card tablewrap">
        <table>
          <thead><tr><th>Roll no</th><th>Student</th><th>Present</th><th>Absent</th><th>Total</th><th style={{ minWidth: 180 }}>Attendance</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.student._id}>
                <td>{r.student.rollNo}</td><td><b>{r.student.name}</b></td>
                <td>{r.present}</td><td>{r.absent}</td><td>{r.total}</td>
                <td><div className="bar"><i style={{ width: r.percent + '%', background: color(r.percent) }} /><span>{r.percent}%</span></div></td>
                <td>{r.low ? <span className="pill absent">⚠ Low</span> : r.total ? <span className="pill present">OK</span> : <small>no data</small>}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="empty">Nothing to show ✨</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
