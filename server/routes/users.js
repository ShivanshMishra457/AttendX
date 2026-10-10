// Manage people. Admin = full control. Teacher = can view students.
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { auth, allow } = require('../middleware/auth');
const { wrap, isId } = require('../utils/helpers');

const router = express.Router();
router.use(auth);

// GET /api/users?role=student&q=ravi
router.get('/', allow('admin', 'teacher'), wrap(async (req, res) => {
  const { role, q } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (q) {
    const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { rollNo: rx }];
  }
  res.json(await User.find(filter).sort({ role: 1, rollNo: 1, name: 1 }));
}));

// POST /api/users  (admin creates teachers/students/admins)
router.post('/', allow('admin'), wrap(async (req, res) => {
  const { name, email, password, role = 'student', rollNo, section } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (!['admin', 'teacher', 'student'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  if (role === 'student' && !rollNo) return res.status(400).json({ error: 'Roll no is required for students' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ error: 'Email already exists' });
  if (rollNo && (await User.findOne({ rollNo }))) return res.status(409).json({ error: 'Roll number already exists' });

  const user = await User.create({ name, email, role, section, rollNo: role === 'student' ? rollNo : undefined, password: await bcrypt.hash(password, 10) });
  res.status(201).json(await User.findById(user._id));
}));

// PUT /api/users/:id
router.put('/:id', allow('admin'), wrap(async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Bad id' });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, email, role, rollNo, section, password } = req.body || {};
  if (name) user.name = name;
  if (email) user.email = email;
  if (section !== undefined) user.section = section;
  if (role && ['admin', 'teacher', 'student'].includes(role)) user.role = role;
  if (rollNo !== undefined) user.rollNo = rollNo || undefined;
  if (password) user.password = await bcrypt.hash(password, 10);
  try { await user.save(); } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Email or roll number already in use' });
    throw e;
  }
  res.json(await User.findById(user._id));
}));

// DELETE /api/users/:id  (also removes that student's attendance)
router.delete('/:id', allow('admin'), wrap(async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Bad id' });
  if (String(req.user._id) === req.params.id) return res.status(400).json({ error: "You can't delete yourself" });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await user.deleteOne();
  await Attendance.deleteMany({ student: user._id });
  res.json({ ok: true });
}));

module.exports = router;
