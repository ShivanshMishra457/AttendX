// Fills the database with demo data:  npm run seed
// WARNING: wipes users, subjects and attendance first.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Subject = require('./models/Subject');
const Attendance = require('./models/Attendance');

const students = ['Aarav Sharma', 'Diya Reddy', 'Rohan Verma', 'Ananya Iyer', 'Kabir Singh', 'Meera Nair', 'Vihaan Gupta', 'Ishita Rao', 'Arjun Patel', 'Sara Khan'];
// Each student gets a different "attendance habit" so reports look interesting
const habit = [0.95, 0.9, 0.6, 0.85, 0.7, 0.98, 0.5, 0.8, 0.92, 0.72];

function lastWeekdays(n) {
  const out = []; const d = new Date();
  while (out.length < n) {
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() - 1);
  }
  return out.reverse();
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_attendance');
  await Promise.all([User.deleteMany({}), Subject.deleteMany({}), Attendance.deleteMany({})]);

  const hash = (p) => bcrypt.hashSync(p, 10);
  await User.create({ name: 'Admin', email: 'admin@demo.com', role: 'admin', password: hash('admin123') });
  const teacher = await User.create({ name: 'Prof. Rao', email: 'teacher@demo.com', role: 'teacher', password: hash('teacher123') });

  const subs = await Subject.insertMany([
    { name: 'Backend Web Technologies', code: 'BWT', teacher: teacher._id },
    { name: 'Design & Analysis of Algorithms', code: 'DAA', teacher: teacher._id },
    { name: 'Machine Learning', code: 'ML', teacher: teacher._id },
    { name: 'Database Management', code: 'DBMS', teacher: teacher._id },
  ]);

  const users = [];
  for (let i = 0; i < students.length; i++)
    users.push(await User.create({
      name: students[i], email: `student${i + 1}@demo.com`, role: 'student',
      rollNo: `22CS${String(101 + i)}`, section: 'CSE-AIML-A', password: hash('student123'),
    }));

  const days = lastWeekdays(12);
  const rows = [];
  for (const day of days)
    for (const sub of subs)
      users.forEach((u, i) => rows.push({
        student: u._id, subject: sub._id, date: day, markedBy: teacher._id,
        status: Math.random() < habit[i] ? 'present' : 'absent',
      }));
  await Attendance.insertMany(rows);

  console.log(`🌱 Seeded: ${users.length} students, ${subs.length} subjects, ${rows.length} attendance records`);
  console.log('Logins -> admin@demo.com / admin123 | teacher@demo.com / teacher123 | student1@demo.com / student123');
  await mongoose.disconnect();
})();
