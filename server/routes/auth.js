const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { wrap } = require('../utils/helpers');

const router = express.Router();
const sign = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, rollNo: u.rollNo, section: u.section });

// POST /api/auth/register  -> public sign-up always creates a STUDENT
router.post('/register', wrap(async (req, res) => {
  const { name, email, password, rollNo, section } = req.body || {};
  if (!name || !email || !password || !rollNo) return res.status(400).json({ error: 'Name, email, roll no and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ error: 'Email already registered' });
  if (await User.findOne({ rollNo })) return res.status(409).json({ error: 'Roll number already registered' });

  const user = await User.create({ name, email, rollNo, section, role: 'student', password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(user), user: publicUser(user) });
}));

// POST /api/auth/login
router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password || '', user.password)))
    return res.status(401).json({ error: 'Wrong email or password' });
  res.json({ token: sign(user), user: publicUser(user) });
}));

// GET /api/auth/me  -> who am I? (used to restore the session on page refresh)
router.get('/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;
