const express = require('express');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const { auth, allow } = require('../middleware/auth');
const { wrap, isId } = require('../utils/helpers');

const router = express.Router();
router.use(auth);

// GET /api/subjects  (everyone logged in)
router.get('/', wrap(async (req, res) => {
  res.json(await Subject.find().populate('teacher', 'name email').sort({ code: 1 }));
}));

// POST /api/subjects  (admin)
router.post('/', allow('admin'), wrap(async (req, res) => {
  const { name, code, teacher } = req.body || {};
  if (!name || !code) return res.status(400).json({ error: 'Name and code are required' });
  if (await Subject.findOne({ code: code.toUpperCase() })) return res.status(409).json({ error: 'Subject code already exists' });
  const s = await Subject.create({ name, code, teacher: teacher && isId(teacher) ? teacher : null });
  res.status(201).json(await s.populate('teacher', 'name email'));
}));

// PUT /api/subjects/:id  (admin)
router.put('/:id', allow('admin'), wrap(async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Bad id' });
  const s = await Subject.findById(req.params.id);
  if (!s) return res.status(404).json({ error: 'Subject not found' });
  const { name, code, teacher } = req.body || {};
  if (name) s.name = name;
  if (code) s.code = code;
  if (teacher !== undefined) s.teacher = teacher && isId(teacher) ? teacher : null;
  try { await s.save(); } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Subject code already exists' });
    throw e;
  }
  res.json(await s.populate('teacher', 'name email'));
}));

// DELETE /api/subjects/:id  (admin; removes its attendance too)
router.delete('/:id', allow('admin'), wrap(async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Bad id' });
  const s = await Subject.findByIdAndDelete(req.params.id);
  if (!s) return res.status(404).json({ error: 'Subject not found' });
  await Attendance.deleteMany({ subject: s._id });
  res.json({ ok: true });
}));

module.exports = router;
