const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
  status: { type: String, enum: ['Reported', 'Investigating', 'Resolved'], default: 'Reported' }
}, { timestamps: true });

module.exports = mongoose.model('Incident', IncidentSchema);
