const mongoose = require('mongoose');

// Wraps async route handlers so errors go to the central error handler
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const isId = (v) => mongoose.isValidObjectId(v);
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v));

// Turns raw attendance rows into { present, absent, total, percent }
function tally(rows) {
  const present = rows.filter((r) => r.status === 'present').length;
  const total = rows.length;
  return { present, absent: total - present, total, percent: total ? Math.round((present / total) * 1000) / 10 : 0 };
}

module.exports = { wrap, isId, isDate, tally };
