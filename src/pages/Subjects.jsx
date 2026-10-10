import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Modal from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';

const COLORS = ['#ff5d8f', '#4d8dff', '#ffd23f', '#2ee6a6', '#9b5cff'];

export default function Subjects() {
  const admin = useAuth().user.role === 'admin';
  const toast = useToast();
  const [list, setList] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = () => api('/subjects').then(setList);
  useEffect(() => { load(); if (admin) api('/users?role=teacher').then(setTeachers); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      const body = { name: form.name, code: form.code, teacher: form.teacher || null };
      if (form._id) await api('/subjects/' + form._id, { method: 'PUT', body }); else await api('/subjects', { method: 'POST', body });
      toast(form._id ? 'Updated ✏️' : 'Subject added 🎉'); setForm(null); load();
    } catch (x) { toast(x.message); }
  };
  const del = async (s) => {
    if (!confirm(`Delete ${s.code}? All its attendance will be deleted.`)) return;
    try { await api('/subjects/' + s._id, { method: 'DELETE' }); toast('Deleted 🗑'); load(); } catch (x) { toast(x.message); }
  };

  return (
    <>
      <h1 className="title">Subjects 📚</h1>
      {admin && <div className="toolbar"><button className="btn green" onClick={() => setForm({ name: '', code: '', teacher: '' })}>+ Add subject</button></div>}
      <div className="subcards">
        {list.map((s, i) => (
          <div key={s._id} className="card mini" style={{ background: COLORS[i % COLORS.length] + '33' }}>
            <h3>{s.code}</h3><p><b>{s.name}</b></p><small>👩‍🏫 {s.teacher?.name || 'Not assigned'}</small>
            {admin && <div className="acts"><button className="btn small" onClick={() => setForm({ ...s, teacher: s.teacher?._id || '' })}>Edit</button><button className="btn small pink" onClick={() => del(s)}>🗑</button></div>}
          </div>
        ))}
        {list.length === 0 && <div className="card empty">No subjects yet.</div>}
      </div>

      {form && (
        <Modal title={form._id ? 'Edit subject' : 'Add subject'} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <label>Subject name<input value={form.name} onChange={set('name')} required /></label>
            <label>Code<input value={form.code} onChange={set('code')} required placeholder="BWT" /></label>
            <label>Teacher<select value={form.teacher} onChange={set('teacher')}><option value="">— none —</option>{teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</select></label>
            <button className="btn primary block">{form._id ? 'Save changes' : 'Add'}</button>
          </form>
        </Modal>
      )}
    </>
  );
}
