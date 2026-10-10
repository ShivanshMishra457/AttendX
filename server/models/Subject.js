const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // who teaches it
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
