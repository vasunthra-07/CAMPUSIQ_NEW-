const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Classroom', 'Lab', 'MeetingRoom', 'Equipment'], required: true },
  location: { type: String, required: true },
  capacity: { type: Number, required: true },
  status: { type: String, enum: ['Available', 'Booked', 'Maintenance'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Resource', ResourceSchema);
