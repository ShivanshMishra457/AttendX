// Entry point: connects to MongoDB, sets up Express, mounts routes.
require('dotenv').config({ quiet: true });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const User = require('./models/User');

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/reports', require('./routes/reports'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: mongoose.connection.readyState === 1 }));
app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));

// After `npm run build`, Express can also serve the React app (single-server deploy)
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_attendance';

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    console.log('✅ MongoDB connected');
    // First run: make sure an admin exists so you can log in
    if (!(await User.exists({ role: 'admin' }))) {
      await User.create({ name: 'Admin', email: 'admin@demo.com', role: 'admin', password: await bcrypt.hash('admin123', 10) });
      console.log('👑 Created default admin -> admin@demo.com / admin123');
    }
    app.listen(PORT, () => console.log(`🚀 API running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Could not connect to MongoDB:', err.message);
    console.error('   Is MongoDB running? Check MONGO_URI in your .env file.');
    process.exit(1);
  });
