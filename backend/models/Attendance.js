const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Late'], required: true },
  source: { type: String, enum: ['Manual', 'Biometric', 'QR'], required: true },
  markedBy: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
