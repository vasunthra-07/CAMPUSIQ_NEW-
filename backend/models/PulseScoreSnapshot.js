const mongoose = require('mongoose');

const PulseScoreSnapshotSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  score: { type: Number, required: true },
  breakdown: [{
    label: { type: String },
    weight: { type: Number },
    rawValue: { type: Number },
    contribution: { type: Number }
  }],
  computedFrom: {
    attendanceRate: { type: Number },
    resourceUtilizationRate: { type: Number },
    ticketResolutionRate: { type: Number },
    eventParticipationRate: { type: Number },
    infrastructureHealthRate: { type: Number }
  }
}, { timestamps: true });

module.exports = mongoose.model('PulseScoreSnapshot', PulseScoreSnapshotSchema);
