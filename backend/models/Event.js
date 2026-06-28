const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  location: { type: String, required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  capacity: { type: Number, required: true },
  registrationOpen: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
