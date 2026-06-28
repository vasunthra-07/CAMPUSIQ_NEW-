const mongoose = require('mongoose');

const EventRegistrationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checkedIn: { type: Boolean, default: false },
  checkedInAt: { type: Date },
  certificateIssued: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('EventRegistration', EventRegistrationSchema);
