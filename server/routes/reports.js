// Reports: percentages per student / subject, daily trend, CSV export.
const express = require('express');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { auth, allow } = require('../middleware/auth');
const { wrap, isId, tally } = require('../utils/helpers');

const router = express.Router();
router.use(auth);

const LOW = 75; // below this % a student is flagged "low attendance"

function buildFilter(req) {
  const { subject, from, to } = req.query;
  const f = {};
  if (subject && isId(subject)) f.subject = subject;
  if (from || to) f.date = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  if (req.user.role === 'student') f.student = req.user._id;
  return f;
}

// Per-student report rows
async function studentRows(req) {
  const records = await Attendance.find(buildFilter(req));
  const byStudent = new Map();
  for (const r of records) {
    const k = String(r.student);
    if (!byStudent.has(k)) byStudent.set(k, []);
    byStudent.get(k).push(r);
  }
  const studentFilter = req.user.role === 'student' ? { _id: req.user._id } : { role: 'student' };
  const students = await User.find(studentFilter).sort({ rollNo: 1 });
  return students.map((s) => ({
    student: { _id: s._id, name: s.name, rollNo: s.rollNo, section: s.section },
    ...tally(byStudent.get(String(s._id)) || []),
  })).map((r) => ({ ...r, low: r.total > 0 && r.percent < LOW }));
}

// GET /api/reports/students?subject=&from=&to=
router.get('/students', wrap(async (req, res) => res.json({ threshold: LOW, rows: await studentRows(req) })));

// GET /api/reports/summary  -> dashboard numbers
router.get('/summary', wrap(async (req, res) => {
  const records = await Attendance.find(buildFilter({ ...req, query: {}, user: req.user }));
  const subjects = await Subject.find().sort({ code: 1 });

  const bySubject = subjects.map((s) => ({
    subject: { _id: s._id, name: s.name, code: s.code },
    ...tally(records.filter((r) => String(r.subject) === String(s._id))),
  }));

  const days = [...new Set(records.map((r) => r.date))].sort().slice(-10);
  const trend = days.map((d) => ({ date: d, ...tally(records.filter((r) => r.date === d)) }));

  const out = { overall: tally(records), bySubject, trend, threshold: LOW };
  if (req.user.role !== 'student') {
    const rows = await studentRows({ ...req, query: {}, user: req.user });
    out.counts = { students: rows.length, subjects: subjects.length, low: rows.filter((r) => r.low).length };
    out.lowList = rows.filter((r) => r.low).sort((a, b) => a.percent - b.percent).slice(0, 5);
  }
  res.json(out);
}));

// GET /api/reports/export.csv
router.get('/export.csv', allow('admin', 'teacher'), wrap(async (req, res) => {
  const rows = await studentRows(req);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [['Roll No', 'Name', 'Section', 'Present', 'Absent', 'Total', 'Percent', 'Status'].join(',')];
  for (const r of rows)
    lines.push([r.student.rollNo, r.student.name, r.student.section, r.present, r.absent, r.total, r.percent, r.low ? 'LOW' : 'OK'].map(esc).join(','));
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.csv"');
  res.send(lines.join('\n'));
}));

module.exports = router;
