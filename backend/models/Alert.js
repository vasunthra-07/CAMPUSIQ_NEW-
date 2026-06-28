const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  message: { type: String },
  sentBy: { type: String, required: true },
  type: { type: String, default: 'Parent Alert' }
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
