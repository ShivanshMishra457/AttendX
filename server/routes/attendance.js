// Attendance CRUD. Teachers/admins mark & edit; students can only VIEW their own.
const express = require('express');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { auth, allow } = require('../middleware/auth');
const { wrap, isId, isDate } = require('../utils/helpers');

const router = express.Router();
router.use(auth);

// GET /api/attendance?subject=&student=&date=&from=&to=&status=
router.get('/', wrap(async (req, res) => {
  const { subject, student, date, from, to, status } = req.query;
  const filter = {};
  if (subject && isId(subject)) filter.subject = subject;
  if (status && ['present', 'absent'].includes(status)) filter.status = status;
  if (date) filter.date = date;
  else if (from || to) filter.date = { ...(from && { $gte: from }), ...(to && { $lte: to }) };

  if (req.user.role === 'student') filter.student = req.user._id;          // students: own records only
  else if (student && isId(student)) filter.student = student;

  const rows = await Attendance.find(filter)
    .populate('student', 'name rollNo section')
    .populate('subject', 'name code')
    .sort({ date: -1 })
    .limit(500);
  res.json(rows);
}));

// GET /api/attendance/sheet?subject=&date=  -> every student + today's status (for the marking screen)
router.get('/sheet', allow('admin', 'teacher'), wrap(async (req, res) => {
  const { subject, date } = req.query;
  if (!isId(subject) || !isDate(date)) return res.status(400).json({ error: 'Valid subject and date (YYYY-MM-DD) are required' });

  const students = await User.find({ role: 'student' }).sort({ rollNo: 1 });
  const existing = await Attendance.find({ subject, date });
  const map = new Map(existing.map((r) => [String(r.student), r]));

  res.json(students.map((s) => ({
    student: { _id: s._id, name: s.name, rollNo: s.rollNo, section: s.section },
    status: map.get(String(s._id))?.status || null,
    recordId: map.get(String(s._id))?._id || null,
  })));
}));

// POST /api/attendance/bulk  { subject, date, records: [{ student, status }] }  (upsert = insert or update)
router.post('/bulk', allow('admin', 'teacher'), wrap(async (req, res) => {
  const { subject, date, records } = req.body || {};
  if (!isId(subject) || !isDate(date)) return res.status(400).json({ error: 'Valid subject and date are required' });
  if (!Array.isArray(records) || !records.length) return res.status(400).json({ error: 'No records to save' });
  if (!(await Subject.exists({ _id: subject }))) return res.status(404).json({ error: 'Subject not found' });

  const clean = records.filter((r) => isId(r.student) && ['present', 'absent'].includes(r.status));
  if (!clean.length) return res.status(400).json({ error: 'No valid records' });

  await Attendance.bulkWrite(clean.map((r) => ({
    updateOne: {
      filter: { student: r.student, subject, date },
      update: { $set: { status: r.status, markedBy: req.user._id } },
      upsert: true,
    },
  })));
  res.status(201).json({ saved: clean.length });
}));

// PUT /api/attendance/:id  { status }
router.put('/:id', allow('admin', 'teacher'), wrap(async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Bad id' });
  if (!['present', 'absent'].includes(req.body?.status)) return res.status(400).json({ error: 'Status must be present or absent' });
  const rec = await Attendance.findByIdAndUpdate(req.params.id, { status: req.body.status, markedBy: req.user._id }, { new: true })
    .populate('student', 'name rollNo section').populate('subject', 'name code');
  if (!rec) return res.status(404).json({ error: 'Record not found' });
  res.json(rec);
}));

// DELETE /api/attendance/:id
router.delete('/:id', allow('admin', 'teacher'), wrap(async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Bad id' });
  const rec = await Attendance.findByIdAndDelete(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Record not found' });
  res.json({ ok: true });
}));

module.exports = router;
