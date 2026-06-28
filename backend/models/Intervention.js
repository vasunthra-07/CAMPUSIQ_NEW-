const mongoose = require('mongoose');

const InterventionSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  type: { type: String, required: true },
  note: { type: String },
  createdBy: { type: String, required: true },
  createdByRole: { type: String },
  status: { type: String, default: 'Active', enum: ['Active', 'Resolved', 'Escalated'] },
}, { timestamps: true });

module.exports = mongoose.model('Intervention', InterventionSchema);
