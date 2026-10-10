// The "take attendance" screen: pick subject + date, tap Present/Absent for each student, save once.
import { useEffect, useMemo, useState } from 'react';
import { api, today } from '../api.js';
import { useToast } from '../components/Toast.jsx';
import { confetti } from '../components/confetti.js';

export default function Mark() {
  const toast = useToast();
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(today());
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api('/subjects').then((s) => { setSubjects(s); if (s[0]) setSubject(s[0]._id); }); }, []);
  useEffect(() => {
    if (!subject || !date) return;
    api(`/attendance/sheet?subject=${subject}&date=${date}`).then(setRows).catch((e) => toast(e.message));
  }, [subject, date]);

  const setStatus = (id, status) => setRows((r) => r.map((x) => (x.student._id === id ? { ...x, status } : x)));
  const setAll = (status) => setRows((r) => r.map((x) => ({ ...x, status })));
  const counts = useMemo(() => ({
    p: rows.filter((r) => r.status === 'present').length,
    a: rows.filter((r) => r.status === 'absent').length,
    n: rows.filter((r) => !r.status).length,
  }), [rows]);

  const save = async () => {
    const records = rows.filter((r) => r.status).map((r) => ({ student: r.student._id, status: r.status }));
    if (!records.length) return toast('Mark at least one student first');
    setSaving(true);
    try {
      await api('/attendance/bulk', { method: 'POST', body: { subject, date, records } });
      toast(`Saved ${records.length} records ✅`); confetti();
    } catch (e) { toast(e.message); }
    setSaving(false);
  };

  return (
    <>
      <h1 className="title">Mark attendance ✍️</h1>
      <div className="card toolbar">
        <label>Subject
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.code} — {s.name}</option>)}
          </select>
        </label>
        <label>Date<input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} /></label>
        <div className="row">
          <button className="btn green" onClick={() => setAll('present')}>All present</button>
          <button className="btn pink" onClick={() => setAll('absent')}>All absent</button>
        </div>
      </div>

      <div className="stats small">
        <div className="stat s3"><b>{counts.p}</b><span>Present</span></div>
        <div className="stat s2"><b>{counts.a}</b><span>Absent</span></div>
        <div className="stat s1"><b>{counts.n}</b><span>Not marked</span></div>
      </div>

      {rows.length === 0 ? <div className="card empty">No students yet. Ask the admin to add some 🎓</div> : (
        <div className="sheet">
          {rows.map((r) => (
            <div key={r.student._id} className={'srow card ' + (r.status || '')}>
              <div className="avatar">{r.student.name[0]}</div>
              <div className="who"><b>{r.student.name}</b><small>{r.student.rollNo} · {r.student.section || '—'}</small></div>
              <div className="toggle">
                <button className={'btn small' + (r.status === 'present' ? ' green on' : '')} onClick={() => setStatus(r.student._id, 'present')}>✓ Present</button>
                <button className={'btn small' + (r.status === 'absent' ? ' pink on' : '')} onClick={() => setStatus(r.student._id, 'absent')}>✕ Absent</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="stickybar"><button className="btn primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : '💾 Save attendance'}</button></div>
    </>
  );
}
