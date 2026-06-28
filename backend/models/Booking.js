const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  purpose: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
