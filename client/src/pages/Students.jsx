import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Modal from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';

const blank = { name: '', email: '', password: '', role: 'student', rollNo: '', section: '' };

export default function Students() {
  const { user } = useAuth();
  const admin = user.role === 'admin';
  const toast = useToast();
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('student');
  const [form, setForm] = useState(null); // null = closed, object = open (with _id when editing)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = () => api(`/users?role=${role}&q=${encodeURIComponent(q)}`).then(setList).catch((e) => toast(e.message));
  useEffect(() => { load(); }, [q, role]);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (form._id) await api('/users/' + form._id, { method: 'PUT', body: form });
      else await api('/users', { method: 'POST', body: form });
      toast(form._id ? 'Updated ✏️' : 'Added 🎉'); setForm(null); load();
    } catch (x) { toast(x.message); }
  };
  const del = async (u) => {
    if (!confirm(`Delete ${u.name}? Their attendance records will be deleted too.`)) return;
    try { await api('/users/' + u._id, { method: 'DELETE' }); toast('Deleted 🗑'); load(); } catch (x) { toast(x.message); }
  };

  return (
    <>
      <h1 className="title">People 🎓</h1>
      <div className="card toolbar">
        <label>Search<input placeholder="name, email or roll no" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <label>Show<select value={role} onChange={(e) => setRole(e.target.value)}><option value="student">Students</option>{admin && <option value="teacher">Teachers</option>}{admin && <option value="admin">Admins</option>}</select></label>
        {admin && <button className="btn green" onClick={() => setForm({ ...blank, role })}>+ Add {role}</button>}
      </div>

      <div className="card tablewrap">
        <table>
          <thead><tr><th>Roll no</th><th>Name</th><th>Email</th><th>Section</th>{admin && <th>Actions</th>}</tr></thead>
          <tbody>
            {list.map((u) => (
              <tr key={u._id}>
                <td>{u.rollNo || '—'}</td><td><b>{u.name}</b></td><td>{u.email}</td><td>{u.section || '—'}</td>
                {admin && <td className="acts"><button className="btn small" onClick={() => setForm({ ...u, password: '' })}>Edit</button><button className="btn small pink" onClick={() => del(u)}>🗑</button></td>}
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="empty">No one here yet ✨</td></tr>}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal title={form._id ? 'Edit person' : `Add ${form.role}`} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <label>Name<input value={form.name} onChange={set('name')} required /></label>
            <label>Email<input type="email" value={form.email} onChange={set('email')} required /></label>
            <label>{form._id ? 'New password (leave blank to keep)' : 'Password'}<input type="password" value={form.password} onChange={set('password')} required={!form._id} minLength={form._id ? 0 : 6} /></label>
            <div className="two">
              <label>Role<select value={form.role} onChange={set('role')}><option>student</option><option>teacher</option><option>admin</option></select></label>
              {form.role === 'student' && <label>Roll no<input value={form.rollNo || ''} onChange={set('rollNo')} required /></label>}
            </div>
            {form.role === 'student' && <label>Section<input value={form.section || ''} onChange={set('section')} /></label>}
            <button className="btn primary block">{form._id ? 'Save changes' : 'Add'}</button>
          </form>
        </Modal>
      )}
    </>
  );
}
