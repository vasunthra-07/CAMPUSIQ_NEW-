const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['Maintenance', 'IT', 'Facilities', 'Other'] }, // optional per phase 4
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Open', 'InProgress', 'Resolved', 'Escalated'], default: 'Open' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'] }, // optional
  classifiedAutomatically: { type: Boolean, default: false },
  matchedKeywords: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Ticket', TicketSchema);
