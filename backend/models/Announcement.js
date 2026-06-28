const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  scope: { type: String, enum: ['Global', 'Department', 'Role'], required: true },
  department: { type: String },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  priority: { type: String, enum: ['Normal', 'High', 'Urgent'], default: 'Normal' }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
