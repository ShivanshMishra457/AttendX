# AttendX — Smart Student Attendance System (MERN)

Track attendance by student, subject and date, and generate reports.
**M**ongoDB · **E**xpress.js · **R**eact · **N**ode.js — with JWT login and role-based access (admin / teacher / student).

## Features
- Login + student sign-up, JWT authentication, 3 roles
- **Teacher/Admin:** mark attendance for a whole class in one click, edit or delete records, filter records
- **Admin:** add / edit / delete students, teachers and subjects
- **Student:** sees only their own attendance and report
- **Reports:** per-student % per subject and date range, low-attendance (<75%) flags, charts, CSV download
- Fun, responsive UI

## Setup (Windows / PowerShell)
1. Install **Node.js 18+** and either **MongoDB Community** (runs on `localhost:27017`) or make a free **MongoDB Atlas** cluster.
2. In the project folder:
```powershell
npm run install-all          # installs server + client packages
copy .env.example .env       # then open .env and set MONGO_URI / JWT_SECRET
npm run seed                 # (optional) demo data: students, subjects, 12 days of attendance
npm run dev                  # API on :5000, React app on :5173
```
3. Open **http://localhost:5173**

> No seed? The server auto-creates an admin on first run: `admin@demo.com / admin123`.

### Demo logins (after `npm run seed`)
| Role | Email | Password |
|---|---|---|
| Admin | admin@demo.com | admin123 |
| Teacher | teacher@demo.com | teacher123 |
| Student | student1@demo.com | student123 |

### Single-server mode
`npm run build` then `npm start` → everything served at http://localhost:5000

## Folder structure
```
server/
  index.js            app setup, DB connection, routes
  seed.js             demo data
  models/             User, Subject, Attendance (Mongoose schemas)
  routes/             auth, users, subjects, attendance, reports
  middleware/auth.js  JWT check + role-based access
client/src/
  App.jsx             routes + role guards
  auth.jsx            login state (React Context)
  api.js              fetch helper
  pages/              Login, Dashboard, Mark, Records, Students, Subjects, Reports
  components/         Layout, Modal, Toast, confetti
docs/                 project report
```

## REST API
| Method | Route | Who | Purpose |
|---|---|---|---|
| POST | /api/auth/register | public | student sign-up |
| POST | /api/auth/login | public | get JWT |
| GET | /api/auth/me | logged in | current user |
| GET/POST/PUT/DELETE | /api/users | admin (GET: teacher too) | manage people |
| GET | /api/subjects | all | list subjects |
| POST/PUT/DELETE | /api/subjects | admin | manage subjects |
| GET | /api/attendance | all (students: own only) | list/filter records |
| GET | /api/attendance/sheet | teacher, admin | class sheet for a subject + date |
| POST | /api/attendance/bulk | teacher, admin | save a whole class at once |
| PUT/DELETE | /api/attendance/:id | teacher, admin | edit / delete a record |
| GET | /api/reports/summary | all | dashboard numbers |
| GET | /api/reports/students | all (students: own) | per-student report |
| GET | /api/reports/export.csv | teacher, admin | CSV download |

## Database design
- **users** — name, email (unique), password (bcrypt hash), role, rollNo, section
- **subjects** — name, code (unique), teacher → users
- **attendance** — student → users, subject → subjects, date (YYYY-MM-DD), status (present/absent), markedBy. Unique index on (student, subject, date) so no duplicates.

## Push to GitHub
```powershell
git init
git add .
git commit -m "Smart Student Attendance System - MERN"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```
