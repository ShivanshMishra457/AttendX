// User model: one collection for admins, teachers and students (role decides what they can do)
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false }, // hashed; hidden from queries by default
    role: { type: String, enum: ['admin', 'teacher', 'student'], default: 'student' },
    rollNo: { type: String, trim: true, default: undefined }, // only for students
    section: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// Roll numbers must be unique, but only among students who actually have one
userSchema.index({ rollNo: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);
