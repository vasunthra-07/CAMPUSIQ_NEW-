const mongoose = require('mongoose');

const MaintenanceLogSchema = new mongoose.Schema({
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  scheduledDate: { type: Date, required: true },
  completedDate: { type: Date },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  status: { type: String, enum: ['Scheduled', 'InProgress', 'Completed', 'Cancelled'], default: 'Scheduled' }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceLog', MaintenanceLogSchema);
